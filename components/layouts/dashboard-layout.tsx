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
          'min-h-screen pt-14 transition-[padding-left] duration-300 ease-out',
          isCollapsed ? 'md:pl-16' : 'md:pl-64'
        )}
      >
        <div className="border-b border-border/40 bg-background/90 backdrop-blur-md">
          <PageContainer className="py-2.5">
            <Breadcrumb items={breadcrumbs} />
          </PageContainer>
        </div>
        <PageContainer>{children}</PageContainer>
      </main>
    </div>
  );
}
