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
      const duration = notification.duration ?? 5000;

      toast[notification.type](notification.title, {
        description: notification.message,
        duration: duration,
        action: notification.action
          ? {
              label: notification.action.label,
              onClick: notification.action.onClick,
            }
          : undefined,
        className: 'toast-slide toast-with-progress',
        classNames: {
          toast: 'toast-slide toast-with-progress',
        },
        style: {
          ['--toast-duration' as any]: `${duration}ms`,
        },
      });

      removeNotification(notification.id);
    });
  }, [notifications, removeNotification]);

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        richColors
        // closeButton
        expand
        duration={5000}
        toastOptions={{
          className: 'toast-slide toast-with-progress',
          classNames: {
            toast: 'toast-slide toast-with-progress',
          },
          style: {
            ['--toast-duration' as any]: '5000ms',
          },
        }}
      />
    </>
  );
}
