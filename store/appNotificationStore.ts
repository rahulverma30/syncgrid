import { create } from 'zustand';

export interface AppNotification {
  _id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

interface AppNotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: (unreadOnly?: boolean) => Promise<void>;
  markAllRead: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
}

export const useAppNotificationStore = create<AppNotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async (unreadOnly = false) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`/api/protected/notifications?unreadOnly=${unreadOnly}`);
      const json = await res.json();
      if (json.success) {
        set({
          notifications: json.data,
          unreadCount: json.unreadCount,
        });
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    } finally {
      set({ isLoading: false });
    }
  },

  markAllRead: async () => {
    try {
      await fetch('/api/protected/notifications', { method: 'PUT' });
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  },

  markAsRead: async (id: string) => {
    try {
      await fetch(`/api/protected/notifications/${id}`, { method: 'PUT' });
      set((state) => {
        const notifs = state.notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n));
        return {
          notifications: notifs,
          unreadCount: Math.max(0, state.unreadCount - 1),
        };
      });
    } catch (e) {
      console.error('Failed to mark notification as read', e);
    }
  },
}));
