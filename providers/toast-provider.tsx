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
        position="bottom-right"
        richColors
        expand={false}
        duration={5000}
        theme="dark"
        toastOptions={{
          className:
            'group !bg-black/60 !backdrop-blur-md !border-border/40 !text-foreground !rounded-xl !shadow-2xl font-sans tracking-tight',
          style: {
            ['--toast-duration' as any]: '5000ms',
            backdropFilter: 'blur(12px)',
          },
          classNames: {
            toast:
              'group flex items-start gap-3 p-4 !bg-black/80 !border-white/10 !text-white !rounded-xl !shadow-2xl',
            title: 'font-bold text-[13px] tracking-tight',
            description: 'text-[11px] text-white/60 font-medium',
            actionButton:
              'bg-white text-black font-bold text-[11px] px-3 py-1.5 rounded-lg hover:bg-white/90 transition-colors',
            cancelButton:
              'bg-transparent text-white/60 font-bold text-[11px] hover:text-white transition-colors',
            icon: 'mt-0.5',
            success: '!bg-emerald-500/10 !border-emerald-500/20 !text-emerald-500',
            error: '!bg-rose-500/10 !border-rose-500/20 !text-rose-500',
            warning: '!bg-amber-500/10 !border-amber-500/20 !text-amber-500',
            info: '!bg-blue-500/10 !border-blue-500/20 !text-blue-500',
          },
        }}
      />
    </>
  );
}
