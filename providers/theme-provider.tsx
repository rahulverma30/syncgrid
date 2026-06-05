/**
 * Theme provider — dark mode only.
 * Light mode is not supported. Dark is the flagship experience.
 */

'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ReactNode } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark"
      storageKey="syncgrid-theme"
    >
      {children}
    </NextThemesProvider>
  );
}
