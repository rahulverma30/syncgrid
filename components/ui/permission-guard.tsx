'use client';

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { EmptyState, LoadingSpinner } from '@/components/ui';
import { hasPermission, hasRole } from '@/lib/auth/permission-checks';

/**
 * Props for permission-based rendering
 */
interface PermissionGuardProps {
  children: ReactNode;
  resource: string;
  action: string;
  fallback?: ReactNode;
  strict?: boolean; // If true, redirect; if false, show fallback
}

/**
 * Permission Guard Component
 * Renders children only if user has required permission
 * Falls back to empty state if permission denied
 */
export function PermissionGuard({
  children,
  resource,
  action,
  fallback,
  strict = false,
}: PermissionGuardProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  if (!session?.user) {
    if (strict) {
      redirect('/login');
    }
    return fallback || <EmptyState title="Not authenticated" description="Please log in first" />;
  }

  const hasAccess = hasPermission(session.user.permissions, resource, action);

  if (!hasAccess) {
    if (strict) {
      redirect('/unauthorized');
    }
    return (
      fallback || (
        <EmptyState title="Access denied" description="You don't have permission to view this" />
      )
    );
  }

  return <>{children}</>;
}

/**
 * Props for role-based rendering
 */
interface RoleGuardProps {
  children: ReactNode;
  roles: string[];
  fallback?: ReactNode;
  strict?: boolean;
}

/**
 * Role Guard Component
 * Renders children only if user has required role
 */
export function RoleGuard({ children, roles, fallback, strict = false }: RoleGuardProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  if (!session?.user) {
    if (strict) {
      redirect('/login');
    }
    return fallback || <EmptyState title="Not authenticated" description="Please log in first" />;
  }

  const hasAccess = hasRole(session.user.roles, roles);

  if (!hasAccess) {
    if (strict) {
      redirect('/unauthorized');
    }
    return (
      fallback || (
        <EmptyState title="Access denied" description="You don't have the required role" />
      )
    );
  }

  return <>{children}</>;
}

/**
 * Props for multiple permission checks
 */
interface PermissionRequirementProps {
  children: ReactNode;
  require: 'any' | 'all';
  permissions: Array<{ resource: string; action: string }>;
  fallback?: ReactNode;
  strict?: boolean;
}

/**
 * Advanced Permission Guard Component
 * Supports 'any' (at least one) or 'all' (all required) permission checks
 */
export function PermissionRequirement({
  children,
  require,
  permissions,
  fallback,
  strict = false,
}: PermissionRequirementProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  if (!session?.user) {
    if (strict) {
      redirect('/login');
    }
    return fallback || <EmptyState title="Not authenticated" description="Please log in first" />;
  }

  const hasAccess =
    require === 'all'
      ? permissions.every((p) => hasPermission(session.user.permissions, p.resource, p.action))
      : permissions.some((p) => hasPermission(session.user.permissions, p.resource, p.action));

  if (!hasAccess) {
    if (strict) {
      redirect('/unauthorized');
    }
    return (
      fallback || (
        <EmptyState title="Access denied" description="You don't have the required permissions" />
      )
    );
  }

  return <>{children}</>;
}
