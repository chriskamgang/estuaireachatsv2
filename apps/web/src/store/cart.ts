'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  variation?: string;
  shopId: string;
  shopName: string;
  shopCity: string;
  shopCountry: string;
  maxStock: number;
  minQty: number;
}

interface CartState {
  items: CartItem[];
  itemCount: number;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity: number, variation?: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clearCart: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapGroupedCart(groups: any[]): CartItem[] {
  const items: CartItem[] = [];
  for (const group of groups) {
    for (const item of group.items) {
      items.push({
        id: item.id,
        productId: item.productId,
        productName: item.product?.name || '',
        productImage: item.product?.images?.[0]?.url || '/placeholder.png',
        price: item.price,
        quantity: item.quantity,
        variation: item.variation || undefined,
        shopId: item.product?.shop?.id || group.ownerId,
        shopName: group.shopName || item.product?.shop?.name || '',
        shopCity: group.shopCity || '',
        shopCountry: group.shopCountry || 'CM',
        maxStock: item.product?.stocks?.reduce((sum: number, s: any) => sum + s.qty, 0) || 9999,
        minQty: item.product?.minOrderQty || 1,
      });
    }
  }
  return items;
}

async function fetchAndMapCart(): Promise<CartItem[]> {
  const res = await api.get<{ data: any[] }>('/cart');
  return mapGroupedCart(res.data || []);
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  itemCount: 0,
  isLoading: false,

  fetchCart: async () => {
    try {
      set({ isLoading: true });
      const items = await fetchAndMapCart();
      set({ items, itemCount: items.length, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addToCart: async (productId, quantity, variation) => {
    await api.post('/cart/add', { productId, quantity, variation });
    const items = await fetchAndMapCart();
    set({ items, itemCount: items.length });
  },

  updateQuantity: async (cartItemId, quantity) => {
    await api.patch('/cart/change-quantity', { cartItemId, quantity });
    const items = await fetchAndMapCart();
    set({ items, itemCount: items.length });
  },

  removeItem: async (cartItemId) => {
    await api.delete(`/cart/${cartItemId}`);
    set((state) => {
      const items = state.items.filter((i) => i.id !== cartItemId);
      return { items, itemCount: items.length };
    });
  },

  clearCart: () => set({ items: [], itemCount: 0 }),
}));
