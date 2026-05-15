/**
 * Root provider
 * Combines all providers
 */

'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from './theme-provider';
import { ToastProvider } from './toast-provider';
import { ModalProvider } from './modal-provider';
import { QueryProvider } from './query-provider';
import { SessionProvider } from './session-provider';
import { TooltipProvider } from './tooltip-provider';

interface RootProviderProps {
  children: ReactNode;
}

export function RootProvider({ children }: RootProviderProps) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <QueryProvider>
          <TooltipProvider>
            <ModalProvider>
              <ToastProvider>{children}</ToastProvider>
            </ModalProvider>
          </TooltipProvider>
        </QueryProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
