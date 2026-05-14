/**
 * Dashboard layout
 * Layout for authenticated dashboard pages
 */

import { ReactNode } from 'react';
import { Header, Sidebar } from '@/components/navigation';
import { cn } from '@/lib/cn';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 pt-16">
          <div className="page-container">{children}</div>
        </main>
      </div>
    </div>
  );
}
