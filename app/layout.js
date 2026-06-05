import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { RootProvider } from '@/providers';
import { CommandPalette } from '@/components/command-palette';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata = {
  title: 'SyncGrid - Enterprise ERP System',
  description: 'Enterprise-Grade Agency ERP & Company Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
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
