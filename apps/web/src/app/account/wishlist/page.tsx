'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlist';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';

export default function WishlistPage() {
  const { items, isLoading, fetchWishlist, toggle } = useWishlistStore();
  const { addToCart } = useCartStore();
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const displayItems = items;

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-xl font-bold text-dark">Mes favoris</h1>
        <div className="flex justify-center py-16">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-orange border-t-transparent" />
        </div>
      </div>
    );
  }

  if (displayItems.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-xl font-bold text-dark">Mes favoris</h1>
        <div className="flex flex-col items-center py-16">
          <Heart size={48} className="mb-4 text-gray-4" />
          <p className="mb-2 text-lg font-medium text-gray-2">Vous n&apos;avez aucun favori</p>
          <p className="mb-6 text-sm text-gray-3">
            Explorez nos produits et ajoutez vos coups de coeur
          </p>
          <Link
            href="/"
            className="rounded-lg bg-orange px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-light"
          >
            Explorer les produits
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-3 sm:p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg sm:text-xl font-bold text-dark">Mes favoris</h1>
        <span className="text-sm text-gray-3">{displayItems.length} article{displayItems.length > 1 ? 's' : ''}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {displayItems.map((item) => (
          <div
            key={item.id}
            className="group overflow-hidden rounded-lg border border-gray-5 transition-shadow hover:shadow-md"
          >
            <Link href={`/product/${item.product.slug}`} className="block">
              <div className="relative aspect-square overflow-hidden bg-gray-6">
                <img
                  src={item.product.thumbnailUrl}
                  alt={item.product.name}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
            </Link>
            <div className="p-3">
              <Link href={`/product/${item.product.slug}`}>
                <h3 className="mb-2 line-clamp-2 text-sm text-dark transition-colors hover:text-orange">
                  {item.product.name}
                </h3>
              </Link>
              <p className="mb-3 text-base font-bold text-primary">
                {formatPrice(item.product.unitPrice)}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    setAddingToCart(item.productId);
                    try {
                      await addToCart(item.productId, 1);
                    } catch {
                      // silently fail
                    } finally {
                      setAddingToCart(null);
                    }
                  }}
                  disabled={addingToCart === item.productId}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-orange px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-light disabled:opacity-60"
                >
                  {addingToCart === item.productId ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <ShoppingCart size={14} />
                  )}
                  Ajouter
                </button>
                <button
                  onClick={() => toggle(item.productId)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-5 text-gray-3 transition-colors hover:border-primary hover:text-primary"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
