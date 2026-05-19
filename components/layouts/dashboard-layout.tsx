'use client';

import { ReactNode, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Header, Sidebar } from '@/components/navigation';
import { Breadcrumb } from '@/components/ui';
import { useSidebarStore } from '@/store';
import { cn } from '@/lib/cn';
import { PageContainer } from './page-container';
import { useSession } from 'next-auth/react';
import { buildBreadcrumbs } from '@/lib/auth/navigation';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebarStore();
  const { data: session } = useSession();

  const breadcrumbs = useMemo(() => {
    return buildBreadcrumbs(pathname || '', session?.user);
  }, [pathname, session?.user]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Sidebar />
      <main
        className={cn(
          'min-h-screen pt-16 transition-[padding-left] duration-300 ease-out',
          isCollapsed ? 'md:pl-20' : 'md:pl-[280px]'
        )}
      >
        <div className="border-b border-border/70 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <PageContainer className="py-3">
            <Breadcrumb items={breadcrumbs} />
          </PageContainer>
        </div>
        <PageContainer>{children}</PageContainer>
      </main>
    </div>
  );
}
