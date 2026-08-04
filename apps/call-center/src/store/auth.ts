'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';

interface AgentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: string;
}

interface AuthState {
  user: AgentUser | null;
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
    const res = await api.post<{ data: { user: AgentUser; accessToken: string; refreshToken: string } }>(
      '/auth/login',
      { emailOrPhone: email, password },
    );
    if (res.data.user.role !== 'CALL_CENTER' && res.data.user.role !== 'ADMIN') {
      throw new Error('Acces refuse. Seuls les agents call center peuvent se connecter.');
    }
    localStorage.setItem('cc_accessToken', res.data.accessToken);
    localStorage.setItem('cc_refreshToken', res.data.refreshToken);
    set({ user: res.data.user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('cc_accessToken');
    localStorage.removeItem('cc_refreshToken');
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const token = localStorage.getItem('cc_accessToken');
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const res = await api.get<{ data: AgentUser }>('/auth/me');
      if (res.data.role !== 'CALL_CENTER' && res.data.role !== 'ADMIN') {
        localStorage.removeItem('cc_accessToken');
        set({ isLoading: false });
        return;
      }
      set({ user: res.data, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('cc_accessToken');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
