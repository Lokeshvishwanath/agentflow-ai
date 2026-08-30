import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          set({ user: data.user, token: data.token, isLoading: false });
          return data;
        } catch (err) {
          const msg = err.response?.data?.message || 'Login failed';
          set({ error: msg, isLoading: false });
          throw new Error(msg);
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post('/auth/register', { name, email, password });
          set({ user: data.user, token: data.token, isLoading: false });
          return data;
        } catch (err) {
          const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed';
          set({ error: msg, isLoading: false });
          throw new Error(msg);
        }
      },

      logout: () => set({ user: null, token: null }),

      fetchMe: async () => {
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data.user });
        } catch { set({ user: null, token: null }); }
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'auth-storage', partialize: (s) => ({ user: s.user, token: s.token }) }
  )
);

export default useAuthStore;
