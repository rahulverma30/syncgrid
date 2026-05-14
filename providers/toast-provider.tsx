/**
 * Toast provider
 * Wraps app with Sonner toaster
 */

'use client';

import { Toaster } from 'sonner';
import { ReactNode } from 'react';

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      {children}
      <Toaster 
        position="bottom-right" 
        richColors 
        closeButton
        expand
      />
    </>
  );
}
