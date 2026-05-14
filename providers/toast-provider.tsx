/**
 * Toast provider
 * Wraps app with Sonner toaster
 */

'use client';

import { Toaster, toast } from 'sonner';
import { ReactNode, useEffect } from 'react';
import { useNotificationStore } from '@/store';

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const { notifications, removeNotification } = useNotificationStore();

  useEffect(() => {
    notifications.forEach((notification) => {
      toast[notification.type](notification.title, {
        description: notification.message,
        duration: notification.duration,
        action: notification.action
          ? {
              label: notification.action.label,
              onClick: notification.action.onClick,
            }
          : undefined,
      });

      removeNotification(notification.id);
    });
  }, [notifications, removeNotification]);

  return (
    <>
      {children}
      <Toaster position="bottom-right" richColors closeButton expand />
    </>
  );
}
