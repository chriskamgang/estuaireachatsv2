'use client';

import Link from 'next/link';
import {
  Heart,
  MessageCircle,
  Mail,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface ShopProduct {
  id: string;
  name: string;
  slug: string;
  thumbnailUrl?: string;
  images?: string[];
  priceMin?: number;
  priceMax?: number;
  moq?: number;
}

interface Shop {
  id: string;
  name: string;
  slug?: string;
  logo?: string;
  logoUrl?: string;
  location?: string;
  city?: string;
  country?: string;
  countryFlag?: string;
  flag?: string;
  years?: number;
  yearsActive?: number;
  staff?: string;
  staffCount?: string;
  area?: string;
  revenue?: string;
  verified?: boolean;
  isVerified?: boolean;
  rating?: number;
  reviewCount?: number;
  capabilities?: string[];
  certifications?: string[];
  products?: ShopProduct[];
  factoryImages?: string[];
  responseTime?: string;
  onTimeDelivery?: string;
}

function FactoryCarousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  if (images.length === 0) return null;

  return (
    <div className="relative w-[240px] h-full rounded-lg overflow-hidden bg-gray-6 shrink-0">
      <img src={images[idx]} alt="Usine" className="w-full h-full object-cover" />
      {images.length > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-white/80 shadow hover:bg-white"
          >
            <ChevronLeft className="w-4 h-4 text-gray-2" />
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % images.length)}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-white/80 shadow hover:bg-white"
          >
            <ChevronRight className="w-4 h-4 text-gray-2" />
          </button>
        </>
      )}
      <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
        <ImageIcon className="w-3 h-3" />
        {idx + 1}/{images.length}
      </div>
    </div>
  );
}

export default function VerifiedManufacturersPage() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.get<{ data: Shop[] }>('/shops?verified=true')
      .then(res => setShops(res.data || []))
      .catch(() => setShops([]))
      .finally(() => setLoading(false));
  }, []);

  const toggleWishlist = (id: string) => {
    setWishlistedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="bg-gray-6 min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-dark mb-6">Fabricants Verified</h1>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-5 animate-pulse">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-[200px] space-y-2">
                    <div className="h-3 bg-gray-200 rounded" />
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                  </div>
                  <div className="flex gap-3 flex-1">
                    {[0, 1, 2].map((j) => (
                      <div key={j} className="flex-1">
                        <div className="aspect-square bg-gray-200 rounded-lg mb-2" />
                        <div className="h-3 bg-gray-200 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : shops.length === 0 ? (
          <div className="bg-white rounded-lg p-16 text-center">
            <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-gray-3 opacity-40" />
            <p className="text-gray-3 text-lg">Aucun fabricant verifie disponible.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {shops.map((m) => {
              const logo = m.logo || m.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name.slice(0, 2))}&background=E82328&color=fff&size=60&bold=true`;
              const shopSlug = m.slug || m.id;
              const isVerified = m.verified ?? m.isVerified ?? false;
              const years = m.years ?? m.yearsActive ?? 0;
              const staff = m.staff ?? m.staffCount ?? '';
              const products = m.products || [];
              const factoryImages = m.factoryImages || [];
              const capabilities = m.capabilities || [];
              const certifications = m.certifications || [];
              const isWishlisted = wishlistedIds.has(m.id);

              return (
                <div key={m.id} className="bg-white rounded-lg p-5">
                  {/* Top row: Logo + info + buttons */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <img src={logo} alt={m.name} className="w-12 h-12 rounded-lg object-cover" />
                      <div>
                        <Link href={`/shop/${shopSlug}`} className="text-[15px] font-bold text-dark hover:underline">
                          {m.name}
                        </Link>
                        <div className="flex items-center gap-1.5 text-sm text-gray-3 mt-0.5">
                          {isVerified && (
                            <span className="badge-verified inline-flex items-center gap-0.5 mr-1">
                              <ShieldCheck className="w-3 h-3" />
                              Verified
                            </span>
                          )}
                          {years > 0 && <><span>{years} ans</span><span>&middot;</span></>}
                          {staff && <><span>{staff} employes</span><span>&middot;</span></>}
                          {m.area && <><span>{m.area}</span><span>&middot;</span></>}
                          {m.revenue && <span>{m.revenue}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleWishlist(m.id)}
                        className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-5 text-gray-3 hover:text-primary hover:border-primary transition-colors"
                      >
                        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-primary text-primary' : ''}`} />
                      </button>
                      <button
                        onClick={() => router.push(`/shop/${shopSlug}`)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-gray-5 rounded-full text-dark hover:border-dark transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Discuter
                      </button>
                      <button
                        onClick={() => router.push(`/shop/${shopSlug}`)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-dark text-white rounded-full hover:bg-gray-1 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        Contacter
                      </button>
                    </div>
                  </div>

                  {/* Content: Info left + Products center + Factory image right */}
                  <div className="flex gap-6">
                    {/* Left: Rating + Capabilities */}
                    <div className="w-[200px] shrink-0">
                      {m.rating != null && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-3 font-medium mb-1">Evaluations et avis</p>
                          <p className="text-sm">
                            <span className="font-bold text-dark">{m.rating}/5</span>
                            {m.reviewCount != null && (
                              <span className="text-gray-3 ml-1">({m.reviewCount} avis)</span>
                            )}
                          </p>
                        </div>
                      )}
                      {capabilities.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-3 font-medium mb-1.5">Capacites usine</p>
                          <ul className="space-y-1">
                            {capabilities.map((cap, i) => (
                              <li key={i} className="text-sm text-dark font-medium">
                                &middot; {cap}
                              </li>
                            ))}
                          </ul>
                          {certifications.length > 0 && (
                            <div className="flex items-center gap-1 mt-2 flex-wrap">
                              <span className="text-xs text-gray-3">&middot; Certifications:</span>
                              {certifications.map((cert) => (
                                <span
                                  key={cert}
                                  className="text-[10px] font-bold border border-gray-4 rounded px-1.5 py-0.5 text-gray-2"
                                >
                                  {cert}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Center: products */}
                    {products.length > 0 && (
                      <div className="flex gap-3 flex-1 min-w-0">
                        {products.slice(0, 3).map((p, i) => {
                          const productImage = p.thumbnailUrl || p.images?.[0] || '';
                          return (
                            <Link
                              key={i}
                              href={`/product/${p.slug}`}
                              className="flex-1 group"
                            >
                              <div className="aspect-square rounded-lg overflow-hidden bg-gray-6 mb-2 relative">
                                {productImage ? (
                                  <img
                                    src={productImage}
                                    alt={p.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-200" />
                                )}
                              </div>
                              <p className="text-sm font-medium text-dark">
                                {formatPrice(p.priceMin ?? 0)}
                                {p.priceMax != null && p.priceMax > (p.priceMin ?? 0) && (
                                  <span className="text-gray-3">-{formatPrice(p.priceMax)}</span>
                                )}
                              </p>
                              {p.moq != null && (
                                <p className="text-xs text-gray-3">
                                  Min. commande: {p.moq} piece{p.moq > 1 ? 's' : ''}
                                </p>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}

                    {/* Right: Factory image carousel */}
                    {factoryImages.length > 0 && (
                      <FactoryCarousel images={factoryImages} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
