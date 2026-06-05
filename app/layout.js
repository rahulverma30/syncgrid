import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { RootProvider } from '@/providers';
import { CommandPalette } from '@/components/command-palette';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

// ── 1. Load Inter for the main UI ─────────────────────────────
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

// ── 2. Load JetBrains Mono for data/numbers/code ──────────────
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata = {
  title: 'SyncGrid - Enterprise ERP System',
  description: 'Enterprise-Grade Agency ERP & Company Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased relative`}
      >
        <div className="pointer-events-none fixed left-0 top-0 z-[-1] w-full h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-background/0 to-background/0"></div>
        <RootProvider>
          {children}
          <CommandPalette />
        </RootProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
