'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ShieldCheck,
  Truck,
  RefreshCw,
  Store,
} from 'lucide-react';

export default function CartPage() {
  const { items, updateQuantity, removeItem, isLoading } = useCartStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const groupedByShop = useMemo(() => {
    const map = new Map<string, { shopName: string; items: typeof items }>();
    for (const item of items) {
      const existing = map.get(item.shopId);
      if (existing) {
        existing.items.push(item);
      } else {
        map.set(item.shopId, { shopName: item.shopName, items: [item] });
      }
    }
    return map;
  }, [items]);

  const selectedItems = useMemo(
    () => items.filter((i) => selectedIds.has(i.id)),
    [items, selectedIds],
  );

  const subtotal = useMemo(
    () => selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [selectedItems],
  );

  const allSelected = items.length > 0 && selectedIds.size === items.length;

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  }

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleShop(shopId: string) {
    const shopItems = items.filter((i) => i.shopId === shopId);
    const allShopSelected = shopItems.every((i) => selectedIds.has(i.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const item of shopItems) {
        if (allShopSelected) next.delete(item.id);
        else next.add(item.id);
      }
      return next;
    });
  }

  // Empty cart
  if (!isLoading && items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5F5F5]">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="rounded-lg bg-white p-12 text-center shadow-sm">
            <ShoppingCart className="mx-auto mb-6 h-24 w-24 text-gray-300" />
            <h1 className="mb-2 text-2xl font-bold text-[#191919]">Votre panier est vide.</h1>
            <p className="mb-8 text-gray-500">
              Explorez nos produits et ajoutez vos articles preferes au panier.
            </p>

            <div className="mb-10 flex justify-center gap-8">
              <div className="flex flex-col items-center gap-2">
                <ShieldCheck className="h-8 w-8 text-[#E82328]" />
                <span className="text-sm text-[#191919] font-medium">Paiements securises</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Truck className="h-8 w-8 text-[#E82328]" />
                <span className="text-sm text-[#191919] font-medium">Livraison garantie</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="h-8 w-8 text-[#E82328]" />
                <span className="text-sm text-[#191919] font-medium">Protection de remboursement</span>
              </div>
            </div>

            <Link
              href="/"
              className="inline-block rounded-full bg-[#E82328] px-10 py-3 text-base font-semibold text-white transition hover:bg-[#D11F23]"
            >
              Commencer
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-28">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold text-[#191919]">Panier</h1>

        {/* Header row */}
        <div className="mb-2 hidden items-center rounded-t-lg bg-white px-4 py-3 text-sm text-gray-500 shadow-sm md:flex">
          <div className="w-10">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="h-4 w-4 accent-[#E82328]"
            />
          </div>
          <div className="flex-1">Produit</div>
          <div className="w-32 text-center">Prix unitaire</div>
          <div className="w-32 text-center">Quantite</div>
          <div className="w-32 text-center">Sous-total</div>
          <div className="w-16 text-center">Action</div>
        </div>

        {/* Grouped items */}
        {Array.from(groupedByShop.entries()).map(([shopId, group]) => {
          const shopAllSelected = group.items.every((i) => selectedIds.has(i.id));
          return (
            <div key={shopId} className="mb-4 overflow-hidden rounded-lg bg-white shadow-sm">
              {/* Shop header */}
              <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
                <input
                  type="checkbox"
                  checked={shopAllSelected}
                  onChange={() => toggleShop(shopId)}
                  className="h-4 w-4 accent-[#E82328]"
                />
                <Store className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-semibold text-[#191919]">{group.shopName}</span>
              </div>

              {/* Items */}
              {group.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 border-b border-gray-50 px-4 py-4 last:border-b-0 md:flex-row md:items-center"
                >
                  <div className="w-10 shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleItem(item.id)}
                      className="h-4 w-4 accent-[#E82328]"
                    />
                  </div>
                  <div className="flex flex-1 items-center gap-3">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {item.productImage && item.productImage !== '/placeholder.png' ? (
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          width={80}
                          height={80}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                          <ShoppingCart className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/product/${item.productId}`}
                        className="line-clamp-2 text-sm font-medium text-[#191919] hover:text-[#E82328]"
                      >
                        {item.productName}
                      </Link>
                      {item.variation && (
                        <span className="mt-1 inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                          {item.variation}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-32 text-center text-sm font-medium text-[#191919]">
                    {formatPrice(item.price)}
                  </div>

                  {/* Quantity selector */}
                  <div className="flex w-32 items-center justify-center">
                    <button
                      onClick={() =>
                        updateQuantity(item.id, Math.max(item.minQty, item.quantity - 1))
                      }
                      disabled={item.quantity <= item.minQty}
                      className="flex h-8 w-8 items-center justify-center rounded-l border border-gray-300 text-gray-600 transition hover:bg-gray-100 disabled:opacity-40"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="flex h-8 w-10 items-center justify-center border-y border-gray-300 text-sm font-medium text-[#191919]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.id, Math.min(item.maxStock, item.quantity + 1))
                      }
                      disabled={item.quantity >= item.maxStock}
                      className="flex h-8 w-8 items-center justify-center rounded-r border border-gray-300 text-gray-600 transition hover:bg-gray-100 disabled:opacity-40"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="w-32 text-center text-sm font-bold text-[#E82328]">
                    {formatPrice(item.price * item.quantity)}
                  </div>

                  <div className="flex w-16 justify-center">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="rounded p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-[#E82328]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Bottom sticky bar */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 accent-[#E82328]"
              />
              <span className="text-sm text-[#191919]">Tout selectionner</span>
              <span className="text-sm text-gray-400">
                ({selectedItems.length} article{selectedItems.length !== 1 ? 's' : ''})
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-sm text-gray-500">Sous-total : </span>
                <span className="text-lg font-bold text-[#E82328]">{formatPrice(subtotal)}</span>
              </div>
              <Link
                href={selectedItems.length > 0 ? '/checkout' : '#'}
                className={`rounded-full px-8 py-2.5 text-sm font-semibold text-white transition ${
                  selectedItems.length > 0
                    ? 'bg-[#E82328] hover:bg-[#D11F23]'
                    : 'cursor-not-allowed bg-gray-300'
                }`}
                onClick={(e) => {
                  if (selectedItems.length === 0) e.preventDefault();
                }}
              >
                Commander ({selectedItems.length})
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
