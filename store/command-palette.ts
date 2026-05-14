/**
 * Command palette store
 * Manages command palette state and actions
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface CommandAction {
  id: string;
  title: string;
  description?: string;
  category: string;
  icon?: any;
  shortcut?: string[];
  action: () => void;
}

interface CommandPaletteState {
  isOpen: boolean;
  searchQuery: string;
  selectedIndex: number;
  actions: CommandAction[];
  togglePalette: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedIndex: (index: number) => void;
  registerActions: (actions: CommandAction[]) => void;
  executeAction: (id: string) => void;
}

export const useCommandPaletteStore = create<CommandPaletteState>()(
  devtools((set, get) => ({
    isOpen: false,
    searchQuery: '',
    selectedIndex: 0,
    actions: [],
    togglePalette: () => set((state) => ({ isOpen: !state.isOpen, searchQuery: '' })),
    setSearchQuery: (query) => set({ searchQuery: query, selectedIndex: 0 }),
    setSelectedIndex: (index) => set({ selectedIndex: index }),
    registerActions: (actions) => set({ actions }),
    executeAction: (id) => {
      const action = get().actions.find((a) => a.id === id);
      if (action) {
        action.action();
        set({ isOpen: false, searchQuery: '' });
      }
    },
  }))
);
