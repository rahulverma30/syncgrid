/**
 * Sidebar store
 * Manages sidebar state, collapse, and active routes
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface SidebarState {
  isCollapsed: boolean;
  isOpen: boolean;
  activeGroup: string | null;
  toggleCollapse: () => void;
  setIsOpen: (open: boolean) => void;
  setActiveGroup: (group: string | null) => void;
}

export const useSidebarStore = create<SidebarState>()(
  devtools(
    persist(
      (set) => ({
        isCollapsed: false,
        isOpen: true,
        activeGroup: null,
        toggleCollapse: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
        setIsOpen: (open) => set({ isOpen: open }),
        setActiveGroup: (group) => set({ activeGroup: group }),
      }),
      {
        name: 'sidebar-store',
      }
    )
  )
);
