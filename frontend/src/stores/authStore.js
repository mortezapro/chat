import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/services/api';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: async (email, password) => {
        try {
          const response = await api.post('/auth/login', { email, password });
          set({
            user: response.data.user,
            token: response.data.token,
            isAuthenticated: true
          });
          api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
          return { success: true };
        } catch (error) {
          return {
            success: false,
            message: error.response?.data?.message || 'خطا در ورود'
          };
        }
      },
      
      register: async (userData) => {
        try {
          const response = await api.post('/auth/register', userData);
          set({
            user: response.data.user,
            token: response.data.token,
            isAuthenticated: true
          });
          api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
          return { success: true };
        } catch (error) {
          return {
            success: false,
            message: error.response?.data?.message || 'خطا در ثبت‌نام'
          };
        }
      },
      
      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false
          });
          delete api.defaults.headers.common['Authorization'];
        }
      },
      
      initialize: () => {
        const state = useAuthStore.getState();
        if (state.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
        }
      },
      
      setUser: (userData) => {
        set({ user: userData });
      }
    }),
    {
      name: 'auth-storage'
    }
  )
);

export { useAuthStore };

