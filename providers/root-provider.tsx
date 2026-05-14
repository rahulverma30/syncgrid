/**
 * Root provider
 * Combines all providers
 */

'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from './theme-provider';
import { ToastProvider } from './toast-provider';
import { ModalProvider } from './modal-provider';

interface RootProviderProps {
  children: ReactNode;
}

export function RootProvider({ children }: RootProviderProps) {
  return (
    <ThemeProvider>
      <ModalProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </ModalProvider>
    </ThemeProvider>
  );
}
