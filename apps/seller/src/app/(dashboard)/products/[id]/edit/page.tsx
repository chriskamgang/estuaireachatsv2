'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, X, Package, Bot, Loader2, Sparkles, CheckCircle, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';

const AI_API_URL = '/api/ai-product-analyze';

interface CategoryOption {
  value: string;
  label: string;
}

type TabId = 'info' | 'images' | 'prix' | 'expedition' | 'seo';

const tabs: { id: TabId; label: string }[] = [
  { id: 'info', label: 'Informations' },
  { id: 'images', label: 'Images' },
  { id: 'prix', label: 'Prix & Paliers' },
  { id: 'expedition', label: 'Expedition' },
  { id: 'seo', label: 'SEO' },
];

interface PrixPalier {
  id: number;
  minQty: number;
  maxQty: number;
  prix: number;
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('info');
  const [saving, setSaving] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categoriesOptions, setCategoriesOptions] = useState<CategoryOption[]>([
    { value: '', label: 'Selectionner une categorie' },
  ]);

  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [aiError, setAiError] = useState('');

  const [nom, setNom] = useState('');
  const [categorie, setCategorie] = useState('');
  const [marque, setMarque] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [unite, setUnite] = useState('piece');
  const [tags, setTags] = useState('');

  const [mainImage, setMainImage] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [suggestedImages, setSuggestedImages] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);

  const [moq, setMoq] = useState('1');
  const [stock, setStock] = useState('');
  const [paliers, setPaliers] = useState<PrixPalier[]>([]);

  const [delaiProduction, setDelaiProduction] = useState('3-7');
  const [poids, setPoids] = useState('');
  const [longueur, setLongueur] = useState('');
  const [largeur, setLargeur] = useState('');
  const [hauteur, setHauteur] = useState('');
  const [port, setPort] = useState('Douala');

  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [seoSlug, setSeoSlug] = useState('');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    api.get<{ data: { id: string; name: string; children?: { id: string; name: string }[] }[] }>('/categories')
      .then((res) => {
        const opts: CategoryOption[] = [{ value: '', label: 'Selectionner une categorie' }];
        const flatten = (cats: { id: string; name: string; children?: { id: string; name: string }[] }[]) => {
          for (const cat of cats) {
            opts.push({ value: cat.id, label: cat.name });
            if (cat.children) flatten(cat.children);
          }
        };
        flatten(res.data);
        setCategoriesOptions(opts);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!params.id) return;
    api.get<{ data: {
      id: string; name: string; slug: string; description?: string;
      price?: number; minOrderQty: number; unit: string; tags: string[];
      category?: { id: string }; brand?: { id: string; name: string };
      images: { url: string; isMain: boolean; order: number }[];
      priceTiers: { minQty: number; maxQty?: number; price: number }[];
      estShippingDays?: number;
    } }>(`/products/${params.id}`)
      .then((res) => {
        const p = res.data;
        setNom(p.name);
        setSeoSlug(p.slug);
        if (p.description) setDescription(p.description);
        if (p.category?.id) setCategorie(p.category.id);
        if (p.brand?.name) setMarque(p.brand.name);
        if (p.tags?.length) setTags(p.tags.join(', '));
        setMoq(String(p.minOrderQty));
        if (p.unit) setUnite(p.unit);

        if (p.images?.length) {
          const main = p.images.find((img) => img.isMain) || p.images[0];
          if (main) setMainImage(main.url);
          setSelectedImages(p.images.filter((img) => !img.isMain).map((img) => img.url));
        }

        if (p.priceTiers?.length) {
          setPaliers(p.priceTiers.map((t, i) => ({
            id: Date.now() + i,
            minQty: t.minQty,
            maxQty: t.maxQty || 0,
            prix: t.price,
          })));
        }

        if (p.estShippingDays) {
          if (p.estShippingDays <= 3) setDelaiProduction('1-3');
          else if (p.estShippingDays <= 7) setDelaiProduction('3-7');
          else if (p.estShippingDays <= 15) setDelaiProduction('7-15');
          else setDelaiProduction('15-30');
        }
      })
      .catch((err) => {
        showToast(err instanceof Error ? err.message : 'Erreur chargement produit', 'error');
      })
      .finally(() => setLoadingProduct(false));
  }, [params.id]);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setMainImage(dataUrl);
      const base64 = dataUrl.split(',')[1];
      await analyzeWithAI(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const analyzeWithAI = async (base64: string, mimeType: string) => {
    setAiAnalyzing(true); setAiError(''); setAiDone(false);
    try {
      const res = await fetch(AI_API_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Erreur analyse IA'); }
      const data = await res.json();
      if (data.nom) setNom(data.nom);
      if (data.description) setDescription(data.description);
      if (data.marque) setMarque(data.marque);
      if (data.tags) setTags(data.tags);
      if (data.unite) setUnite(data.unite);
      if (data.moq) setMoq(String(data.moq));
      if (data.seoTitle) setSeoTitle(data.seoTitle);
      if (data.seoDesc) setSeoDesc(data.seoDesc);
      if (data.seoSlug) setSeoSlug(data.seoSlug);
      if (data.paliers && Array.isArray(data.paliers)) {
        setPaliers(data.paliers.map((p: { minQty: number; maxQty: number; prix: number }, i: number) => ({
          id: Date.now() + i, minQty: p.minQty, maxQty: p.maxQty, prix: p.prix,
        })));
      }
      if (data.suggestedImages?.length > 0) {
        setSuggestedImages(data.suggestedImages);
        setSelectedImages(data.suggestedImages);
      }
      setAiDone(true);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Erreur analyse IA');
    } finally { setAiAnalyzing(false); }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const toggleSuggestedImage = (url: string) => {
    setSelectedImages((prev) => prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]);
  };

  const removeMainImage = () => { setMainImage(''); setSuggestedImages([]); setSelectedImages([]); setAiDone(false); };

  const addPalier = () => { setPaliers([...paliers, { id: Date.now(), minQty: 0, maxQty: 0, prix: 0 }]); };
  const updatePalier = (id: number, field: keyof PrixPalier, value: number) => {
    setPaliers(paliers.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };
  const removePalier = (id: number) => { setPaliers(paliers.filter((p) => p.id !== id)); };

  const handleSubmit = async (e: React.FormEvent, asDraft = false) => {
    e.preventDefault();
    if (!nom.trim()) { showToast('Le nom du produit est requis', 'error'); setActiveTab('info'); return; }
    setSaving(true);
    try {
      const images = [];
      if (mainImage) images.push({ url: mainImage, isMain: true, order: 0 });
      selectedImages.forEach((url, i) => { images.push({ url, isMain: false, order: i + 1 }); });

      const priceTiers = paliers
        .filter((p) => p.minQty > 0 && p.prix > 0)
        .map((p) => ({ minQty: p.minQty, maxQty: p.maxQty || undefined, price: p.prix }));

      await api.patch(`/products/${params.id}`, {
        name: nom,
        description,
        slug: seoSlug || undefined,
        unit: unite,
        minOrderQty: moq ? Number(moq) : 1,
        tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        status: asDraft ? 'DRAFT' : 'ACTIVE',
        isPublished: !asDraft,
        ...(categorie && { categoryId: categorie }),
        estShippingDays: delaiProduction === '1-3' ? 3 : delaiProduction === '3-7' ? 7 : delaiProduction === '7-15' ? 15 : 30,
        ...(images.length > 0 && { images }),
        ...(priceTiers.length > 0 && { priceTiers }),
      });

      showToast('Produit mis a jour avec succes !');
      setTimeout(() => router.push('/products'), 1500);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur lors de la mise a jour', 'error');
    } finally { setSaving(false); }
  };

  const inputClass = 'w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';
  const labelClass = 'block text-sm font-medium text-gray-2 mb-1';

  if (loadingProduct) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
        <p className="text-sm text-gray-3">Chargement du produit...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border transition-all ${
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-red-600" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/products" className="p-2 rounded-lg hover:bg-gray-6 text-gray-3 hover:text-dark transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark">Modifier le produit</h1>
            <p className="text-sm text-gray-3">Modifiez les informations du produit</p>
          </div>
        </div>
        {aiDone && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">Rempli par IA</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex border-b border-gray-5">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id ? 'text-primary' : 'text-gray-3 hover:text-gray-1'
              }`}>
              {tab.label}
              {activeTab === tab.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {activeTab === 'info' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className={labelClass}>Nom du produit</label>
                <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom du produit" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Categorie</label>
                  <select value={categorie} onChange={(e) => setCategorie(e.target.value)} className={inputClass}>
                    {categoriesOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Marque</label>
                  <input type="text" value={marque} onChange={(e) => setMarque(e.target.value)} placeholder="Marque" className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>SKU</label>
                  <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Unite de vente</label>
                  <select value={unite} onChange={(e) => setUnite(e.target.value)} className={inputClass}>
                    <option value="piece">Piece</option>
                    <option value="carton">Carton</option>
                    <option value="sac">Sac</option>
                    <option value="palette">Palette</option>
                    <option value="lot">Lot</option>
                    <option value="metre">Metre</option>
                    <option value="kg">Kilogramme</option>
                    <option value="tonne">Tonne</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="Description du produit..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Tags (separes par des virgules)</label>
                <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tag1, tag2, tag3" className={inputClass} />
              </div>
            </div>
          )}

          {activeTab === 'images' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelClass}>Image du produit</label>
                  {aiAnalyzing && (
                    <span className="flex items-center gap-1.5 text-xs text-primary">
                      <Loader2 className="w-3 h-3 animate-spin" /> Analyse IA en cours...
                    </span>
                  )}
                </div>
                <div className="flex items-start gap-4">
                  {mainImage && (
                    <div className="relative group">
                      <img src={mainImage} alt="Produit" className="w-32 h-32 rounded-xl object-cover border-2 border-primary" />
                      <button type="button" onClick={removeMainImage} className="absolute -top-2 -right-2 w-6 h-6 bg-danger text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <X className="w-3 h-3" />
                      </button>
                      <span className="absolute bottom-1 left-1 text-[10px] bg-primary text-white px-1.5 py-0.5 rounded">Principale</span>
                    </div>
                  )}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex-1 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                      dragging ? 'border-primary bg-primary/5' : 'border-gray-4 hover:border-primary'
                    }`}>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileInputChange} className="hidden" />
                    <div className="flex items-center gap-3 justify-center">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-purple-100 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-dark">{mainImage ? 'Changer l\'image' : 'Glissez une image ou cliquez'}</p>
                        <p className="text-xs text-gray-3">L&apos;IA remplira automatiquement tous les champs</p>
                      </div>
                    </div>
                  </div>
                </div>
                {aiError && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-700">{aiError}</p>
                    <button onClick={() => setAiError('')} className="text-red-400 hover:text-red-600 ml-auto"><X className="w-3 h-3" /></button>
                  </div>
                )}
              </div>

              {selectedImages.length > 0 && !suggestedImages.length && (
                <div>
                  <label className="text-sm font-medium text-gray-2 mb-3 block">Images secondaires</label>
                  <div className="grid grid-cols-5 gap-3">
                    {selectedImages.map((url, idx) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden aspect-square border-2 border-primary ring-2 ring-primary/20">
                        <img src={url} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => toggleSuggestedImage(url)} className="absolute top-1.5 right-1.5 w-5 h-5 bg-danger rounded-full flex items-center justify-center">
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {suggestedImages.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <label className="text-sm font-medium text-gray-2">Images suggerees par l&apos;IA</label>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {suggestedImages.map((url, idx) => {
                      const isSelected = selectedImages.includes(url);
                      return (
                        <div key={idx} onClick={() => toggleSuggestedImage(url)}
                          className={`relative cursor-pointer rounded-xl overflow-hidden aspect-square border-2 transition ${
                            isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-gray-4'
                          }`}>
                          <img src={url} alt={`Suggestion ${idx + 1}`} className="w-full h-full object-cover" />
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                              <CheckCircle className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'prix' && (
            <div className="space-y-5 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Quantite minimum</label>
                  <input type="number" value={moq} onChange={(e) => setMoq(e.target.value)} min={1} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Stock disponible</label>
                  <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" className={inputClass} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="text-sm font-medium text-gray-2">Prix par paliers</label>
                    <p className="text-xs text-gray-3">Definissez des prix degressifs selon la quantite</p>
                  </div>
                  <button type="button" onClick={addPalier} className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Ajouter un palier
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_auto_1fr_1fr_40px] gap-3 px-1">
                    <span className="text-xs text-gray-3 font-medium">Qte min</span>
                    <span />
                    <span className="text-xs text-gray-3 font-medium">Qte max</span>
                    <span className="text-xs text-gray-3 font-medium">Prix unitaire (FCFA)</span>
                    <span />
                  </div>
                  {paliers.map((p) => (
                    <div key={p.id} className="grid grid-cols-[1fr_auto_1fr_1fr_40px] gap-3 items-center">
                      <input type="number" placeholder="Min" value={p.minQty || ''} onChange={(e) => updatePalier(p.id, 'minQty', Number(e.target.value))} className={inputClass} />
                      <span className="text-gray-3">-</span>
                      <input type="number" placeholder="Max" value={p.maxQty || ''} onChange={(e) => updatePalier(p.id, 'maxQty', Number(e.target.value))} className={inputClass} />
                      <input type="number" placeholder="Prix" value={p.prix || ''} onChange={(e) => updatePalier(p.id, 'prix', Number(e.target.value))} className={inputClass} />
                      <button type="button" onClick={() => removePalier(p.id)} className="p-1.5 rounded hover:bg-gray-6 text-gray-3 hover:text-danger transition">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {paliers.length === 0 && (
                    <p className="text-sm text-gray-3 text-center py-4">Aucun palier de prix.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'expedition' && (
            <div className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Poids par unite (kg)</label>
                  <input type="number" value={poids} onChange={(e) => setPoids(e.target.value)} placeholder="0.00" step="0.01" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Delai d&apos;expedition</label>
                  <select value={delaiProduction} onChange={(e) => setDelaiProduction(e.target.value)} className={inputClass}>
                    <option value="1-3">1-3 jours</option>
                    <option value="3-7">3-7 jours</option>
                    <option value="7-15">7-15 jours</option>
                    <option value="15-30">15-30 jours</option>
                    <option value="30+">30+ jours</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Longueur (cm)</label>
                  <input type="number" value={longueur} onChange={(e) => setLongueur(e.target.value)} placeholder="0" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Largeur (cm)</label>
                  <input type="number" value={largeur} onChange={(e) => setLargeur(e.target.value)} placeholder="0" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Hauteur (cm)</label>
                  <input type="number" value={hauteur} onChange={(e) => setHauteur(e.target.value)} placeholder="0" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Port d&apos;expedition</label>
                <select value={port} onChange={(e) => setPort(e.target.value)} className={inputClass}>
                  <option value="Douala">Douala, Cameroun</option>
                  <option value="Kribi">Kribi, Cameroun</option>
                  <option value="Abidjan">Abidjan, Cote d&apos;Ivoire</option>
                  <option value="Dakar">Dakar, Senegal</option>
                  <option value="Lagos">Lagos, Nigeria</option>
                  <option value="Libreville">Libreville, Gabon</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className={labelClass}>Titre SEO</label>
                <input type="text" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Titre pour les moteurs de recherche" className={inputClass} />
                <p className="text-xs text-gray-3 mt-1">{seoTitle.length}/70 caracteres</p>
              </div>
              <div>
                <label className={labelClass}>Meta description</label>
                <textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} rows={3} placeholder="Description pour les moteurs de recherche" className={inputClass} />
                <p className="text-xs text-gray-3 mt-1">{seoDesc.length}/160 caracteres</p>
              </div>
              <div>
                <label className={labelClass}>Slug URL</label>
                <input type="text" value={seoSlug} onChange={(e) => setSeoSlug(e.target.value)} placeholder="mon-produit" className={inputClass} />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-5">
            <Link href="/products" className="px-5 py-2.5 border border-gray-5 text-gray-2 rounded-lg text-sm font-medium hover:bg-gray-6 transition">
              Annuler
            </Link>
            <button type="button" disabled={saving} onClick={(e) => handleSubmit(e, true)} className="px-5 py-2.5 border border-gray-5 text-gray-2 rounded-lg text-sm font-medium hover:bg-gray-6 transition disabled:opacity-50">
              Enregistrer comme brouillon
            </button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Mettre a jour
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
