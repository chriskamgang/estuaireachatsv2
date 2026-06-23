'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';

interface WishlistItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    thumbnailUrl: string;
    unitPrice: number;
  };
}

interface WishlistState {
  items: WishlistItem[];
  count: number;
  isLoading: boolean;
  fetchWishlist: () => Promise<void>;
  toggle: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  count: 0,
  isLoading: false,

  fetchWishlist: async () => {
    try {
      set({ isLoading: true });
      const res = await api.get<{ data: WishlistItem[] }>('/wishlist');
      const items = res.data || [];
      set({ items, count: items.length, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  toggle: async (productId) => {
    const inList = get().isInWishlist(productId);
    if (inList) {
      await api.delete(`/wishlist/${productId}`);
      set((state) => {
        const items = state.items.filter((i) => i.productId !== productId);
        return { items, count: items.length };
      });
    } else {
      await api.post('/wishlist', { productId });
      await get().fetchWishlist();
    }
  },

  isInWishlist: (productId) => {
    return get().items.some((i) => i.productId === productId);
  },
}));
