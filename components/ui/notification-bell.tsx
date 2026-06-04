'use client';

import React, { useEffect } from 'react';
import { useAppNotificationStore } from '@/store/appNotificationStore';
import { NotificationDropdown } from './notification-center';
import { useSession } from 'next-auth/react';
import type { NotificationItem } from './notification-center';

export function NotificationBellWidget() {
  const { data: session } = useSession();
  const { notifications, unreadCount, fetchNotifications, markAllRead, markAsRead } =
    useAppNotificationStore();

  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
      // Optional: Setup interval or websocket for real-time
      const interval = setInterval(() => {
        fetchNotifications();
      }, 30000); // Polling every 30s
      return () => clearInterval(interval);
    }
  }, [session, fetchNotifications]);

  const mappedNotifications: NotificationItem[] = notifications.map((n) => ({
    id: n._id,
    title: n.title,
    description: n.description,
    time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read: n.isRead,
    type: ['lead', 'deal', 'success', 'payment'].includes(n.type)
      ? 'success'
      : ['warning', 'alert', 'overdue'].includes(n.type)
        ? 'warning'
        : 'info',
  }));

  return (
    <NotificationDropdown
      notifications={mappedNotifications}
      onMarkRead={(id) => markAsRead(id)}
      onMarkAllRead={() => markAllRead()}
      onClearAll={() => {}}
    />
  );
}
