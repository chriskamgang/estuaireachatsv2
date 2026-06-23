'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileCode, X, Bot, Loader2, Sparkles, CheckCircle, Upload } from 'lucide-react';
import { api } from '@/lib/api';

const AI_API_URL = 'http://localhost:3000/api/ai-product-analyze';

interface CategoryOption {
  value: string;
  label: string;
}

export default function CreateDigitalProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [format, setFormat] = useState('PDF');

  // Image
  const [mainImage, setMainImage] = useState('');
  const [suggestedImages, setSuggestedImages] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);

  // Prix
  const [prix, setPrix] = useState('');

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
      if (data.tags) setTags(data.tags);
      if (data.seoTitle) setSeoTitle(data.seoTitle);
      if (data.seoDesc) setSeoDesc(data.seoDesc);
      if (data.seoSlug) setSeoSlug(data.seoSlug);
      if (data.suggestedImages?.length > 0) {
        setSuggestedImages(data.suggestedImages);
        setSelectedImages(data.suggestedImages);
      }
      setAiDone(true);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Erreur analyse IA');
    } finally {
      setAiAnalyzing(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const toggleSuggestedImage = (url: string) => {
    setSelectedImages((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  const removeMainImage = () => {
    setMainImage('');
    setSuggestedImages([]);
    setSelectedImages([]);
    setAiDone(false);
  };

  const handleSubmit = async (e: React.FormEvent, asDraft = false) => {
    e.preventDefault();
    if (!nom.trim()) {
      showToast('Le nom du produit est requis', 'error');
      return;
    }
    setSaving(true);
    try {
      const images = [];
      if (mainImage) {
        images.push({ url: mainImage, isMain: true, order: 0 });
      }
      selectedImages.forEach((url, i) => {
        images.push({ url, isMain: false, order: i + 1 });
      });

      await api.post('/products', {
        name: nom,
        description,
        slug: seoSlug || undefined,
        categoryId: sousCategorie || categorie || undefined,
        price: prix ? Number(prix) : undefined,
        productType: 'DIGITAL',
        isDigital: true,
        minOrderQty: 1,
        unit: format.toLowerCase(),
        tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        status: asDraft ? 'DRAFT' : 'ACTIVE',
        isPublished: !asDraft,
        addedBy: 'admin',
        ...(images.length > 0 && { images }),
      });

      showToast(asDraft ? 'Brouillon enregistre !' : 'Produit numerique publie avec succes !');
      setTimeout(() => router.push('/products/digital'), 1500);
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
            <FileCode className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark">Ajouter un produit numerique</h1>
            <p className="text-sm text-gray-3">Ebook, template, logiciel, cours en ligne...</p>
          </div>
        </div>
        {aiDone && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">Rempli par IA</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="xl:col-span-2 space-y-6">
            {/* Informations */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-dark mb-4">Informations</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Nom du produit *</label>
                  <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Ebook Marketing Digital" className={inputClass} />
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
                    <label className={labelClass}>Format</label>
                    <select value={format} onChange={(e) => setFormat(e.target.value)} className={inputClass}>
                      <option value="PDF">PDF</option>
                      <option value="EPUB">EPUB</option>
                      <option value="DOCX">DOCX</option>
                      <option value="ZIP">ZIP</option>
                      <option value="MP4">MP4 (Video)</option>
                      <option value="MP3">MP3 (Audio)</option>
                      <option value="APK">APK (Application)</option>
                      <option value="EXE">EXE (Logiciel)</option>
                      <option value="PSD">PSD (Photoshop)</option>
                      <option value="AI">AI (Illustrator)</option>
                      <option value="FIGMA">FIGMA</option>
                      <option value="OTHER">Autre</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="Description detaillee du produit numerique..." className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Tags (separes par des virgules)</label>
                  <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ebook, marketing, digital" className={inputClass} />
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-dark">Image de couverture</h2>
                {aiAnalyzing && (
                  <span className="flex items-center gap-1.5 text-xs text-primary">
                    <Loader2 className="w-3 h-3 animate-spin" /> Claude analyse l&apos;image...
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
                  </div>
                )}

                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex-1 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                    dragging ? 'border-primary bg-primary/5' : 'border-gray-4 hover:border-primary'
                  }`}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileInputChange} className="hidden" />
                  <div className="flex items-center gap-3 justify-center">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-purple-100 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-dark">{mainImage ? 'Changer l\'image' : 'Glissez une image ou cliquez'}</p>
                      <p className="text-xs text-gray-3">L&apos;IA remplira automatiquement les champs</p>
                    </div>
                  </div>
                </div>
              </div>

              {aiError && (
                <div className="mt-2 flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-700">{aiError}</p>
                  <button type="button" onClick={() => setAiError('')} className="text-red-400 hover:text-red-600 ml-auto"><X className="w-3 h-3" /></button>
                </div>
              )}

              {suggestedImages.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <label className="text-sm font-medium text-gray-2">Images suggerees par l&apos;IA</label>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {suggestedImages.map((url, idx) => {
                      const isSelected = selectedImages.includes(url);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleSuggestedImage(url)}
                          className={`relative cursor-pointer rounded-xl overflow-hidden aspect-square border-2 transition ${
                            isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-gray-4'
                          }`}
                        >
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

            {/* SEO */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-dark mb-4">SEO</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Titre SEO</label>
                  <input type="text" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Titre pour les moteurs de recherche" className={inputClass} />
                  <p className="text-xs text-gray-3 mt-1">{seoTitle.length}/70 caracteres</p>
                </div>
                <div>
                  <label className={labelClass}>Meta description</label>
                  <textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} rows={2} placeholder="Description pour les moteurs de recherche" className={inputClass} />
                  <p className="text-xs text-gray-3 mt-1">{seoDesc.length}/160 caracteres</p>
                </div>
                <div>
                  <label className={labelClass}>Slug URL</label>
                  <input type="text" value={seoSlug} onChange={(e) => setSeoSlug(e.target.value)} placeholder="ebook-marketing-digital" className={inputClass} />
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Prix */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-dark mb-4">Prix</h2>
              <div>
                <label className={labelClass}>Prix de vente (FCFA) *</label>
                <input type="number" value={prix} onChange={(e) => setPrix(e.target.value)} placeholder="0" className={inputClass} />
              </div>
            </div>

            {/* Type info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <FileCode className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Produit numerique</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Ce produit sera marque comme numerique ({format}).
                    Pas de stock physique ni d&apos;expedition requise.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="space-y-3">
              <button type="submit" disabled={saving} className="w-full px-6 py-3 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Publier le produit
              </button>
              <button type="button" disabled={saving} onClick={(e) => handleSubmit(e, true)} className="w-full px-6 py-3 border border-gray-5 text-gray-2 rounded-lg text-sm font-medium hover:bg-gray-6 transition disabled:opacity-50">
                Enregistrer comme brouillon
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
