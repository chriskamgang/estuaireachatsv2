'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, PackagePlus, Bot, Loader2, Sparkles, CheckCircle, ImagePlus, Video, Star, FileText, Tag } from 'lucide-react';
import { api } from '@/lib/api';

const AI_API_URL = 'http://localhost:3000/api/ai-product-analyze';

interface CategoryOption { value: string; label: string; children?: CategoryOption[] }
interface BrandOption { value: string; label: string }

interface ProductImage { id: number; url: string; isMain: boolean }
interface PrixPalier { id: number; minQty: number; maxQty: number; prix: number }
interface ProductVariant { key: string; prix: string; sku: string; qty: string; image: string }

// ─── Predefined colors ───
const PREDEFINED_COLORS: { name: string; hex: string }[] = [
  { name: 'Noir', hex: '#000000' }, { name: 'Blanc', hex: '#FFFFFF' },
  { name: 'Rouge', hex: '#FF0000' }, { name: 'Bleu', hex: '#0000FF' },
  { name: 'Vert', hex: '#008000' }, { name: 'Jaune', hex: '#FFD700' },
  { name: 'Orange', hex: '#FF6600' }, { name: 'Rose', hex: '#FF69B4' },
  { name: 'Violet', hex: '#8B00FF' }, { name: 'Gris', hex: '#808080' },
  { name: 'Marron', hex: '#8B4513' }, { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Argent', hex: '#C0C0C0' }, { name: 'Or', hex: '#FFD700' },
  { name: 'Bordeaux', hex: '#800020' }, { name: 'Marine', hex: '#000080' },
  { name: 'Turquoise', hex: '#40E0D0' }, { name: 'Corail', hex: '#FF7F50' },
  { name: 'Kaki', hex: '#BDB76B' }, { name: 'Ivoire', hex: '#FFFFF0' },
];

// ─── Predefined attributes ───
const ATTRIBUTE_TYPES: { key: string; label: string; values: string[] }[] = [
  { key: 'taille', label: 'Taille', values: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'] },
  { key: 'stockage', label: 'Stockage', values: ['16 Go', '32 Go', '64 Go', '128 Go', '256 Go', '512 Go', '1 To', '2 To'] },
  { key: 'memoire', label: 'Memoire RAM', values: ['2 Go', '4 Go', '6 Go', '8 Go', '12 Go', '16 Go', '32 Go', '64 Go'] },
  { key: 'tissu', label: 'Tissu', values: ['Coton', 'Polyester', 'Lin', 'Soie', 'Laine', 'Nylon', 'Denim', 'Velours'] },
  { key: 'materiau', label: 'Materiau', values: ['Bois', 'Metal', 'Plastique', 'Verre', 'Cuir', 'Caoutchouc', 'Ceramique', 'Acier inoxydable'] },
  { key: 'manche', label: 'Manche', values: ['Sans manche', 'Manche courte', 'Manche 3/4', 'Manche longue'] },
  { key: 'litrage', label: 'Litrage', values: ['0.5L', '1L', '1.5L', '2L', '3L', '5L', '10L', '20L'] },
  { key: 'ecran', label: 'Taille ecran', values: ['5"', '5.5"', '6"', '6.5"', '7"', '10"', '13"', '14"', '15.6"', '17"', '24"', '27"', '32"', '43"', '55"', '65"'] },
];

export default function CreateProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ─── Data from API ───
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);

  useEffect(() => {
    api.get<{ data: { id: string; name: string; children?: { id: string; name: string }[] }[] }>('/categories')
      .then((res) => {
        setCategories(res.data.map((c) => ({
          value: c.id, label: c.name,
          children: c.children?.map((sc) => ({ value: sc.id, label: sc.name })) || [],
        })));
      }).catch(() => {});
    api.get<{ data: { id: string; name: string }[] }>('/brands')
      .then((res) => setBrands(res.data.map((b) => ({ value: b.id, label: b.name }))))
      .catch(() => {});
  }, []);

  // ─── AI ───
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [aiError, setAiError] = useState('');

  // ═══════════════════════════════════════
  // PRODUCT BASIC INFORMATION
  // ═══════════════════════════════════════
  const [nom, setNom] = useState('');
  const [categorie, setCategorie] = useState('');
  const [sousCategorie, setSousCategorie] = useState('');
  const [brandId, setBrandId] = useState('');
  const [unite, setUnite] = useState('piece');
  const [poids, setPoids] = useState('');
  const [moq, setMoq] = useState('1');
  const [tags, setTags] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [origin, setOrigin] = useState('');

  // ═══════════════════════════════════════
  // FILES & MEDIA
  // ═══════════════════════════════════════
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [suggestedImages, setSuggestedImages] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [videoLink, setVideoLink] = useState('');
  const [pdfSpec, setPdfSpec] = useState('');

  // ═══════════════════════════════════════
  // PRODUCT DESCRIPTION
  // ═══════════════════════════════════════
  const [description, setDescription] = useState('');
  const [shortDesc, setShortDesc] = useState('');

  // ═══════════════════════════════════════
  // SEO META TAGS
  // ═══════════════════════════════════════
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [seoSlug, setSeoSlug] = useState('');

  // ═══════════════════════════════════════
  // PRODUCT VARIATION CONFIGURATION
  // ═══════════════════════════════════════
  const [colorsEnabled, setColorsEnabled] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [colorDropdownOpen, setColorDropdownOpen] = useState(false);
  const [colorSearch, setColorSearch] = useState('');

  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]); // attribute keys
  const [attributeValues, setAttributeValues] = useState<Record<string, string[]>>({}); // key -> selected values
  const [attrDropdownOpen, setAttrDropdownOpen] = useState(false);
  const [attrValueDropdownOpen, setAttrValueDropdownOpen] = useState<string | null>(null);

  // Generated variants from colors + attributes
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);

  // ═══════════════════════════════════════
  // PRODUCT PRICE + STOCK
  // ═══════════════════════════════════════
  const [prixUnitaire, setPrixUnitaire] = useState('');
  const [discountType, setDiscountType] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [discountStart, setDiscountStart] = useState('');
  const [discountEnd, setDiscountEnd] = useState('');
  const [stock, setStock] = useState('');
  const [sku, setSku] = useState('');
  const [paliers, setPaliers] = useState<PrixPalier[]>([]);

  // ═══════════════════════════════════════
  // PRODUCT SETTINGS (sidebar)
  // ═══════════════════════════════════════
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [estShippingDays, setEstShippingDays] = useState('');
  const [freeShipping, setFreeShipping] = useState(false);

  // ═══════════════════════════════════════
  // TAG HANDLING
  // ═══════════════════════════════════════
  const tagsList = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
  const addTag = (tag: string) => {
    const t = tag.trim();
    if (!t || tagsList.includes(t)) return;
    setTags(tagsList.length > 0 ? tags + ', ' + t : t);
    setTagInput('');
  };
  const removeTag = (tag: string) => {
    setTags(tagsList.filter((t) => t !== tag).join(', '));
  };

  // ═══════════════════════════════════════
  // IMAGE HANDLERS
  // ═══════════════════════════════════════
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

  const handleThumbnail = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setThumbnailUrl(dataUrl);
      if (!aiDone) await analyzeWithAI(dataUrl.split(',')[1], file.type);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (id: number) => setProductImages((prev) => prev.filter((img) => img.id !== id));
  const addSuggestedImage = (url: string) => setProductImages((prev) => [...prev, { id: Date.now() + Math.random(), url, isMain: false }]);
  const removeSuggestedImage = (url: string) => setProductImages((prev) => prev.filter((img) => img.url !== url));
  const isSuggestedSelected = (url: string) => productImages.some((img) => img.url === url);

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
      if (data.marque) { /* Could match brand */ }
      if (data.tags) setTags(data.tags);
      if (data.moq) setMoq(String(data.moq));
      if (data.seoTitle) setSeoTitle(data.seoTitle);
      if (data.seoDesc) setSeoDesc(data.seoDesc);
      if (data.seoSlug) setSeoSlug(data.seoSlug);
      if (data.prixMin) setPrixUnitaire(String(data.prixMin));
      // AI variantes are informational only — user configures via color/attribute selectors
      if (data.suggestedImages?.length > 0) setSuggestedImages(data.suggestedImages);
      if (!sku) setSku(`PRD-${Date.now().toString().slice(-6)}`);
      setAiDone(true);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Erreur analyse IA');
    } finally { setAiAnalyzing(false); }
  };

  // ═══════════════════════════════════════
  // VARIATION LOGIC
  // ═══════════════════════════════════════
  const toggleColor = (name: string) => {
    setSelectedColors((prev) => prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]);
  };

  const toggleAttribute = (key: string) => {
    if (selectedAttributes.includes(key)) {
      setSelectedAttributes((prev) => prev.filter((k) => k !== key));
      setAttributeValues((prev) => { const n = { ...prev }; delete n[key]; return n; });
    } else {
      setSelectedAttributes((prev) => [...prev, key]);
    }
    setAttrDropdownOpen(false);
  };

  const toggleAttributeValue = (attrKey: string, val: string) => {
    setAttributeValues((prev) => {
      const current = prev[attrKey] || [];
      const updated = current.includes(val) ? current.filter((v) => v !== val) : [...current, val];
      return { ...prev, [attrKey]: updated };
    });
  };

  // Generate variant combinations whenever colors/attributes change
  useEffect(() => {
    const parts: string[][] = [];
    if (colorsEnabled && selectedColors.length > 0) parts.push(selectedColors);
    for (const attrKey of selectedAttributes) {
      const vals = attributeValues[attrKey] || [];
      if (vals.length > 0) parts.push(vals);
    }
    if (parts.length === 0) { setProductVariants([]); return; }

    // Cartesian product
    const combine = (arrays: string[][]): string[][] => {
      if (arrays.length === 0) return [[]];
      const [first, ...rest] = arrays;
      const restCombos = combine(rest);
      return first.flatMap((val) => restCombos.map((combo) => [val, ...combo]));
    };

    const combos = combine(parts);
    setProductVariants((prev) => {
      return combos.map((combo) => {
        const key = combo.join('-');
        const existing = prev.find((v) => v.key === key);
        return existing || { key, prix: '', sku: key, qty: '', image: '' };
      });
    });
  }, [colorsEnabled, selectedColors, selectedAttributes, attributeValues]);

  const updateProductVariant = (key: string, field: 'prix' | 'sku' | 'qty' | 'image', value: string) => {
    setProductVariants((prev) => prev.map((v) => v.key === key ? { ...v, [field]: value } : v));
  };

  const handleVariantImage = (key: string, file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      updateProductVariant(key, 'image', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Paliers
  const addPalier = () => setPaliers([...paliers, { id: Date.now(), minQty: 0, maxQty: 0, prix: 0 }]);
  const updatePalier = (id: number, field: keyof PrixPalier, value: number) => {
    setPaliers(paliers.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };
  const removePalier = (id: number) => setPaliers(paliers.filter((p) => p.id !== id));

  // ═══════════════════════════════════════
  // SUBMIT
  // ═══════════════════════════════════════
  const handleSubmit = async (saveAs: 'publish' | 'unpublish' | 'draft') => {
    if (!nom.trim()) { showToast('Le nom du produit est requis', 'error'); return; }
    setSaving(true);
    try {
      const images = [];
      if (thumbnailUrl) images.push({ url: thumbnailUrl, isMain: true, order: 0 });
      productImages.forEach((img, i) => images.push({ url: img.url, isMain: false, order: i + 1 }));

      const stocks = productVariants.filter((v) => v.prix || v.qty).map((v) => ({
        variant: v.key, price: v.prix ? Number(v.prix) : 0,
        qty: v.qty ? Number(v.qty) : 0, sku: v.sku || undefined,
        image: v.image || undefined,
      }));

      const priceTiers = paliers.filter((p) => p.minQty > 0 && p.prix > 0)
        .map((p) => ({ minQty: p.minQty, maxQty: p.maxQty || undefined, price: p.prix }));

      await api.post('/products', {
        name: nom,
        slug: seoSlug || undefined,
        description: description || undefined,
        shortDesc: shortDesc || undefined,
        categoryId: sousCategorie || categorie || undefined,
        brandId: brandId || undefined,
        price: prixUnitaire ? Number(prixUnitaire) : undefined,
        minOrderQty: moq ? Number(moq) : 1,
        unit: unite || 'piece',
        origin: origin || undefined,
        estShippingDays: estShippingDays ? Number(estShippingDays) : undefined,
        videoLink: videoLink || undefined,
        pdfSpec: pdfSpec || undefined,
        isFeatured,
        isPublished: saveAs === 'publish',
        status: saveAs === 'draft' ? 'DRAFT' : 'ACTIVE',
        addedBy: 'admin',
        tags: tagsList,
        colors: colorsEnabled && selectedColors.length > 0 ? selectedColors : undefined,
        choiceOptions: selectedAttributes.length > 0 ? Object.fromEntries(selectedAttributes.map((k) => [k, attributeValues[k] || []])) : undefined,
        ...(discountType && {
          discountType: discountType as 'PERCENT' | 'AMOUNT',
          discount: discountValue ? Number(discountValue) : 0,
          discountStart: discountStart || undefined,
          discountEnd: discountEnd || undefined,
        }),
        ...(images.length > 0 && { images }),
        ...(stocks.length > 0 && { stocks }),
        ...(priceTiers.length > 0 && { priceTiers }),
      });

      showToast(saveAs === 'draft' ? 'Brouillon enregistre !' : 'Produit publie avec succes !');
      setTimeout(() => router.push('/products'), 1500);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement', 'error');
    } finally { setSaving(false); }
  };

  const inputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';
  const sectionClass = 'bg-white rounded-xl shadow-sm border border-gray-100 p-6';
  const sectionTitle = 'text-lg font-bold text-dark mb-5';

  const selectedCat = categories.find((c) => c.value === categorie);

  return (
    <div className="space-y-6 pb-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border ${
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
            <PackagePlus className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-dark">Ajouter un produit</h1>
        </div>
        {aiDone && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">Rempli par IA</span>
          </div>
        )}
      </div>

      {/* ═══ MAIN LAYOUT ═══ */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        {/* ─── LEFT COLUMN ─── */}
        <div className="space-y-6">

          {/* ══ PRODUCT BASIC INFORMATION ══ */}
          <div className={sectionClass}>
            <h2 className={sectionTitle}>Informations de base</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Nom du produit *</label>
                <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom du produit" className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Categorie principale *</label>
                  <select value={categorie} onChange={(e) => { setCategorie(e.target.value); setSousCategorie(''); }} className={inputClass}>
                    <option value="">Selectionner une categorie</option>
                    {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Marque</label>
                  <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className={inputClass}>
                    <option value="">Selectionner une marque</option>
                    {brands.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Sous-categorie */}
              {selectedCat && selectedCat.children && selectedCat.children.length > 0 && (
                <div>
                  <label className={labelClass}>Sous-categorie</label>
                  <select value={sousCategorie} onChange={(e) => setSousCategorie(e.target.value)} className={inputClass}>
                    <option value="">Selectionner</option>
                    {selectedCat.children.map((sc) => <option key={sc.value} value={sc.value}>{sc.label}</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Unite</label>
                  <select value={unite} onChange={(e) => setUnite(e.target.value)} className={inputClass}>
                    <option value="piece">Piece</option>
                    <option value="kg">Kilogramme</option>
                    <option value="lot">Lot</option>
                    <option value="carton">Carton</option>
                    <option value="metre">Metre</option>
                    <option value="litre">Litre</option>
                    <option value="paire">Paire</option>
                    <option value="sac">Sac</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Poids (Kg)</label>
                  <input type="number" step="0.01" value={poids} onChange={(e) => setPoids(e.target.value)} placeholder="0.00" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Quantite minimum *</label>
                  <input type="number" value={moq} onChange={(e) => setMoq(e.target.value)} min={1} placeholder="1" className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Pays d&apos;origine</label>
                  <select value={origin} onChange={(e) => setOrigin(e.target.value)} className={inputClass}>
                    <option value="">Selectionner</option>
                    <option value="CM">Cameroun</option>
                    <option value="CN">Chine</option>
                    <option value="GA">Gabon</option>
                    <option value="NG">Nigeria</option>
                    <option value="GH">Ghana</option>
                    <option value="CI">Cote d&apos;Ivoire</option>
                    <option value="SN">Senegal</option>
                    <option value="FR">France</option>
                    <option value="US">Etats-Unis</option>
                    <option value="DE">Allemagne</option>
                    <option value="JP">Japon</option>
                    <option value="KR">Coree du Sud</option>
                    <option value="IN">Inde</option>
                    <option value="TR">Turquie</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>SKU</label>
                  <div className="flex gap-2">
                    <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Product SKU" className={inputClass} />
                    <button type="button" onClick={() => setSku(`SKU-${Date.now().toString().slice(-8)}`)} className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 shrink-0">
                      Generer
                    </button>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className={labelClass}>Tags *</label>
                <div className="border border-gray-200 rounded-lg px-3 py-2 flex flex-wrap gap-1.5 min-h-[42px] focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                  {tagsList.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-600"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                  <input
                    type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); } }}
                    onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
                    placeholder="Tapez et appuyez Entree..."
                    className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Mots-cles pour la recherche. Tapez et appuyez Entree pour ajouter.</p>
              </div>
            </div>
          </div>

          {/* ══ FILES & MEDIA ══ */}
          <div className={sectionClass}>
            <h2 className={sectionTitle}>Fichiers & Media</h2>

            <div className="grid grid-cols-2 gap-6 mb-6">
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
                  <div
                    onClick={() => thumbInputRef.current?.click()}
                    className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary transition text-gray-400 hover:text-primary"
                  >
                    <Plus className="w-6 h-6" />
                    <span className="text-[10px] mt-1">Ajouter</span>
                  </div>
                )}
                <input ref={thumbInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleThumbnail(e.target.files[0]); e.target.value = ''; }} />
              </div>

              {/* Gallery */}
              <div>
                <label className={labelClass}>Images galerie *</label>
                <p className="text-xs text-gray-400 mb-2">800px X 800px — Plusieurs images possibles</p>
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
                    <div
                      onClick={() => multiFileInputRef.current?.click()}
                      className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition text-gray-400 hover:text-primary"
                    >
                      <Plus className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <input ref={multiFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) addImageFiles(e.target.files); e.target.value = ''; }} />
              </div>
            </div>

            {aiError && (
              <div className="mb-4 flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-700">{aiError}</p>
                <button type="button" onClick={() => setAiError('')} className="text-red-400 hover:text-red-600 ml-auto"><X className="w-3 h-3" /></button>
              </div>
            )}

            {/* AI suggested */}
            {suggestedImages.length > 0 && (
              <div className="mb-4">
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
            <div className="mb-4">
              <label className={labelClass}>Lien video YouTube</label>
              <p className="text-xs text-gray-400 mb-2">Collez une URL YouTube. La video sera affichee sur la page produit.</p>
              <input type="url" value={videoLink} onChange={(e) => setVideoLink(e.target.value)} placeholder="Collez l'URL ici" className={inputClass} />
            </div>

            {/* PDF Spec */}
            <div>
              <label className={labelClass}>PDF Specification</label>
              <input type="url" value={pdfSpec} onChange={(e) => setPdfSpec(e.target.value)} placeholder="URL du fichier PDF" className={inputClass} />
            </div>
          </div>

          {/* ══ PRODUCT DESCRIPTION ══ */}
          <div className={sectionClass}>
            <h2 className={sectionTitle}>Description du produit</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Description courte</label>
                <textarea value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} rows={2} placeholder="Courte description pour les listes..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Description complete</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={8} placeholder="Description detaillee du produit..." className={`${inputClass} resize-y`} />
              </div>
            </div>
          </div>

          {/* ══ SEO META TAGS ══ */}
          <div className={sectionClass}>
            <h2 className={sectionTitle}>SEO Meta Tags</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Meta Title</label>
                <input type="text" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Meta Title" className={inputClass} />
                <p className="text-xs text-gray-400 mt-1">{seoTitle.length}/70 caracteres</p>
              </div>
              <div>
                <label className={labelClass}>Meta Description</label>
                <textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} rows={3} placeholder="Description" className={inputClass} />
                <p className="text-xs text-gray-400 mt-1">{seoDesc.length}/160 caracteres</p>
              </div>
              <div>
                <label className={labelClass}>Slug URL</label>
                <input type="text" value={seoSlug} onChange={(e) => setSeoSlug(e.target.value)} placeholder="mon-produit-super" className={inputClass} />
              </div>
            </div>
          </div>

          {/* ══ PRODUCT PRICE + STOCK ══ */}
          <div className={sectionClass}>
            <h2 className={sectionTitle}>Prix & Stock</h2>

            {/* ── Product Variation Configuration ── */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-dark mb-4">Configuration des variantes</h3>

              {/* ── Colors row ── */}
              <div className="flex items-center gap-3 mb-3 border border-gray-200 rounded-lg p-3">
                <span className="text-sm font-medium text-gray-600 w-24 shrink-0">Couleurs</span>
                <div className="flex-1 relative">
                  <button type="button" onClick={() => { setColorDropdownOpen(!colorDropdownOpen); setColorSearch(''); }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-left bg-white hover:border-gray-300 flex items-center justify-between">
                    {selectedColors.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selectedColors.map((c) => {
                          const col = PREDEFINED_COLORS.find((pc) => pc.name === c);
                          return (
                            <span key={c} className="inline-flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-xs">
                              <span className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: col?.hex || '#ccc' }} />
                              {c}
                              <button type="button" onClick={(e) => { e.stopPropagation(); toggleColor(c); }} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                            </span>
                          );
                        })}
                      </div>
                    ) : <span className="text-gray-400">Selectionner des couleurs</span>}
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {colorDropdownOpen && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                      <div className="sticky top-0 bg-white p-2 border-b border-gray-100">
                        <input type="text" value={colorSearch} onChange={(e) => setColorSearch(e.target.value)} placeholder="Rechercher..." className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm outline-none focus:border-primary" autoFocus />
                      </div>
                      {PREDEFINED_COLORS.filter((c) => !colorSearch || c.name.toLowerCase().includes(colorSearch.toLowerCase())).map((c) => (
                        <button key={c.name} type="button" onClick={() => toggleColor(c.name)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 text-left ${selectedColors.includes(c.name) ? 'bg-primary/5' : ''}`}>
                          <span className="w-5 h-5 rounded border border-gray-300 shrink-0" style={{ backgroundColor: c.hex }} />
                          <span className="flex-1">{c.name}</span>
                          {selectedColors.includes(c.name) && <CheckCircle className="w-4 h-4 text-primary shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className={`relative w-10 h-5 rounded-full transition cursor-pointer ${colorsEnabled ? 'bg-primary' : 'bg-gray-300'}`} onClick={() => { setColorsEnabled(!colorsEnabled); if (colorsEnabled) setSelectedColors([]); }}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${colorsEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </div>

              {/* ── Attributes row ── */}
              <div className="border border-gray-200 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-medium text-gray-600 w-24 shrink-0">Attributs</span>
                  <div className="flex-1 relative">
                    <button type="button" onClick={() => setAttrDropdownOpen(!attrDropdownOpen)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-left bg-white hover:border-gray-300 flex items-center justify-between">
                      {selectedAttributes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {selectedAttributes.map((k) => {
                            const attr = ATTRIBUTE_TYPES.find((a) => a.key === k);
                            return (
                              <span key={k} className="inline-flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-xs">
                                {attr?.label || k}
                                <button type="button" onClick={(e) => { e.stopPropagation(); toggleAttribute(k); }} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                              </span>
                            );
                          })}
                        </div>
                      ) : <span className="text-gray-400">Selectionner des attributs</span>}
                      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {attrDropdownOpen && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {ATTRIBUTE_TYPES.map((attr) => (
                          <button key={attr.key} type="button" onClick={() => toggleAttribute(attr.key)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-gray-50 text-left ${selectedAttributes.includes(attr.key) ? 'bg-primary/5' : ''}`}>
                            <span className="flex-1">{attr.label}</span>
                            {selectedAttributes.includes(attr.key) && <CheckCircle className="w-4 h-4 text-primary" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Attribute value selectors */}
                {selectedAttributes.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-gray-400">Choisissez les attributs puis selectionnez les valeurs de chaque attribut</p>
                    {selectedAttributes.map((attrKey) => {
                      const attr = ATTRIBUTE_TYPES.find((a) => a.key === attrKey);
                      if (!attr) return null;
                      const selectedVals = attributeValues[attrKey] || [];
                      const isOpen = attrValueDropdownOpen === attrKey;
                      return (
                        <div key={attrKey} className="flex items-start gap-3">
                          <span className="text-sm font-medium text-gray-600 w-24 shrink-0 pt-2">{attr.label}</span>
                          <div className="flex-1 relative">
                            <button type="button" onClick={() => setAttrValueDropdownOpen(isOpen ? null : attrKey)}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-left bg-white hover:border-gray-300 flex items-center justify-between min-h-[38px]">
                              {selectedVals.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {selectedVals.map((v) => (
                                    <span key={v} className="inline-flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-xs">
                                      {v}
                                      <button type="button" onClick={(e) => { e.stopPropagation(); toggleAttributeValue(attrKey, v); }} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                                    </span>
                                  ))}
                                </div>
                              ) : <span className="text-gray-400">Selectionner</span>}
                              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            {isOpen && (
                              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                                {attr.values.map((val) => (
                                  <button key={val} type="button" onClick={() => toggleAttributeValue(attrKey, val)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-left ${selectedVals.includes(val) ? 'bg-primary/5' : ''}`}>
                                    <span className="flex-1">{val}</span>
                                    {selectedVals.includes(val) && <CheckCircle className="w-4 h-4 text-primary" />}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Product Variants Table ── */}
            {productVariants.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-dark mb-3">Variantes du produit ({productVariants.length})</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-[1fr_130px_130px_100px_80px] gap-2 px-4 py-2 bg-gray-50 text-[11px] font-semibold text-gray-500 border-b border-gray-200 uppercase tracking-wide">
                    <span>Variante</span><span>Prix (FCFA)</span><span>SKU</span><span>Quantite</span><span>Photo</span>
                  </div>
                  {productVariants.map((v) => (
                    <div key={v.key} className="grid grid-cols-[1fr_130px_130px_100px_80px] gap-2 items-center px-4 py-2.5 border-b border-gray-100 last:border-b-0">
                      <span className="text-sm font-medium text-dark">{v.key}</span>
                      <input type="number" value={v.prix} onChange={(e) => updateProductVariant(v.key, 'prix', e.target.value)} placeholder="0" className="border border-gray-200 rounded px-2 py-1.5 text-sm outline-none focus:border-primary" />
                      <input type="text" value={v.sku} onChange={(e) => updateProductVariant(v.key, 'sku', e.target.value)} className="border border-gray-200 rounded px-2 py-1.5 text-sm outline-none focus:border-primary" />
                      <input type="number" value={v.qty} onChange={(e) => updateProductVariant(v.key, 'qty', e.target.value)} placeholder="0" className="border border-gray-200 rounded px-2 py-1.5 text-sm outline-none focus:border-primary" />
                      <div className="flex items-center justify-center">
                        {v.image ? (
                          <div className="relative group w-10 h-10">
                            <img src={v.image} alt="" className="w-full h-full object-cover rounded border border-gray-200" />
                            <button type="button" onClick={() => updateProductVariant(v.key, 'image', '')} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[8px]">
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ) : (
                          <label className="w-10 h-10 border border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer hover:border-primary transition text-gray-400 hover:text-primary">
                            <ImagePlus className="w-4 h-4" />
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleVariantImage(v.key, e.target.files[0]); e.target.value = ''; }} />
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelClass}>Prix unitaire (FCFA) *</label>
                <input type="number" value={prixUnitaire} onChange={(e) => setPrixUnitaire(e.target.value)} placeholder="0" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Stock</label>
                <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" className={inputClass} />
              </div>
            </div>

            {/* Discount */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className={labelClass}>Periode de remise</label>
                <div className="flex gap-2">
                  <input type="date" value={discountStart} onChange={(e) => setDiscountStart(e.target.value)} className={`${inputClass} text-xs`} />
                  <input type="date" value={discountEnd} onChange={(e) => setDiscountEnd(e.target.value)} className={`${inputClass} text-xs`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Remise</label>
                <input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder="0.00" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Type de remise</label>
                <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className={inputClass}>
                  <option value="">Aucune</option>
                  <option value="PERCENT">Pourcentage (%)</option>
                  <option value="AMOUNT">Montant fixe (FCFA)</option>
                </select>
              </div>
            </div>

            {/* Prix par paliers */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className={labelClass}>Prix par paliers (quantite)</label>
                <button type="button" onClick={addPalier} className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Ajouter un palier
                </button>
              </div>
              {paliers.length > 0 && (
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_1fr_1fr_36px] gap-2 text-[11px] font-medium text-gray-400">
                    <span>Qte min</span><span>Qte max</span><span>Prix (FCFA)</span><span />
                  </div>
                  {paliers.map((p) => (
                    <div key={p.id} className="grid grid-cols-[1fr_1fr_1fr_36px] gap-2 items-center">
                      <input type="number" placeholder="Min" value={p.minQty || ''} onChange={(e) => updatePalier(p.id, 'minQty', Number(e.target.value))} className={inputClass} />
                      <input type="number" placeholder="Max" value={p.maxQty || ''} onChange={(e) => updatePalier(p.id, 'maxQty', Number(e.target.value))} className={inputClass} />
                      <input type="number" placeholder="Prix" value={p.prix || ''} onChange={(e) => updatePalier(p.id, 'prix', Number(e.target.value))} className={inputClass} />
                      <button type="button" onClick={() => removePalier(p.id)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ─── RIGHT SIDEBAR ─── */}
        <div className="space-y-6">

          {/* Product Settings */}
          <div className={sectionClass}>
            <h2 className={sectionTitle}>Parametres produit</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-700">Publie</span>
                <div className={`relative w-10 h-5 rounded-full transition ${isPublished ? 'bg-primary' : 'bg-gray-300'}`} onClick={() => setIsPublished(!isPublished)}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isPublished ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-700">Mis en avant (Featured)</span>
                <div className={`relative w-10 h-5 rounded-full transition ${isFeatured ? 'bg-primary' : 'bg-gray-300'}`} onClick={() => setIsFeatured(!isFeatured)}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isFeatured ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </label>
            </div>
          </div>

          {/* Shipping */}
          <div className={sectionClass}>
            <h2 className={sectionTitle}>Expedition</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-700">Livraison gratuite</span>
                <div className={`relative w-10 h-5 rounded-full transition ${freeShipping ? 'bg-primary' : 'bg-gray-300'}`} onClick={() => setFreeShipping(!freeShipping)}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${freeShipping ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </label>
              <div>
                <label className={labelClass}>Delai d&apos;expedition estime</label>
                <div className="flex gap-2 items-center">
                  <input type="number" value={estShippingDays} onChange={(e) => setEstShippingDays(e.target.value)} placeholder="Ex: 7-15" className={inputClass} />
                  <span className="text-sm text-gray-500 shrink-0">Jours</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="space-y-2">
            <button
              onClick={() => handleSubmit('publish')}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white px-4 py-3 rounded-lg hover:bg-primary/90 transition text-sm font-semibold disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Enregistrer & Publier
            </button>
            <button
              onClick={() => handleSubmit('unpublish')}
              disabled={saving}
              className="w-full px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
            >
              Enregistrer (non publie)
            </button>
            <button
              onClick={() => handleSubmit('draft')}
              disabled={saving}
              className="w-full px-4 py-2.5 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium hover:bg-gray-200 transition disabled:opacity-50"
            >
              Enregistrer comme brouillon
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
