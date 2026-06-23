'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';

interface SellerUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: string;
  shopName?: string;
}

interface AuthState {
  user: SellerUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { firstName: string; lastName: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const res = await api.post<{ data: { user: SellerUser; accessToken: string; refreshToken: string } }>(
      '/auth/login',
      { emailOrPhone: email, password },
    );
    if (res.data.user.role !== 'SELLER') {
      throw new Error('Acces refuse. Seuls les vendeurs peuvent se connecter.');
    }
    localStorage.setItem('seller_accessToken', res.data.accessToken);
    localStorage.setItem('seller_refreshToken', res.data.refreshToken);
    set({ user: res.data.user, isAuthenticated: true });
  },

  register: async (data) => {
    const res = await api.post<{ data: { user: SellerUser; accessToken: string; refreshToken: string } }>(
      '/auth/register',
      { ...data, role: 'SELLER' },
    );
    if (res.data.user.role !== 'SELLER') {
      throw new Error('Erreur lors de la creation du compte vendeur');
    }
    localStorage.setItem('seller_accessToken', res.data.accessToken);
    localStorage.setItem('seller_refreshToken', res.data.refreshToken);
    set({ user: res.data.user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('seller_accessToken');
    localStorage.removeItem('seller_refreshToken');
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const token = localStorage.getItem('seller_accessToken');
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const res = await api.get<{ data: SellerUser }>('/auth/me');
      if (res.data.role !== 'SELLER') {
        localStorage.removeItem('seller_accessToken');
        set({ isLoading: false });
        return;
      }
      set({ user: res.data, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('seller_accessToken');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
