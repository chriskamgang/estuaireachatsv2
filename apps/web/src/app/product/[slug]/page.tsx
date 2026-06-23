'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star,
  Heart,
  ShieldCheck,
  Truck,
  MessageCircle,
  Minus,
  Plus,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  CreditCard,
  RotateCcw,
  Building2,
  ThumbsUp,
  CheckCircle,
  Box,
  Tag,
  Search,
  ShoppingCart,
  Plane,
  Warehouse,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import ProductCard from '@/components/product/ProductCard';
import type { Product } from '@/lib/mockData';

interface Review {
  id: string;
  author?: string;
  authorName?: string;
  country?: string;
  countryFlag?: string;
  rating: number;
  date?: string;
  createdAt?: string;
  text?: string;
  comment?: string;
  helpful?: number;
  helpfulCount?: number;
  verified?: boolean;
  isVerified?: boolean;
}

const RELATED_SEARCHES = [
  'Pieces auto Toyota', 'Pieces detachees VW', 'Filtre huile universel',
  'Ampoule LED voiture', 'Plaquettes frein ceramique', 'Batterie auto 12V',
  'Huile moteur 5W30', 'Eclairage LED H7', 'Suspension amortisseur', 'Accessoires auto',
];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // Product type from mockData is limited; API returns richer objects
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState('attributes');
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const { addToCart } = useCartStore();
  const recommendRef = useRef<HTMLDivElement>(null);

  const attributesRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const packingRef = useRef<HTMLDivElement>(null);

  const handleChat = async () => {
    if (!product) return;
    const { user } = useAuthStore.getState();
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      const sellerId = (product as any).shop?.userId || (product as any).shopId;
      const res = await api.post<{ data: { id: string } }>('/chat/conversations', {
        receiverId: sellerId,
        productId: product.id,
        initialMessage: `Bonjour, je suis intéressé par "${product.name}". Pouvez-vous me donner plus d'informations ?`,
      });
      const convId = res.data?.id;
      router.push(convId ? `/account/messages?conv=${convId}` : '/account/messages');
    } catch {
      router.push('/account/messages');
    }
  };

  useEffect(() => {
    setLoading(true);
    api.get<{ data: Product }>(`/products/${slug}`)
      .then(res => {
        if (res.data) {
          // Normalize API field: minOrderQty -> moq
          const p = res.data;
          if (!p.moq && (p as any).minOrderQty) {
            (p as any).moq = (p as any).minOrderQty;
          }
          setProduct(p);
          setQuantity(p.moq || (p as any).minOrderQty || 1);
          // Charger les avis
          api.get<{ data: Review[] }>(`/reviews/product/${res.data.id}`)
            .then(r => setReviews(r.data || []))
            .catch(() => {});
          // Charger produits similaires
          const cat = res.data.category;
          const catSlug = typeof cat === 'string' ? cat : (cat as any)?.slug;
          if (catSlug) {
            api.get<{ data: Product[] }>(`/products?category=${catSlug}&perPage=6`)
              .then(r => setSimilarProducts((r.data || []).filter(p => p.id !== res.data.id)))
              .catch(() => {});
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Produits recommandes
    api.get<{ data: Product[] }>('/products?perPage=10')
      .then(r => setRecommendedProducts(r.data || []))
      .catch(() => {});
  }, [slug]);

  const tiers = product?.priceTiers || [];
  const isWholesale = product?.isWholesale || product?.mode === 'WHOLESALE' || product?.mode === 'BOTH' || tiers.length > 1;

  const currentPrice = useMemo(() => {
    if (!product) return 0;
    if (tiers.length > 0) {
      const tier = tiers.find((t: any) => quantity >= t.minQty && (!t.maxQty || quantity <= t.maxQty));
      return tier ? tier.price : tiers[0].price;
    }
    return product.priceMin ?? product.price ?? 0;
  }, [quantity, product, tiers]);

  const totalPrice = currentPrice * quantity;

  const supplierProducts = recommendedProducts.filter(p => p.shopName === product?.shopName && p.id !== product?.id).slice(0, 7);

  const scrollRecommend = (dir: 'left' | 'right') => {
    if (recommendRef.current) {
      recommendRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
    }
  };

  const scrollToSection = (tab: string) => {
    setActiveTab(tab);
    const refs: Record<string, React.RefObject<HTMLDivElement | null>> = {
      attributes: attributesRef, reviews: reviewsRef, description: descriptionRef, packing: packingRef,
    };
    refs[tab]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const fullAttributes = product ? [
    { label: 'Type', value: product.category?.name || '' },
    { label: 'Origine', value: product.origin || product.shop?.country || '' },
    { label: 'Usage', value: 'Remplacement' },
    { label: 'Garantie', value: '12 mois' },
    { label: 'Etat', value: 'Neuf' },
    { label: 'MOQ', value: `${product.moq || product.minOrderQty || 1} pieces` },
    { label: 'Certification', value: 'ISO 9001' },
    { label: 'Materiau', value: 'Standard OEM' },
    { label: 'Marque', value: product.shopName?.split(' ')[0] || '' },
    { label: 'Emballage', value: 'Carton individuel' },
    { label: 'Poids', value: '0.5 - 2.0 kg' },
    { label: 'Delai production', value: '3-7 jours' },
  ] : [];

  const ratingDist = [
    { stars: 5, pct: 65 }, { stars: 4, pct: 22 }, { stars: 3, pct: 8 },
    { stars: 2, pct: 3 }, { stars: 1, pct: 2 },
  ];

  if (loading) {
    return (
      <div className="bg-gray-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-3">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-gray-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold text-dark mb-2">Produit introuvable</p>
          <p className="text-gray-3 mb-4">Ce produit n&apos;existe pas ou a ete supprime.</p>
          <Link href="/" className="text-orange hover:underline">Retour a l&apos;accueil</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-6 min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-gray-3 mb-4">
          <Link href="/" className="hover:text-orange">Accueil</Link>
          {product.category?.name && (
            <>
              <ChevronRight className="w-3 h-3" />
              <Link href={`/categories/${product.category.slug}`} className="hover:text-orange">{product.category.name}</Link>
            </>
          )}
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-2 truncate max-w-xs">{product.name}</span>
        </div>

        {/* ===== TOP SECTION: 3-column like Alibaba ===== */}
        <div className="flex gap-6">

          {/* LEFT COLUMN: Gallery + Supplier info below */}
          <div className="w-[500px] shrink-0 space-y-4">
            {/* Image Gallery */}
            <div className="bg-white rounded-lg p-4 flex gap-3">
              {/* Thumbnails vertical */}
              <div className="flex flex-col gap-2 shrink-0">
                {product.images.map((img: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    onMouseEnter={() => setSelectedImage(i)}
                    className={`w-[64px] h-[64px] rounded overflow-hidden border-2 transition-colors ${
                      selectedImage === i ? 'border-orange' : 'border-gray-5 hover:border-gray-4'
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
                {product.images.length > 5 && (
                  <button className="w-[64px] h-[28px] flex items-center justify-center rounded border border-gray-5 text-gray-3">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                )}
              </div>
              {/* Main Image */}
              <div className="relative flex-1 aspect-square rounded-lg overflow-hidden bg-gray-6">
                <img
                  src={product.images[selectedImage] || product.thumbnailUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className="absolute top-3 left-3 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-md transition-colors"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-primary text-primary' : 'text-gray-2'}`} />
                </button>
                {/* Zoom icon like Alibaba */}
                <button className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-md transition-colors">
                  <Search className="w-5 h-5 text-gray-2" />
                </button>
                {/* Next arrow */}
                {product.images.length > 1 && (
                  <button
                    onClick={() => setSelectedImage((prev) => (prev + 1) % product.images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-2" />
                  </button>
                )}
              </div>
            </div>

            {/* Supplier Info Card (below gallery, like Alibaba) */}
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-gray-6 flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6 text-gray-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/shop/${product.slug}`} className="text-sm font-bold text-dark hover:text-orange">
                    {product.shopName}
                  </Link>
                  <div className="flex items-center gap-1.5 text-xs text-gray-3 mt-0.5">
                    <span>{product.countryFlag}</span>
                    <span>{product.country}</span>
                    <span>&middot;</span>
                    <span>{product.shopYears} ans</span>
                  </div>
                </div>
              </div>
              {/* Metrics row */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-5">
                <div>
                  <span className="text-sm font-bold text-dark">{product.rating}/5</span>
                  <span className="text-xs text-gray-3 ml-0.5">({product.reviewCount})</span>
                  <p className="text-[11px] text-gray-3">Note boutique</p>
                </div>
                <div>
                  <span className="text-sm font-bold text-dark">≤4h</span>
                  <p className="text-[11px] text-gray-3">Temps de reponse</p>
                </div>
                <div>
                  <span className="text-sm font-bold text-dark">≥95%</span>
                  <p className="text-[11px] text-gray-3">Livraison a temps</p>
                </div>
                {product.rebuyRate && (
                  <div>
                    <span className="text-sm font-bold text-dark">{product.rebuyRate}%</span>
                    <p className="text-[11px] text-gray-3">Taux de rachat</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CENTER COLUMN: Product info */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-lg p-6">
              {/* Savings banner */}
              {currentPrice > 0 && (
                <div className="flex items-center gap-3 bg-[#FFF4EC] rounded-lg px-4 py-2.5 mb-4">
                  <Tag className="w-5 h-5 text-orange shrink-0" />
                  <p className="text-sm text-dark flex-1">
                    <span className="font-bold text-orange">Economisez {formatPrice(Math.round(currentPrice * 0.1))}</span>
                    {' '}sur les commandes de plus de {formatPrice(currentPrice * 10)} avec PayPal
                  </p>
                  <ChevronRight className="w-4 h-4 text-gray-3" />
                </div>
              )}

              {/* Title */}
              <h1 className="text-[20px] font-bold text-dark leading-tight mb-2">{product.name}</h1>

              {/* Rating + popularity */}
              <div className="flex items-center flex-wrap gap-3 mb-5">
                {product.reviewCount > 0 ? (
                  <>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'fill-[#FF9800] text-[#FF9800]' : 'text-gray-4'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-3">{product.reviewCount} avis</span>
                  </>
                ) : (
                  <span className="text-sm text-gray-3">Pas encore d&apos;avis</span>
                )}
                <span className="text-sm text-green font-medium flex items-center gap-1">
                  <span className="text-base">🏆</span>
                  #{1} plus populaire en {product.category?.name || ''}
                </span>
              </div>

              {/* PRICE — Wholesale: tier columns like Alibaba. Retail: single price */}
              {isWholesale && tiers.length > 1 ? (
                <div className="mb-5">
                  <div className="flex gap-0">
                    {tiers.map((tier: any, i: number) => {
                      const isActive = quantity >= tier.minQty && (!tier.maxQty || quantity <= tier.maxQty);
                      const unitLabel = product.unit || 'piece';
                      const rangeLabel = tier.maxQty
                        ? `${tier.minQty}-${tier.maxQty} ${unitLabel}`
                        : `≥${tier.minQty} ${unitLabel}`;
                      return (
                        <div key={i} className={`flex-1 px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-orange/10 border border-orange' : ''} ${i > 0 && !isActive ? 'border-l border-gray-5' : ''}`}>
                          <p className={`text-[20px] font-bold whitespace-nowrap ${isActive ? 'text-orange' : 'text-dark'}`}>
                            {formatPrice(tier.price)}
                          </p>
                          <p className={`text-[13px] ${isActive ? 'text-orange/70' : 'text-gray-3'}`}>{rangeLabel}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mb-1">
                  <span className="text-[28px] font-bold text-dark">{formatPrice(currentPrice)}</span>
                </div>
              )}
              {(product.moq ?? product.minOrderQty ?? 0) > 1 && (
                <p className="text-sm text-gray-3 mb-5">
                  Quantite minimum : {product.moq ?? product.minOrderQty} {product.unit || 'piece'}{(product.moq ?? product.minOrderQty) > 1 ? 's' : ''}
                </p>
              )}

              {/* Shipping timeline bar */}
              {(() => {
                const originCountry = (product.origin || product.shop?.country || 'CM').toUpperCase();
                const isInternational = originCountry !== 'CM';
                const originLabel = originCountry === 'CN' ? 'Chine' : originCountry === 'FR' ? 'France' : originCountry === 'US' ? 'USA' : originCountry === 'DE' ? 'Allemagne' : originCountry === 'JP' ? 'Japon' : originCountry === 'TR' ? 'Turquie' : originCountry === 'IN' ? 'Inde' : originCountry === 'KR' ? 'Coree' : originCountry;
                const intlDays = product.estShippingDays || (originCountry === 'CN' ? 25 : 20);
                const localDays = 3;

                if (isInternational) {
                  return (
                    <div className="mb-5 bg-[#FFF8F0] border border-orange/20 rounded-lg p-4">
                      <p className="text-xs font-semibold text-dark mb-3 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-orange" /> Estimation livraison
                      </p>
                      <div className="flex items-center gap-0">
                        {/* Origin */}
                        <div className="flex flex-col items-center">
                          <div className="w-9 h-9 rounded-full bg-orange/10 flex items-center justify-center">
                            <Plane className="w-4 h-4 text-orange" />
                          </div>
                          <p className="text-[11px] font-semibold text-dark mt-1.5">{originLabel}</p>
                        </div>
                        {/* Line 1 */}
                        <div className="flex-1 flex flex-col items-center mx-1">
                          <div className="w-full h-[2px] bg-orange/30 relative">
                            <div className="absolute inset-0 bg-orange/60" style={{ width: '60%' }} />
                          </div>
                          <p className="text-[10px] text-orange font-medium mt-1">{intlDays}-{intlDays + 10}j</p>
                        </div>
                        {/* Warehouse */}
                        <div className="flex flex-col items-center">
                          <div className="w-9 h-9 rounded-full bg-orange/10 flex items-center justify-center">
                            <Warehouse className="w-4 h-4 text-orange" />
                          </div>
                          <p className="text-[11px] font-semibold text-dark mt-1.5">Entrepot</p>
                          <p className="text-[10px] text-gray-3">Douala</p>
                        </div>
                        {/* Line 2 with Merci E */}
                        <div className="flex-1 flex flex-col items-center mx-1">
                          <div className="w-full h-[2px] bg-green/30 relative">
                            <div className="absolute inset-0 bg-green/60" style={{ width: '80%' }} />
                          </div>
                          <p className="text-[10px] text-green font-bold mt-1">Merci E</p>
                          <p className="text-[10px] text-green/70">{localDays}-{localDays + 2}j</p>
                        </div>
                        {/* Client */}
                        <div className="flex flex-col items-center">
                          <div className="w-9 h-9 rounded-full bg-green/10 flex items-center justify-center">
                            <Truck className="w-4 h-4 text-green" />
                          </div>
                          <p className="text-[11px] font-semibold text-dark mt-1.5">Client</p>
                        </div>
                      </div>
                    </div>
                  );
                }
                // Local product (Cameroon)
                return (
                  <div className="mb-5 bg-green/5 border border-green/20 rounded-lg p-4">
                    <p className="text-xs font-semibold text-dark mb-3 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-green" /> Estimation livraison
                    </p>
                    <div className="flex items-center gap-0">
                      {/* Seller */}
                      <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-green/10 flex items-center justify-center">
                          <Warehouse className="w-4 h-4 text-green" />
                        </div>
                        <p className="text-[11px] font-semibold text-dark mt-1.5">Vendeur</p>
                        <p className="text-[10px] text-gray-3">{product.shop?.city || 'Cameroun'}</p>
                      </div>
                      {/* Line with Merci E */}
                      <div className="flex-1 flex flex-col items-center mx-2">
                        <div className="w-full h-[2px] bg-green/30 relative">
                          <div className="absolute inset-0 bg-green/60" style={{ width: '80%' }} />
                        </div>
                        <p className="text-[10px] text-green font-bold mt-1">Merci E</p>
                        <p className="text-[10px] text-green/70">{product.estShippingDays || localDays}-{(product.estShippingDays || localDays) + 2}j</p>
                      </div>
                      {/* Client */}
                      <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-green/10 flex items-center justify-center">
                          <Truck className="w-4 h-4 text-green" />
                        </div>
                        <p className="text-[11px] font-semibold text-dark mt-1.5">Client</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Quantity (in center like Alibaba) */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-dark mb-2">Quantite</h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity((q) => Math.max(product.moq || product.minOrderQty || 1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center rounded border border-gray-5 text-gray-2 hover:border-orange hover:text-orange transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const minQty = product.moq || product.minOrderQty || 1;
                      const val = parseInt(e.target.value) || minQty;
                      setQuantity(Math.max(minQty, val));
                    }}
                    className="w-20 text-center py-2 border border-gray-5 rounded text-sm font-medium outline-none focus:border-orange"
                  />
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-9 h-9 flex items-center justify-center rounded border border-gray-5 text-gray-2 hover:border-orange hover:text-orange transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Add to Cart + Buy Now buttons */}
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={async () => {
                    const token = typeof window !== 'undefined' && localStorage.getItem('accessToken');
                    if (!token) { router.push('/login'); return; }
                    setAddingToCart(true);
                    try {
                      await addToCart(product.id, quantity);
                      setCartMessage('Produit ajoute au panier !');
                      setTimeout(() => setCartMessage(null), 3000);
                    } catch (err: any) {
                      setCartMessage(err?.message || 'Erreur lors de l\'ajout');
                      setTimeout(() => setCartMessage(null), 3000);
                    }
                    setAddingToCart(false);
                  }}
                  disabled={addingToCart}
                  className="flex-1 bg-orange hover:bg-orange-light disabled:opacity-60 text-white font-bold py-3 rounded-full transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {addingToCart ? 'Ajout en cours...' : 'Ajouter au panier'}
                </button>
                <button
                  onClick={async () => {
                    const token = typeof window !== 'undefined' && localStorage.getItem('accessToken');
                    if (!token) { router.push('/login'); return; }
                    setAddingToCart(true);
                    try {
                      await addToCart(product.id, quantity);
                      router.push('/cart');
                    } catch (err: any) {
                      setCartMessage(err?.message || 'Erreur lors de l\'ajout');
                      setTimeout(() => setCartMessage(null), 3000);
                      setAddingToCart(false);
                    }
                  }}
                  disabled={addingToCart}
                  className="flex-1 border-2 border-orange text-orange hover:bg-orange hover:text-white disabled:opacity-60 font-bold py-3 rounded-full transition-colors"
                >
                  Acheter maintenant
                </button>
              </div>
              {cartMessage && (
                <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm font-medium ${cartMessage.includes('Erreur') ? 'bg-red-50 text-red-600' : 'bg-green/10 text-green'}`}>
                  {cartMessage}
                </div>
              )}

              {/* Key attributes (compact preview) */}
              <div className="border-t border-gray-5 pt-5">
                <h4 className="text-sm font-semibold text-dark mb-3">Attributs cles</h4>
                <div className="border border-gray-5 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-3 divide-x divide-gray-5">
                    <div className="p-3">
                      <p className="text-xs text-gray-3 mb-1">Type</p>
                      <p className="text-sm font-medium text-dark">{product.category?.name || '-'}</p>
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-gray-3 mb-1">Origine</p>
                      <p className="text-sm font-medium text-dark">{product.countryFlag} {product.country}</p>
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-gray-3 mb-1">Usage</p>
                      <p className="text-sm font-medium text-dark">Remplacement</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-gray-5 border-t border-gray-5">
                    <div className="p-3">
                      <p className="text-xs text-gray-3 mb-1">Garantie</p>
                      <p className="text-sm font-medium text-dark">12 mois</p>
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-gray-3 mb-1">Etat</p>
                      <p className="text-sm font-medium text-dark">Neuf</p>
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-gray-3 mb-1">Numero modele</p>
                      <p className="text-sm font-medium text-dark">EA-{product.id.padStart(4, '0')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR (Sticky — like Alibaba) */}
          <div className="w-[300px] shrink-0">
            <div className="bg-white rounded-lg p-5 sticky top-4 space-y-5">
              {/* Shipping */}
              <div>
                <h4 className="text-[15px] font-bold text-dark mb-2">Expedition</h4>
                <p className="text-sm text-gray-2 leading-relaxed">
                  Les frais d&apos;expedition et la date de livraison sont a negocier.
                  Contactez le fournisseur pour plus de details.
                </p>
              </div>

              {/* Subtotal breakdown */}
              <div className="border-t border-gray-5 pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-2">Sous-total article</span>
                  <span className="text-sm text-dark">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-2">Expedition</span>
                  <span className="text-sm text-gray-3">A negocier</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-5">
                  <span className="text-sm font-bold text-dark">Sous-total</span>
                  <span className="text-sm font-bold text-dark">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              {/* Order protection */}
              <div className="border-t border-gray-5 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[15px] font-bold text-dark">Protection EA</h4>
                  <ChevronRight className="w-4 h-4 text-gray-3" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-green shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-dark">Paiements securises</p>
                      <p className="text-xs text-gray-3 leading-relaxed">
                        Chaque paiement est securise par cryptage SSL et conforme aux normes PCI DSS.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <RotateCcw className="w-4 h-4 text-green shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-dark">Garantie remboursement</p>
                      <p className="text-xs text-gray-3 leading-relaxed">
                        Remboursement si la commande n&apos;est pas expediee ou non conforme.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-2.5">
                <button
                  onClick={() => router.push(`/rfq?product=${product.slug}&qty=${quantity}`)}
                  className="w-full bg-orange hover:bg-orange-light text-white font-bold py-3 rounded-full transition-colors"
                >
                  Envoyer une demande
                </button>
                <button
                  onClick={handleChat}
                  className="w-full border border-orange text-orange hover:bg-orange hover:text-white font-semibold py-2.5 rounded-full transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Discuter maintenant
                </button>
              </div>

              {/* Trade Assurance note */}
              <p className="text-xs text-gray-3 leading-relaxed">
                Seules les commandes passees et payees via EstuaireAchats beneficient de la protection{' '}
                <span className="font-semibold text-orange">Trade Assurance</span>.
              </p>
            </div>
          </div>
        </div>

        {/* ===== RECOMMENDATIONS CAROUSEL ===== */}
        <div className="mt-6 bg-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-dark">Autres recommandations pour votre activite</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => scrollRecommend('left')} className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-5 text-gray-3 hover:border-orange hover:text-orange transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => scrollRecommend('right')} className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-5 text-gray-3 hover:border-orange hover:text-orange transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div ref={recommendRef} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {recommendedProducts.map((p) => (
              <Link key={p.id} href={`/product/${p.slug}`} className="shrink-0 w-[160px] group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-6 mb-2">
                  <img src={p.thumbnailUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <p className="text-xs text-dark line-clamp-2 leading-tight mb-1">{p.name}</p>
                <p className="text-sm font-bold text-dark">{formatPrice(p.priceMin)}</p>
                <p className="text-[11px] text-gray-3">MOQ: {p.moq} pieces</p>
              </Link>
            ))}
          </div>
        </div>

        {/* ===== TAB NAVIGATION (sticky) ===== */}
        <div className="mt-6 sticky top-0 z-30 bg-white rounded-t-lg border-b border-gray-5">
          <div className="flex items-center gap-0">
            {[
              { key: 'attributes', label: 'Attributs' },
              { key: 'reviews', label: `Avis (${product.reviewCount})` },
              { key: 'description', label: 'Description du fournisseur' },
              { key: 'packing', label: 'Emballage & Livraison' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => scrollToSection(tab.key)}
                className={`px-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key ? 'border-orange text-orange' : 'border-transparent text-gray-3 hover:text-dark'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ===== TAB CONTENT (2-column: content + sticky sidebar) ===== */}
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            {/* ATTRIBUTES */}
            <div ref={attributesRef} className="bg-white rounded-b-lg p-6">
              <h3 className="text-lg font-bold text-dark mb-4">Attributs cles</h3>
              <div className="border border-gray-5 rounded-lg overflow-hidden">
                {Array.from({ length: Math.ceil(fullAttributes.length / 2) }).map((_, rowIdx) => {
                  const left = fullAttributes[rowIdx * 2];
                  const right = fullAttributes[rowIdx * 2 + 1];
                  return (
                    <div key={rowIdx} className={`grid grid-cols-2 divide-x divide-gray-5 ${rowIdx > 0 ? 'border-t border-gray-5' : ''}`}>
                      {left && (
                        <div className="flex items-center">
                          <span className="w-[160px] shrink-0 px-4 py-3 text-sm text-gray-3 bg-gray-6">{left.label}</span>
                          <span className="px-4 py-3 text-sm text-dark">{left.value}</span>
                        </div>
                      )}
                      {right && (
                        <div className="flex items-center">
                          <span className="w-[160px] shrink-0 px-4 py-3 text-sm text-gray-3 bg-gray-6">{right.label}</span>
                          <span className="px-4 py-3 text-sm text-dark">{right.value}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* REVIEWS */}
            <div ref={reviewsRef} className="mt-6 bg-white rounded-lg p-6">
              <h3 className="text-lg font-bold text-dark mb-4">Evaluations et avis</h3>
              <div className="flex gap-8 mb-6 pb-6 border-b border-gray-5">
                <div className="text-center">
                  <p className="text-5xl font-bold text-dark">{product.rating}</p>
                  <div className="flex items-center justify-center gap-0.5 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-[#FF9800] text-[#FF9800]' : 'text-gray-4'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-gray-3 mt-1">{product.reviewCount} avis</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {ratingDist.map((r) => (
                    <div key={r.stars} className="flex items-center gap-2">
                      <span className="text-sm text-gray-3 w-14">{r.stars} etoile{r.stars > 1 ? 's' : ''}</span>
                      <div className="flex-1 h-2 bg-gray-5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#FF9800] rounded-full" style={{ width: `${r.pct}%` }} />
                      </div>
                      <span className="text-sm text-gray-3 w-10 text-right">{r.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-5">
                {reviews.length === 0 ? (
                  <p className="text-sm text-gray-3 text-center py-4">Aucun avis pour ce produit.</p>
                ) : reviews.map((review) => {
                  const author = review.author || review.authorName || 'Anonyme';
                  const country = review.country || review.countryFlag || '';
                  const date = review.date || review.createdAt || '';
                  const text = review.text || review.comment || '';
                  const helpful = review.helpful ?? review.helpfulCount ?? 0;
                  const isVerified = review.verified ?? review.isVerified ?? false;
                  return (
                    <div key={review.id} className="pb-5 border-b border-gray-5 last:border-b-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-full bg-orange/10 flex items-center justify-center text-sm font-bold text-orange">
                          {author[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-dark">{author}</span>
                            {country && <span className="text-sm">{country}</span>}
                            {isVerified && (
                              <span className="inline-flex items-center gap-0.5 text-[11px] text-green font-medium">
                                <CheckCircle className="w-3 h-3" /> Achat verifie
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-[#FF9800] text-[#FF9800]' : 'text-gray-4'}`} />
                            ))}
                            {date && <span className="text-xs text-gray-3 ml-1">{date.slice(0, 10)}</span>}
                          </div>
                        </div>
                      </div>
                      {text && <p className="text-sm text-gray-2 leading-relaxed ml-12">{text}</p>}
                      <div className="flex items-center gap-3 mt-2 ml-12">
                        <button className="flex items-center gap-1 text-xs text-gray-3 hover:text-orange transition-colors">
                          <ThumbsUp className="w-3 h-3" /> Utile ({helpful})
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button className="mt-4 text-sm font-medium text-orange hover:underline">
                Voir tous les {product.reviewCount} avis →
              </button>
            </div>

            {/* DESCRIPTION */}
            <div ref={descriptionRef} className="mt-6 bg-white rounded-lg p-6">
              <h3 className="text-lg font-bold text-dark mb-4">Description du produit par le fournisseur</h3>
              {product.description && (
                <p className="text-sm text-gray-2 leading-relaxed mb-6">{product.description}</p>
              )}
              <div className="space-y-4">
                <div className="bg-gray-6 rounded-lg p-4 text-center">
                  <img src={product.images[0] || product.thumbnailUrl} alt={product.name} className="max-w-[400px] mx-auto rounded-lg" />
                </div>
                <div className="text-sm text-gray-2 leading-relaxed space-y-3">
                  <p><strong className="text-dark">Qualite superieure :</strong> Fabrique a partir de materiaux de premiere qualite, ce produit repond aux normes internationales les plus strictes.</p>
                  <p><strong className="text-dark">Compatible :</strong> S&apos;adapte a une large gamme de modeles et d&apos;applications.</p>
                  <p><strong className="text-dark">Garantie fournisseur :</strong> Ce produit est couvert par une garantie de 12 mois contre les defauts de fabrication.</p>
                </div>
                {product.images.length > 1 && (
                  <div className="bg-gray-6 rounded-lg p-4 text-center">
                    <img src={product.images[1]} alt={`${product.name} detail`} className="max-w-[400px] mx-auto rounded-lg" />
                  </div>
                )}
              </div>
            </div>

            {/* PACKING & DELIVERY */}
            <div ref={packingRef} className="mt-6 bg-white rounded-lg p-6">
              <h3 className="text-lg font-bold text-dark mb-4">Emballage & Livraison</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-dark mb-3 flex items-center gap-2">
                    <Box className="w-4 h-4 text-orange" /> Emballage
                  </h4>
                  <div className="border border-gray-5 rounded-lg overflow-hidden">
                    {[
                      ['Type', 'Carton individuel'],
                      ['Dimensions', '30 x 20 x 15 cm'],
                      ['Poids brut', '0.5 - 2.0 kg'],
                      ['Par carton', '20 pieces/carton'],
                    ].map(([label, value], i, arr) => (
                      <div key={label} className={`flex ${i < arr.length - 1 ? 'border-b border-gray-5' : ''}`}>
                        <span className="w-[120px] shrink-0 px-3 py-2.5 text-xs text-gray-3 bg-gray-6">{label}</span>
                        <span className="px-3 py-2.5 text-xs text-dark">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-dark mb-3 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-orange" /> Livraison
                  </h4>
                  <div className="border border-gray-5 rounded-lg overflow-hidden">
                    {[
                      ['Express', '5-10 jours ouvrables'],
                      ['Standard', product.deliveryEstimate || '15-30 jours'],
                      ['Port', 'Douala, Cameroun'],
                      ['Production', '3-7 jours apres paiement'],
                    ].map(([label, value], i, arr) => (
                      <div key={label} className={`flex ${i < arr.length - 1 ? 'border-b border-gray-5' : ''}`}>
                        <span className="w-[120px] shrink-0 px-3 py-2.5 text-xs text-gray-3 bg-gray-6">{label}</span>
                        <span className="px-3 py-2.5 text-xs text-dark">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky sidebar for tab section */}
          <div className="w-[300px] shrink-0">
            <div className="sticky top-[56px] bg-white rounded-lg p-5 space-y-4 mt-0">
              {isWholesale && tiers.length > 1 ? (
                <div className="space-y-2">
                  {tiers.map((tier: any, i: number) => {
                    const isActive = quantity >= tier.minQty && (!tier.maxQty || quantity <= tier.maxQty);
                    const rangeLabel = tier.maxQty
                      ? `${tier.minQty}-${tier.maxQty} ${product.unit || 'pieces'}`
                      : `≥${tier.minQty} ${product.unit || 'pieces'}`;
                    return (
                      <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg ${isActive ? 'bg-orange/10 border border-orange' : 'bg-gray-6'}`}>
                        <span className={`text-lg font-bold whitespace-nowrap ${isActive ? 'text-orange' : 'text-dark'}`}>
                          {formatPrice(tier.price)}
                        </span>
                        <span className="text-xs text-gray-3">{rangeLabel}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange whitespace-nowrap">{formatPrice(currentPrice)}</p>
                  <p className="text-xs text-gray-3">/ piece (min. {product.moq || (product as any).minOrderQty || 1} pieces)</p>
                </div>
              )}
              <button
                onClick={() => router.push(`/rfq?product=${product.slug}&qty=${quantity}`)}
                className="w-full bg-orange hover:bg-orange-light text-white font-bold py-3 rounded-full transition-colors"
              >
                Envoyer une demande
              </button>
              <button
                onClick={handleChat}
                className="w-full border border-orange text-orange hover:bg-orange hover:text-white font-semibold py-2.5 rounded-full transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" /> Discuter maintenant
              </button>
              <div className="border-t border-gray-5 pt-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-2">
                  <ShieldCheck className="w-4 h-4 text-green shrink-0" /> Protection acheteur EA
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-2">
                  <CreditCard className="w-4 h-4 text-green shrink-0" /> Paiement securise
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-2">
                  <RotateCcw className="w-4 h-4 text-green shrink-0" /> Politique de remboursement
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== SUPPLIER'S POPULAR PRODUCTS ===== */}
        <div className="mt-6 bg-white rounded-lg p-6">
          <h2 className="text-lg font-bold text-dark mb-4">Produits populaires du fournisseur</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {supplierProducts.map((p) => (
              <Link key={p.id} href={`/product/${p.slug}`} className="group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-6 mb-2">
                  <img src={p.thumbnailUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <p className="text-xs text-dark line-clamp-2 leading-tight mb-1">{p.name}</p>
                <p className="text-sm font-bold text-dark">{formatPrice(p.priceMin)}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* ===== SIMILAR PRODUCTS ===== */}
        {similarProducts.length > 0 && (
          <div className="mt-6 bg-white rounded-lg p-6">
            <h2 className="text-lg font-bold text-dark mb-4">Produits similaires</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {similarProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* ===== RELATED SEARCHES ===== */}
        <div className="mt-6 bg-white rounded-lg p-6">
          <h2 className="text-lg font-bold text-dark mb-4">Recherches associees</h2>
          <div className="flex flex-wrap gap-2">
            {RELATED_SEARCHES.map((tag) => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                className="px-4 py-2 bg-gray-6 text-sm text-gray-2 rounded-full hover:bg-orange/5 hover:text-orange transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
