'use client';

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui';
import { hasPermission } from '@/lib/auth/permission-checks';

/**
 * Props for protected page
 */
interface ProtectedPageProps {
  children: ReactNode;
  requiredRole?: string | string[];
  requiredPermission?: {
    resource: string;
    action: string;
  };
}

/**
 * Protected Page Wrapper Component
 * Ensures user is authenticated before rendering page
 * Can optionally check for specific roles or permissions
 *
 * Usage:
 * export default function Dashboard() {
 *   return (
 *     <ProtectedPage requiredRole="admin">
 *       <YourPageContent />
 *     </ProtectedPage>
 *   );
 * }
 */
export function ProtectedPage({ children, requiredRole, requiredPermission }: ProtectedPageProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!session?.user) {
    redirect('/login');
  }

  // Check role if required
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasRole = session.user.roles.some((role) =>
      roles.map((r) => r.toLowerCase()).includes(role.toLowerCase())
    );

    if (!hasRole) {
      redirect('/unauthorized');
    }
  }

  // Check permission if required
  if (requiredPermission) {
    const hasAccess = hasPermission(
      session.user.permissions || [],
      requiredPermission.resource,
      requiredPermission.action
    );

    if (!hasAccess) {
      redirect('/unauthorized');
    }
  }

  return <>{children}</>;
}
