'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';
import { Trophy, TrendingUp, Star, Flame } from 'lucide-react';

interface RankedProduct {
  id: string;
  name: string;
  slug?: string;
  thumbnailUrl?: string;
  images?: string[];
  priceMin?: number;
  price?: number;
  sold?: number;
  soldCount?: number;
  rating?: number;
  shopName?: string;
  shop?: { name: string };
}

type Tab = 'best' | 'trending' | 'new';

const TABS: { key: Tab; label: string; icon: typeof Trophy; sort: string }[] = [
  { key: 'best', label: 'Les plus vendus', icon: Trophy, sort: 'best_selling' },
  { key: 'trending', label: 'Tendances', icon: TrendingUp, sort: 'popular' },
  { key: 'new', label: 'Nouveautes', icon: Flame, sort: 'newest' },
];

function getRankStyle(rank: number) {
  if (rank === 1) return 'bg-yellow-400 text-white';
  if (rank === 2) return 'bg-gray-400 text-white';
  if (rank === 3) return 'bg-amber-700 text-white';
  return 'bg-gray-200 text-gray-600';
}

export default function TopRankingPage() {
  const [tab, setTab] = useState<Tab>('best');
  const [products, setProducts] = useState<RankedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentTab = TABS.find(t => t.key === tab);
    const sort = currentTab?.sort || 'best_selling';
    setLoading(true);
    api.get<{ data: RankedProduct[] }>(`/products?sort=${sort}&perPage=10`)
      .then(res => setProducts(res.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#191919] to-[#333] px-4 py-8">
        <div className="mx-auto max-w-6xl text-center">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-yellow-400" />
          <h1 className="text-3xl font-bold text-white">Top Classement</h1>
          <p className="mt-2 text-gray-400">Les produits les mieux classes sur EstuaireAchats</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition ${
                tab === t.key
                  ? 'bg-[#E82328] text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Product grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-lg bg-white shadow-sm animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg">Aucun produit disponible dans ce classement.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product, idx) => {
              const rank = idx + 1;
              const productSlug = product.slug || product.id;
              const productImage = product.thumbnailUrl || product.images?.[0] || '';
              const productPrice = product.priceMin ?? product.price ?? 0;
              const productShopName = product.shopName || product.shop?.name || '';
              const productSold = product.sold ?? product.soldCount ?? 0;
              const productRating = product.rating ?? 0;

              return (
                <Link
                  key={product.id}
                  href={`/product/${productSlug}`}
                  className="group relative overflow-hidden rounded-lg bg-white shadow-sm transition hover:shadow-md"
                >
                  {/* Rank badge */}
                  <div
                    className={`absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${getRankStyle(rank)}`}
                  >
                    #{rank}
                  </div>

                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    {productImage ? (
                      <Image
                        src={productImage}
                        alt={product.name}
                        fill
                        className="object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                        Pas d&apos;image
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="mb-1 line-clamp-2 text-sm font-medium text-[#191919] group-hover:text-[#E82328]">
                      {product.name}
                    </h3>
                    {productShopName && (
                      <p className="mb-2 text-xs text-gray-400">{productShopName}</p>
                    )}

                    {(productRating > 0 || productSold > 0) && (
                      <div className="mb-2 flex items-center gap-1">
                        {productRating > 0 && (
                          <>
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-medium text-[#191919]">{productRating}</span>
                          </>
                        )}
                        {productSold > 0 && (
                          <span className="text-xs text-gray-400">| {productSold} vendus</span>
                        )}
                      </div>
                    )}

                    <p className="text-lg font-bold text-[#E82328]">{formatPrice(productPrice)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
