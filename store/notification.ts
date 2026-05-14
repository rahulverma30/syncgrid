/**
 * Notification store
 * Manages app notifications and alerts
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools((set) => ({
    notifications: [],
    addNotification: (notification) =>
      set((state) => ({
        notifications: [
          ...state.notifications,
          {
            ...notification,
            id: `${Date.now()}-${Math.random()}`,
          },
        ],
      })),
    removeNotification: (id) =>
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      })),
    clearNotifications: () => set({ notifications: [] }),
  }))
);
