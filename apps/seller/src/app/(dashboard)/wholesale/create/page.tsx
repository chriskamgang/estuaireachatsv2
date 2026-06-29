'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Boxes, Bot, Loader2, Sparkles, CheckCircle, ImagePlus, Video } from 'lucide-react';
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

interface ProductImage { id: number; url: string; isMain: boolean }

interface PrixPalier {
  id: number;
  minQty: number;
  maxQty: number;
  prix: number;
}

export default function CreateWholesaleProductPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('info');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  // Categories from API
  const [categoriesOptions, setCategoriesOptions] = useState<CategoryOption[]>([
    { value: '', label: 'Selectionner une categorie' },
  ]);
  const [sousCategoriesMap, setSousCategoriesMap] = useState<Record<string, CategoryOption[]>>({});

  useEffect(() => {
    api.get<{ data: { id: string; name: string; children?: { id: string; name: string }[] }[] }>('/categories')
      .then((res) => {
        const opts: CategoryOption[] = [{ value: '', label: 'Selectionner une categorie' }];
        const sousMap: Record<string, CategoryOption[]> = {};
        for (const cat of res.data) {
          opts.push({ value: cat.id, label: cat.name });
          if (cat.children && cat.children.length > 0) {
            sousMap[cat.id] = cat.children.map((sc) => ({ value: sc.id, label: sc.name }));
          }
        }
        setCategoriesOptions(opts);
        setSousCategoriesMap(sousMap);
      })
      .catch(() => {});
  }, []);

  // AI
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [aiError, setAiError] = useState('');

  // Info
  const [nom, setNom] = useState('');
  const [categorie, setCategorie] = useState('');
  const [sousCategorie, setSousCategorie] = useState('');
  const [marque, setMarque] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [unite, setUnite] = useState('piece');
  const [tags, setTags] = useState('');

  // Images & Video
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [suggestedImages, setSuggestedImages] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [videoLink, setVideoLink] = useState('');

  // Prix
  const [moq, setMoq] = useState('10');
  const [stock, setStock] = useState('');
  const [paliers, setPaliers] = useState<PrixPalier[]>([
    { id: 1, minQty: 10, maxQty: 49, prix: 0 },
    { id: 2, minQty: 50, maxQty: 99, prix: 0 },
    { id: 3, minQty: 100, maxQty: 499, prix: 0 },
  ]);

  // Expedition
  const [poids, setPoids] = useState('');
  const [longueur, setLongueur] = useState('');
  const [largeur, setLargeur] = useState('');
  const [hauteur, setHauteur] = useState('');
  const [delaiProduction, setDelaiProduction] = useState('3-7');
  const [port, setPort] = useState('Douala');

  // SEO
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [seoSlug, setSeoSlug] = useState('');

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleThumbnail = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setThumbnailUrl(dataUrl);
      if (!aiDone) {
        const base64 = dataUrl.split(',')[1];
        await analyzeWithAI(base64, file.type);
      }
    };
    reader.readAsDataURL(file);
  };

  const addImageFiles = (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArr.length === 0) return;
    fileArr.forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setProductImages((prev) => [
          ...prev,
          { id: Date.now() + i + Math.random(), url: dataUrl, isMain: false },
        ]);
      };
      reader.readAsDataURL(file);
    });
    if (!aiDone && fileArr[0]) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        await analyzeWithAI(dataUrl.split(',')[1], fileArr[0].type);
      };
      reader.readAsDataURL(fileArr[0]);
    }
  };

  const removeImage = (id: number) => setProductImages((prev) => prev.filter((img) => img.id !== id));
  const addSuggestedImage = (url: string) => setProductImages((prev) => [...prev, { id: Date.now() + Math.random(), url, isMain: false }]);
  const removeSuggestedImage = (url: string) => setProductImages((prev) => prev.filter((img) => img.url !== url));
  const isSuggestedSelected = (url: string) => productImages.some((img) => img.url === url);

  const analyzeWithAI = async (base64: string, mimeType: string) => {
    setAiAnalyzing(true);
    setAiError('');
    setAiDone(false);
    try {
      const res = await fetch(AI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur analyse IA');
      }
      const data = await res.json();

      if (data.nom) setNom(data.nom);
      if (data.description) setDescription(data.description);
      if (data.categorie) setCategorie(data.categorie);
      if (data.marque) setMarque(data.marque);
      if (data.tags) setTags(data.tags);
      if (data.unite) setUnite(data.unite);
      if (data.moq) setMoq(String(data.moq));
      if (data.poids) setPoids(data.poids);
      if (data.seoTitle) setSeoTitle(data.seoTitle);
      if (data.seoDesc) setSeoDesc(data.seoDesc);
      if (data.seoSlug) setSeoSlug(data.seoSlug);
      if (!sku) setSku(`WH-${Date.now().toString().slice(-6)}`);

      if (data.paliers && Array.isArray(data.paliers)) {
        setPaliers(
          data.paliers.map((p: { minQty: number; maxQty: number; prix: number }, i: number) => ({
            id: Date.now() + i, minQty: p.minQty, maxQty: p.maxQty, prix: p.prix,
          }))
        );
      }

      if (data.suggestedImages && data.suggestedImages.length > 0) {
        setSuggestedImages(data.suggestedImages);
      }

      setAiDone(true);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Erreur analyse IA');
    } finally {
      setAiAnalyzing(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) addImageFiles(e.dataTransfer.files);
  };

  const addPalier = () => {
    setPaliers([...paliers, { id: Date.now(), minQty: 0, maxQty: 0, prix: 0 }]);
  };

  const updatePalier = (id: number, field: keyof PrixPalier, value: number) => {
    setPaliers(paliers.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const removePalier = (id: number) => {
    setPaliers(paliers.filter((p) => p.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent, asDraft = false) => {
    e.preventDefault();
    if (!nom.trim()) {
      showToast('Le nom du produit est requis', 'error');
      setActiveTab('info');
      return;
    }
    setSaving(true);
    try {
      const images = [];
      if (thumbnailUrl) images.push({ url: thumbnailUrl, isMain: true, order: 0 });
      productImages.forEach((img, i) => images.push({ url: img.url, isMain: false, order: i + 1 }));

      const priceTiers = paliers
        .filter((p) => p.minQty > 0 && p.prix > 0)
        .map((p) => ({
          minQty: p.minQty,
          maxQty: p.maxQty || undefined,
          price: p.prix,
        }));

      await api.post('/products', {
        name: nom,
        description,
        slug: seoSlug || undefined,
        unit: unite,
        minOrderQty: moq ? Number(moq) : 10,
        tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        isWholesale: true,
        mode: 'WHOLESALE',
        status: asDraft ? 'DRAFT' : 'ACTIVE',
        isPublished: !asDraft,
        addedBy: 'seller',
        categoryId: sousCategorie || categorie || undefined,
        estShippingDays: delaiProduction === '1-3' ? 3 : delaiProduction === '3-7' ? 7 : delaiProduction === '7-15' ? 15 : 30,
        videoLink: videoLink || undefined,
        ...(images.length > 0 && { images }),
        ...(priceTiers.length > 0 && { priceTiers }),
      });

      showToast(asDraft ? 'Brouillon enregistre !' : 'Produit en gros publie avec succes !');
      setTimeout(() => router.push('/wholesale'), 1500);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';
  const labelClass = 'block text-sm font-medium text-gray-2 mb-1';

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border transition-all ${
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-red-600" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
            <Boxes className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark">Ajouter un produit en gros</h1>
            <p className="text-sm text-gray-3">Creez un produit avec des prix par paliers de quantite</p>
          </div>
        </div>
        {aiDone && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">Rempli par IA</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex border-b border-gray-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id ? 'text-primary' : 'text-gray-3 hover:text-gray-1'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Informations */}
          {activeTab === 'info' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className={labelClass}>Nom du produit</label>
                <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Ciment Portland 42.5N 50kg" className={inputClass} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Categorie</label>
                  <select value={categorie} onChange={(e) => { setCategorie(e.target.value); setSousCategorie(''); }} className={inputClass}>
                    {categoriesOptions.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Sous-categorie</label>
                  <select value={sousCategorie} onChange={(e) => setSousCategorie(e.target.value)} className={inputClass} disabled={!categorie || !sousCategoriesMap[categorie]}>
                    <option value="">Selectionner</option>
                    {(sousCategoriesMap[categorie] || []).map((sc) => (
                      <option key={sc.value} value={sc.value}>{sc.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Marque</label>
                  <input type="text" value={marque} onChange={(e) => setMarque(e.target.value)} placeholder="Ex: Cimencam" className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>SKU</label>
                  <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Ex: WH-001" className={inputClass} />
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
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="Description detaillee du produit en gros..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Tags (separes par des virgules)</label>
                <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ciment, construction, BTP" className={inputClass} />
              </div>
            </div>
          )}

          {/* Images & Video */}
          {activeTab === 'images' && (
            <div className="space-y-6 max-w-3xl">
              <div className="grid grid-cols-2 gap-6">
                {/* Thumbnail */}
                <div>
                  <label className={labelClass}>Image principale (Thumbnail)</label>
                  <p className="text-xs text-gray-400 mb-2">300px X 300px</p>
                  {thumbnailUrl ? (
                    <div className="relative group w-32 h-32">
                      <img src={thumbnailUrl} alt="" className="w-full h-full object-cover rounded-xl border-2 border-primary" />
                      <button type="button" onClick={() => setThumbnailUrl('')} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <X className="w-3 h-3" />
                      </button>
                      {aiAnalyzing && (
                        <div className="absolute inset-0 bg-white/70 rounded-xl flex items-center justify-center">
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div onClick={() => thumbInputRef.current?.click()}
                      className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary transition text-gray-400 hover:text-primary">
                      <Plus className="w-6 h-6" />
                      <span className="text-[10px] mt-1">Ajouter</span>
                    </div>
                  )}
                  <input ref={thumbInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleThumbnail(e.target.files[0]); e.target.value = ''; }} />
                </div>

                {/* Gallery */}
                <div>
                  <label className={labelClass}>Images galerie</label>
                  <p className="text-xs text-gray-400 mb-2">800px X 800px — Plusieurs images possibles (max 10)</p>
                  <div className="flex flex-wrap gap-2">
                    {productImages.map((img) => (
                      <div key={img.id} className="relative group w-20 h-20">
                        <img src={img.url} alt="" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                        <button type="button" onClick={() => removeImage(img.id)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[10px]">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {productImages.length < 10 && (
                      <div onClick={() => multiFileInputRef.current?.click()}
                        className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition text-gray-400 hover:text-primary">
                        <Plus className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <input ref={multiFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) addImageFiles(e.target.files); e.target.value = ''; }} />
                </div>
              </div>

              {aiError && (
                <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-700">{aiError}</p>
                  <button type="button" onClick={() => setAiError('')} className="text-red-400 hover:text-red-600 ml-auto"><X className="w-3 h-3" /></button>
                </div>
              )}

              {/* AI suggested */}
              {suggestedImages.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-gray-600">Images suggerees par l&apos;IA</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestedImages.map((url, idx) => {
                      const selected = isSuggestedSelected(url);
                      return (
                        <div key={idx} onClick={() => selected ? removeSuggestedImage(url) : addSuggestedImage(url)}
                          className={`relative cursor-pointer w-20 h-20 rounded-lg overflow-hidden border-2 transition ${selected ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-gray-300'}`}>
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          {selected && <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center"><CheckCircle className="w-3 h-3 text-white" /></div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Video */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Video className="w-4 h-4 text-gray-2" />
                  <label className={labelClass}>Video du produit</label>
                  <span className="text-xs text-gray-3">(optionnel)</span>
                </div>
                <input type="url" value={videoLink} onChange={(e) => setVideoLink(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className={inputClass} />
                {videoLink && (
                  <div className="mt-2 flex items-center gap-2 p-3 bg-gray-6 rounded-lg">
                    <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                      <Video className="w-4 h-4 text-red-600" />
                    </div>
                    <p className="text-xs text-gray-3 truncate flex-1">{videoLink}</p>
                    <button type="button" onClick={() => setVideoLink('')} className="text-gray-3 hover:text-red-500"><X className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Prix & Paliers */}
          {activeTab === 'prix' && (
            <div className="space-y-5 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>MOQ (Quantite minimum de commande)</label>
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
                    <p className="text-xs text-gray-3">Definissez des prix degressifs selon la quantite commandee</p>
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
                </div>
              </div>

              {aiDone && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700">Les prix et paliers ont ete estimes par l&apos;IA en FCFA. Ajustez-les selon vos couts reels.</p>
                </div>
              )}
            </div>
          )}

          {/* Expedition */}
          {activeTab === 'expedition' && (
            <div className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Poids par unite (kg)</label>
                  <input type="number" value={poids} onChange={(e) => setPoids(e.target.value)} placeholder="0.00" step="0.01" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Delai de production</label>
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

          {/* SEO */}
          {activeTab === 'seo' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className={labelClass}>Titre SEO</label>
                <input type="text" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Titre pour les moteurs de recherche" className={inputClass} />
                <p className="text-xs text-gray-3 mt-1">{seoTitle.length}/70 caracteres recommandes</p>
              </div>
              <div>
                <label className={labelClass}>Meta description</label>
                <textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} rows={3} placeholder="Description pour les moteurs de recherche" className={inputClass} />
                <p className="text-xs text-gray-3 mt-1">{seoDesc.length}/160 caracteres recommandes</p>
              </div>
              <div>
                <label className={labelClass}>Slug URL</label>
                <input type="text" value={seoSlug} onChange={(e) => setSeoSlug(e.target.value)} placeholder="ciment-portland-42-5n-50kg" className={inputClass} />
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-5">
            <button type="button" disabled={saving} onClick={(e) => handleSubmit(e, true)} className="px-5 py-2.5 border border-gray-5 text-gray-2 rounded-lg text-sm font-medium hover:bg-gray-6 transition disabled:opacity-50">
              Enregistrer comme brouillon
            </button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Publier le produit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
