'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
    loading: boolean,
    setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      loading: false,
      setLoading: (loading: boolean) => set({ loading }),
    }),
    {
      name: 'bengkel-pos-auth',
      partialize: (state) => ({
        loading: state.loading,
      }),
    }
  )
);

