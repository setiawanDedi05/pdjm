'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
    loading: boolean,
    setLoading: (loading: boolean) => void;
    progress: number;
    setProgress: (progress: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      loading: false,
      setLoading: (loading: boolean) => set({ loading }),
      progress: 0,
      setProgress: (progress: number) => set({ progress }),
    }),
    {
      name: 'bengkel-pos-app',
      partialize: (state) => ({
        loading: state.loading,
      }),
    }
  )
);

