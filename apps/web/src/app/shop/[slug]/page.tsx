'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Star,
  MessageCircle,
  Mail,
  Store,
  CheckCircle2,
  ChevronRight,
  Clock,
  TrendingUp,
  ShoppingBag,
  Info,
  Play,
  ImageIcon,
  Loader2,
} from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import ProductCard from '@/components/product/ProductCard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Shop {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  logoUrl?: string;
  bannerUrl?: string;
  banner?: string;
  description?: string;
  location?: string;
  city?: string;
  country?: string;
  countryCode?: string;
  flag?: string;
  years?: number;
  yearsActive?: number;
  staff?: string;
  staffCount?: string;
  verified?: boolean;
  isVerified?: boolean;
  rating?: number;
  reviewCount?: number;
  responseRate?: string;
  responseTime?: string;
  onTimeDelivery?: string;
  totalSales?: number;
  orderCount?: number;
  orderValue?: string;
  mainCategories?: string;
  capabilities?: string[];
  certifications?: string[];
  userId?: string;
  factoryImages?: { url: string; label?: string }[];
  overview?: Record<string, any>;
  supplierService?: number;
  onTimeShipment?: number;
  productQuality?: number;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RatingStars({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'w-4 h-4',
            i < Math.round(rating)
              ? 'fill-orange text-orange'
              : 'fill-gray-5 text-gray-5'
          )}
        />
      ))}
    </div>
  );
}

function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[14px] text-gray-2 w-[160px] shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-5 rounded-full overflow-hidden">
        <div
          className="h-full bg-orange rounded-full"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="text-[14px] font-semibold text-dark w-8 text-right">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

function FactoryGallery({ images }: { images: { url: string; label?: string }[] }) {
  const [idx, setIdx] = useState(0);
  if (!images || images.length === 0) return null;

  return (
    <div>
      <div className="relative rounded-lg overflow-hidden bg-gray-6 aspect-[5/4]">
        <img
          src={images[idx].url}
          alt="Usine"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-white text-[13px] drop-shadow-lg">
            EstuaireAchats | <span className="font-bold">Verified</span> Supplier
          </p>
        </div>
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
          <ImageIcon className="w-3 h-3" />
          {idx + 1}/{images.length}
        </div>
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 mt-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={cn(
                'flex-1 rounded-lg overflow-hidden relative h-[60px]',
                i === idx
                  ? 'ring-2 ring-orange'
                  : 'opacity-70 hover:opacity-100'
              )}
            >
              <img
                src={img.url}
                alt=""
                className="w-full h-full object-cover"
              />
              {img.label && (
                <span className="absolute inset-0 flex items-center justify-center text-white text-[11px] font-medium bg-black/40">
                  {img.label}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function ShopSkeleton() {
  return (
    <div className="min-h-screen bg-gray-6 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-gradient-to-b from-[#FFF5EE] to-white">
        <div className="max-w-[1440px] mx-auto px-6 py-8">
          <div className="flex gap-8">
            <div className="flex-1 space-y-4">
              <div className="h-7 bg-gray-200 rounded w-2/3" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="flex gap-3 mt-4">
                <div className="h-6 bg-gray-200 rounded w-20" />
                <div className="h-6 bg-gray-200 rounded w-32" />
              </div>
              <div className="h-12 bg-gray-200 rounded w-24 mt-4" />
              <div className="flex gap-10 mt-6">
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-28" />
                  <div className="h-5 bg-gray-200 rounded w-16" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-28" />
                  <div className="h-5 bg-gray-200 rounded w-16" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-28" />
                  <div className="h-5 bg-gray-200 rounded w-16" />
                </div>
              </div>
            </div>
            <div className="w-[400px] shrink-0">
              <div className="aspect-[5/4] bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
      {/* Products skeleton */}
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        <div className="h-6 bg-gray-200 rounded w-48 mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg overflow-hidden">
              <div className="aspect-square bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ShopPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Produits');
  const [chatLoading, setChatLoading] = useState(false);

  const handleContactSeller = async () => {
    if (!shop) return;
    const { user } = useAuthStore.getState();
    if (!user) { router.push('/login'); return; }
    if (chatLoading) return;
    setChatLoading(true);
    try {
      const receiverId = shop.userId || shop.id;
      const res = await api.post<{ data: { id: string } }>('/chat/conversations', {
        receiverId,
        initialMessage: `Bonjour, je suis intéressé par votre boutique "${shop.name}".`,
      });
      const convId = res.data?.id;
      router.push(convId ? `/account/messages?conv=${convId}` : '/account/messages');
    } catch {
      router.push('/account/messages');
    } finally {
      setChatLoading(false);
    }
  };

  // Fetch shop data
  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    setError(null);

    api
      .get<{ data: Shop }>(`/shops/${slug}`)
      .then((res) => {
        const shopData = res.data || (res as any);
        setShop(shopData);

        // Fetch products for this shop
        const shopId = shopData.id;
        return api.get<{ data: any[] }>(`/products?shopId=${shopId}`);
      })
      .then((res) => {
        setProducts(res.data || (res as any) || []);
      })
      .catch((err) => {
        console.error('Erreur chargement boutique:', err);
        setError(err.message || 'Impossible de charger la boutique');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  // ---------------------------------------------------------------------------
  // Loading / Error states
  // ---------------------------------------------------------------------------

  if (loading) return <ShopSkeleton />;

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-gray-6 flex items-center justify-center">
        <div className="bg-white rounded-lg p-12 text-center max-w-md">
          <Store className="w-12 h-12 mx-auto mb-4 text-gray-3 opacity-40" />
          <h2 className="text-xl font-bold text-dark mb-2">Boutique introuvable</h2>
          <p className="text-gray-3 mb-6">
            {error || 'Cette boutique n\'existe pas ou a ete supprimee.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-orange text-white rounded-full text-[14px] font-semibold hover:bg-orange-light transition-colors"
          >
            Retour a l'accueil
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Normalize shop data
  // ---------------------------------------------------------------------------

  const logo =
    shop.logo ||
    shop.logoUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      shop.name.slice(0, 2)
    )}&background=E82328&color=fff&size=60&bold=true`;

  const bannerUrl = shop.bannerUrl || shop.banner;
  const isVerified = shop.verified ?? shop.isVerified ?? false;
  const years = shop.years ?? shop.yearsActive ?? 0;
  const staff = shop.staff ?? shop.staffCount ?? '';
  const location = shop.location || [shop.city, shop.country].filter(Boolean).join(', ');
  const flagCode = (shop.flag || shop.countryCode || shop.country || '').toLowerCase();
  const capabilities = shop.capabilities || [];
  const certifications = shop.certifications || [];
  const factoryImages = shop.factoryImages || [];
  const rating = shop.rating ?? 0;
  const reviewCount = shop.reviewCount ?? 0;

  const TABS = ['Produits', 'Profil', 'Avis'];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-6">
      {/* ================================================================== */}
      {/* BANNER */}
      {/* ================================================================== */}
      {bannerUrl && (
        <div className="w-full h-[200px] bg-gray-200 overflow-hidden">
          <img
            src={bannerUrl}
            alt={`Banniere ${shop.name}`}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* ================================================================== */}
      {/* SHOP HEADER */}
      {/* ================================================================== */}
      <div className="bg-gradient-to-b from-[#FFF5EE] to-white">
        <div className="max-w-[1440px] mx-auto px-6 py-8">
          <div className="flex gap-8">
            {/* Left: Shop info */}
            <div className="flex-1 min-w-0">
              {/* Logo + Name + Buttons */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <img
                    src={logo}
                    alt={shop.name}
                    className="w-16 h-16 rounded-lg object-cover border border-gray-5"
                  />
                  <div>
                    <h1 className="text-[24px] font-bold text-dark">{shop.name}</h1>
                    <div className="flex items-center gap-2 mt-1 text-[14px] text-gray-2 flex-wrap">
                      {location && (
                        <>
                          <span>{location}</span>
                          {flagCode && (
                            <img
                              src={`https://flagcdn.com/w20/${flagCode}.png`}
                              alt=""
                              className="w-5 h-3.5 inline-block"
                            />
                          )}
                        </>
                      )}
                      {years > 0 && (
                        <>
                          <span>&middot;</span>
                          <span>{years} ans d'activite</span>
                        </>
                      )}
                      {staff && (
                        <>
                          <span>&middot;</span>
                          <span>{staff} employes</span>
                        </>
                      )}
                      {shop.mainCategories && (
                        <>
                          <span>&middot;</span>
                          <span className="truncate max-w-[300px]">
                            {shop.mainCategories}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <button
                    onClick={handleContactSeller}
                    className="flex items-center gap-2 px-5 py-2.5 border border-gray-4 text-dark rounded-full text-[14px] font-medium hover:border-dark transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Contacter le vendeur
                  </button>
                  <button
                    onClick={() =>
                      router.push(`/search?shopId=${shop.id}`)
                    }
                    className="flex items-center gap-2 px-5 py-2.5 bg-orange text-white rounded-full text-[14px] font-semibold hover:bg-orange-light transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Voir tous les produits
                  </button>
                </div>
              </div>

              {/* Verified badge */}
              <div className="flex items-center gap-3 mt-4">
                {isVerified && (
                  <span className="inline-flex items-center gap-1 text-[12px] font-bold text-white bg-gradient-to-r from-[#E82328] to-[#4A90D9] px-2.5 py-1 rounded">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified
                  </span>
                )}
                {certifications.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    {certifications.map((cert, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-bold text-secondary border border-secondary rounded px-1.5 py-0.5"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Rating */}
              <div className="mt-6">
                <div className="flex items-end gap-2">
                  <span className="text-[42px] font-black text-dark leading-none">
                    {rating.toFixed(1)}
                  </span>
                  <span className="text-[16px] text-gray-3 mb-1">/5</span>
                  <div className="mb-2 ml-2">
                    <RatingStars rating={rating} />
                    <span className="text-[13px] text-orange mt-0.5 inline-block">
                      {reviewCount} avis
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-start gap-10 mt-5 pt-5 border-t border-gray-5">
                {shop.responseRate && (
                  <div>
                    <p className="text-[13px] text-gray-3 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Taux de reponse
                    </p>
                    <p className="text-[18px] font-bold text-dark">
                      {shop.responseRate}
                    </p>
                  </div>
                )}
                {shop.responseTime && (
                  <div>
                    <p className="text-[13px] text-gray-3 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Temps de reponse
                    </p>
                    <p className="text-[18px] font-bold text-dark">
                      {shop.responseTime}
                    </p>
                  </div>
                )}
                {(shop.totalSales != null || shop.orderCount != null) && (
                  <div>
                    <p className="text-[13px] text-gray-3 flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Total ventes
                    </p>
                    <p className="text-[18px] font-bold text-dark">
                      {shop.orderValue ||
                        (shop.totalSales != null
                          ? formatPrice(shop.totalSales)
                          : `${shop.orderCount} commandes`)}
                    </p>
                  </div>
                )}
                {shop.onTimeDelivery && (
                  <div>
                    <p className="text-[13px] text-gray-3">Livraison a temps</p>
                    <p className="text-[18px] font-bold text-dark">
                      {shop.onTimeDelivery}
                    </p>
                  </div>
                )}
              </div>

              {/* Capabilities */}
              {capabilities.length > 0 && (
                <>
                  <div className="border-t border-gray-5 mt-5 pt-5" />
                  <div className="space-y-2.5">
                    {capabilities.slice(0, 5).map((cap, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                        <span className="text-[14px] text-dark font-medium">
                          {cap}
                        </span>
                      </div>
                    ))}
                  </div>
                  {capabilities.length > 5 && (
                    <p className="text-[13px] text-dark underline cursor-pointer mt-3">
                      Voir toutes les capacites ({capabilities.length})
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Right: Factory gallery */}
            {factoryImages.length > 0 && (
              <div className="w-[400px] shrink-0">
                <FactoryGallery images={factoryImages} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* TAB BAR */}
      {/* ================================================================== */}
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex gap-0 border-b border-gray-5 bg-white sticky top-[64px] z-20">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-6 py-4 text-[15px] font-medium transition-colors border-b-2',
                    activeTab === tab
                      ? 'border-dark text-dark'
                      : 'border-transparent text-gray-3 hover:text-dark'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* ============================================================ */}
            {/* TAB: Produits */}
            {/* ============================================================ */}
            {activeTab === 'Produits' && (
              <div className="bg-white p-8 mt-0">
                <h2 className="text-[20px] font-bold text-dark mb-6">
                  Produits de la boutique
                </h2>

                {products.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-10 h-10 mx-auto mb-3 text-gray-3 opacity-40" />
                    <p className="text-gray-3">
                      Aucun produit disponible pour le moment.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {products.map((product: any) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB: Profil */}
            {/* ============================================================ */}
            {activeTab === 'Profil' && (
              <div className="bg-white p-8 mt-0">
                <h2 className="text-[20px] font-bold text-dark mb-6">
                  Profil de la boutique
                </h2>

                {shop.description && (
                  <div className="mb-8">
                    <h3 className="text-[16px] font-bold text-dark mb-3">
                      A propos
                    </h3>
                    <p className="text-[14px] text-gray-2 leading-relaxed">
                      {shop.description}
                    </p>
                  </div>
                )}

                {/* Overview grid */}
                <h3 className="text-[16px] font-bold text-dark mb-4">
                  Informations generales
                </h3>
                <div className="grid grid-cols-2 gap-x-16 gap-y-5 mb-10">
                  {shop.name && (
                    <div>
                      <p className="text-[13px] text-gray-3">Nom</p>
                      <p className="text-[14px] font-semibold text-dark">
                        {shop.name}
                      </p>
                    </div>
                  )}
                  {location && (
                    <div>
                      <p className="text-[13px] text-gray-3">Localisation</p>
                      <p className="text-[14px] font-semibold text-dark">
                        {location}
                      </p>
                    </div>
                  )}
                  {years > 0 && (
                    <div>
                      <p className="text-[13px] text-gray-3">
                        Annees d'activite
                      </p>
                      <p className="text-[14px] font-semibold text-dark">
                        {years} ans
                      </p>
                    </div>
                  )}
                  {staff && (
                    <div>
                      <p className="text-[13px] text-gray-3">Employes</p>
                      <p className="text-[14px] font-semibold text-dark">
                        {staff}
                      </p>
                    </div>
                  )}
                  {isVerified && (
                    <div>
                      <p className="text-[13px] text-gray-3">Statut</p>
                      <p className="text-[14px] font-semibold text-dark flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4 text-secondary" />
                        Fournisseur verifie
                      </p>
                    </div>
                  )}
                </div>

                {/* Extended overview from API */}
                {shop.overview &&
                  Object.keys(shop.overview).length > 0 && (
                    <>
                      <h3 className="text-[16px] font-bold text-dark mb-4">
                        Details
                      </h3>
                      <div className="grid grid-cols-2 gap-x-16 gap-y-5 mb-10">
                        {Object.entries(shop.overview).map(([key, value]) => (
                          <div key={key}>
                            <p className="text-[13px] text-gray-3 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </p>
                            <p className="text-[14px] font-semibold text-dark">
                              {String(value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                {/* Certifications */}
                {certifications.length > 0 && (
                  <>
                    <h3 className="text-[16px] font-bold text-dark mb-4">
                      Certifications
                    </h3>
                    <div className="flex gap-3 flex-wrap mb-10">
                      {certifications.map((cert, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-[13px] font-bold text-secondary border border-secondary rounded-lg px-3 py-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {cert}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                {/* Capabilities */}
                {capabilities.length > 0 && (
                  <>
                    <h3 className="text-[16px] font-bold text-dark mb-4">
                      Capacites
                    </h3>
                    <div className="space-y-2.5">
                      {capabilities.map((cap, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                          <span className="text-[14px] text-dark font-medium">
                            {cap}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB: Avis */}
            {/* ============================================================ */}
            {activeTab === 'Avis' && (
              <div className="bg-white p-8 mt-0">
                <h2 className="text-[20px] font-bold text-dark mb-6">
                  Avis ({reviewCount})
                </h2>

                {/* Rating summary */}
                <div className="flex gap-10 mb-8">
                  <div>
                    <div className="flex items-end gap-1">
                      <span className="text-[48px] font-black text-dark leading-none">
                        {rating.toFixed(1)}
                      </span>
                      <span className="text-[16px] text-gray-3 mb-1">/5</span>
                    </div>
                    <RatingStars rating={rating} />
                    <p className="text-[14px] font-semibold text-dark mt-1">
                      {rating >= 4
                        ? 'Tres satisfait'
                        : rating >= 3
                        ? 'Satisfait'
                        : 'Moyen'}
                    </p>
                  </div>
                  <div className="flex-1 space-y-3">
                    {shop.supplierService != null && (
                      <RatingBar
                        label="Service fournisseur"
                        value={shop.supplierService}
                      />
                    )}
                    {shop.onTimeShipment != null && (
                      <RatingBar
                        label="Livraison a temps"
                        value={shop.onTimeShipment}
                      />
                    )}
                    {shop.productQuality != null && (
                      <RatingBar
                        label="Qualite produit"
                        value={shop.productQuality}
                      />
                    )}
                  </div>
                </div>

                {reviewCount === 0 && (
                  <div className="text-center py-12 border-t border-gray-5">
                    <Star className="w-10 h-10 mx-auto mb-3 text-gray-3 opacity-40" />
                    <p className="text-gray-3">
                      Aucun avis pour le moment.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* RIGHT SIDEBAR — Contact supplier */}
          {/* ============================================================== */}
          <div className="w-[220px] shrink-0">
            <div className="sticky top-[80px] bg-white rounded-lg border border-gray-5 p-5 mt-4">
              <h3 className="text-[15px] font-bold text-dark mb-3">
                Contacter le fournisseur
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={logo}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <p className="text-[13px] font-medium text-dark line-clamp-2">
                  {shop.name}
                </p>
              </div>
              <button
                onClick={handleContactSeller}
                className="w-full py-2.5 bg-orange text-white rounded-full text-[14px] font-semibold hover:bg-orange-light transition-colors mb-2 flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Contacter le vendeur
              </button>
              <button
                onClick={() =>
                  router.push(`/search?shopId=${shop.id}`)
                }
                className="w-full py-2.5 border border-gray-4 text-dark rounded-full text-[14px] font-medium hover:border-dark transition-colors mb-3 flex items-center justify-center gap-2"
              >
                <Store className="w-4 h-4" />
                Voir tous les produits
              </button>
              {isVerified && (
                <div className="border-t border-gray-5 pt-3 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-secondary" />
                  <span className="text-[12px] font-bold text-secondary">
                    Fournisseur verifie
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-12" />
    </div>
  );
}
