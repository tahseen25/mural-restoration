// src/store/authStore.js
import { create } from 'zustand';
import api from '@/services/api';

const useAuthStore = create((set, get) => ({
  user:        null,
  token:       null,
  isLoading:   false,
  isHydrated:  false,

  /** Called once on app mount — restore token from localStorage */
  initAuth: () => {
    const token = localStorage.getItem('mural_token');
    if (token) {
      set({ token });
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      get().fetchMe();
    } else {
      set({ isHydrated: true });
    }
  },

  /** Set token after Google OAuth callback or login */
  setToken: (token) => {
    localStorage.setItem('mural_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    set({ token });
    get().fetchMe();
  },

  /** Fetch current user profile */
  fetchMe: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, isHydrated: true });
    } catch {
      get().logout();
    } finally {
      set({ isLoading: false });
    }
  },

  /** Update local user state (e.g. after profile edit) */
  setUser: (user) => set({ user }),

  logout: () => {
    localStorage.removeItem('mural_token');
    delete api.defaults.headers.common['Authorization'];
    set({ user: null, token: null, isHydrated: true });
  },
}));

export default useAuthStore;
