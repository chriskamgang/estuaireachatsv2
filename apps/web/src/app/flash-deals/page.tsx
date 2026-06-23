'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';
import { Zap, Clock } from 'lucide-react';

interface FlashDeal {
  id: string;
  name: string;
  slug?: string;
  image?: string;
  thumbnailUrl?: string;
  originalPrice?: number;
  discountedPrice?: number;
  price?: number;
  originalPriceValue?: number;
  discount?: number;
  discountPercent?: number;
  sold?: number;
  soldCount?: number;
  total?: number;
  stock?: number;
  product?: {
    id: string;
    name: string;
    slug: string;
    thumbnailUrl?: string;
    images?: string[];
    priceMin?: number;
  };
}

function useCountdown(hours: number) {
  const [timeLeft, setTimeLeft] = useState(hours * 3600);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const h = Math.floor(timeLeft / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;

  return { h, m, s };
}

export default function FlashDealsPage() {
  const { h, m, s } = useCountdown(6);
  const [deals, setDeals] = useState<FlashDeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: FlashDeal[] }>('/flash-deals')
      .then(res => setDeals(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Hero banner */}
      <div className="bg-gradient-to-r from-[#E82328] to-[#E82328] px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-4 text-white sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8" />
              <h1 className="text-3xl font-bold">Offres Flash</h1>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className="text-sm font-medium">Se termine dans</span>
              <div className="flex gap-1">
                <span className="rounded bg-white/20 px-2.5 py-1 text-lg font-bold backdrop-blur-sm">
                  {String(h).padStart(2, '0')}
                </span>
                <span className="py-1 text-lg font-bold">:</span>
                <span className="rounded bg-white/20 px-2.5 py-1 text-lg font-bold backdrop-blur-sm">
                  {String(m).padStart(2, '0')}
                </span>
                <span className="py-1 text-lg font-bold">:</span>
                <span className="rounded bg-white/20 px-2.5 py-1 text-lg font-bold backdrop-blur-sm">
                  {String(s).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product grid */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-lg bg-white shadow-sm animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-5 bg-gray-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Zap className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg">Aucune offre flash disponible pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {deals.map((deal) => {
              const prod = deal.product;
              const dealName = prod?.name || deal.name || '';
              const dealSlug = prod?.slug || deal.slug || deal.id;
              const dealImage = prod?.thumbnailUrl || prod?.images?.[0] || deal.image || deal.thumbnailUrl || '';
              const dealDiscountedPrice = deal.discountedPrice ?? deal.price ?? prod?.priceMin ?? 0;
              const dealOriginalPrice = deal.originalPrice ?? deal.originalPriceValue ?? 0;
              const dealDiscount = deal.discount ?? deal.discountPercent ?? 0;
              const dealSold = deal.sold ?? deal.soldCount ?? 0;
              const dealTotal = deal.total ?? deal.stock ?? 100;
              const soldPercent = dealTotal > 0 ? Math.min(100, Math.round((dealSold / dealTotal) * 100)) : 0;

              return (
                <Link
                  key={deal.id}
                  href={`/product/${dealSlug}`}
                  className="group overflow-hidden rounded-lg bg-white shadow-sm transition hover:shadow-md"
                >
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    {dealImage ? (
                      <Image
                        src={dealImage}
                        alt={dealName}
                        fill
                        className="object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                        Pas d&apos;image
                      </div>
                    )}
                    {dealDiscount > 0 && (
                      <div className="absolute left-2 top-2 rounded bg-[#E82328] px-2 py-0.5 text-xs font-bold text-white">
                        Economisez {dealDiscount}%
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="mb-2 line-clamp-2 text-sm text-[#191919] group-hover:text-[#E82328]">
                      {dealName}
                    </h3>

                    <div className="mb-2">
                      <span className="text-lg font-bold text-[#E82328]">
                        {formatPrice(dealDiscountedPrice)}
                      </span>
                      {dealOriginalPrice > 0 && (
                        <span className="ml-2 text-sm text-gray-400 line-through">
                          {formatPrice(dealOriginalPrice)}
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="relative h-5 overflow-hidden rounded-full bg-red-100">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#E82328] to-[#E82328]"
                        style={{ width: `${soldPercent}%` }}
                      />
                      <span className="relative z-10 flex h-full items-center justify-center text-xs font-medium text-white">
                        {dealSold} vendus
                      </span>
                    </div>
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
