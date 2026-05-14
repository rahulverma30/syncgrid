/**
 * UI store
 * Manages general UI state
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  isLoading: boolean;
  setSidebarOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>()(
  devtools((set) => ({
    sidebarOpen: true,
    mobileMenuOpen: false,
    isLoading: false,
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
    setIsLoading: (loading) => set({ isLoading: loading }),
  }))
);
