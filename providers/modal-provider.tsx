/**
 * Modal provider
 * Context provider for modals and dialogs
 */

'use client';

import { ReactNode } from 'react';

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  return <>{children}</>;
}
