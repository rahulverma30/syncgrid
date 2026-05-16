import './globals.css';
import { RootProvider } from '@/providers';
import { CommandPalette } from '@/components/command-palette';

export const metadata = {
  title: 'SyncGrid - Enterprise ERP System',
  description: 'Enterprise-Grade Agency ERP & Company Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body>
        <RootProvider>
          {children}
          <CommandPalette />
        </RootProvider>
      </body>
    </html>
  );
}
