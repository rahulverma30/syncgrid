/**
 * Modal store
 * Manages modal and dialog states
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Modal {
  id: string;
  type: 'alert' | 'confirm' | 'form' | 'custom';
  title?: string;
  message?: string;
  data?: Record<string, any>;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ModalState {
  modals: Map<string, Modal>;
  openModal: (modal: Modal) => void;
  closeModal: (id: string) => void;
  closeAll: () => void;
  getModal: (id: string) => Modal | undefined;
}

export const useModalStore = create<ModalState>()(
  devtools((set, get) => ({
    modals: new Map(),
    openModal: (modal) =>
      set((state) => {
        const newModals = new Map(state.modals);
        newModals.set(modal.id, modal);
        return { modals: newModals };
      }),
    closeModal: (id) =>
      set((state) => {
        const newModals = new Map(state.modals);
        newModals.delete(id);
        return { modals: newModals };
      }),
    closeAll: () => set({ modals: new Map() }),
    getModal: (id) => get().modals.get(id),
  }))
);
