'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: string;
}

interface AuthState {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const res = await api.post<{ data: { user: AdminUser; accessToken: string; refreshToken: string } }>(
      '/auth/login',
      { emailOrPhone: email, password },
    );
    if (res.data.user.role !== 'ADMIN' && res.data.user.role !== 'STAFF') {
      throw new Error('Acces refuse. Seuls les administrateurs peuvent se connecter.');
    }
    localStorage.setItem('admin_accessToken', res.data.accessToken);
    localStorage.setItem('admin_refreshToken', res.data.refreshToken);
    set({ user: res.data.user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('admin_accessToken');
    localStorage.removeItem('admin_refreshToken');
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const token = localStorage.getItem('admin_accessToken');
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const res = await api.get<{ data: AdminUser }>('/auth/me');
      if (res.data.role !== 'ADMIN' && res.data.role !== 'STAFF') {
        localStorage.removeItem('admin_accessToken');
        set({ isLoading: false });
        return;
      }
      set({ user: res.data, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('admin_accessToken');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
