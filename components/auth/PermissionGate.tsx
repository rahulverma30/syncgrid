'use client';

import React, { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { hasPermission, hasRole } from '@/lib/auth/permission-checks';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PermissionGateProps {
  resource?: string;
  action?: string;
  roles?: string[];
  fallback?: ReactNode;
  fallbackDisabled?: boolean;
  children: ReactNode;
}

/**
 * <PermissionGate /> / <Can />
 * High-performance frontend authorization component.
 * Evaluates rules client-side using JWT scopes.
 */
export function PermissionGate({
  resource,
  action,
  roles,
  fallback = null,
  fallbackDisabled = false,
  children,
}: PermissionGateProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground/60 p-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Authorizing...</span>
      </div>
    );
  }

  const userPermissions = session?.user?.permissions || [];
  const userRoles = session?.user?.roles || [];

  let isAllowed = true;

  // Validate roles
  if (roles && roles.length > 0) {
    isAllowed = hasRole(userRoles, roles);
  }

  // Validate permission if resource & action are specified
  if (isAllowed && resource && action) {
    isAllowed = hasPermission(userPermissions, resource, action);
  }

  if (isAllowed) {
    return <>{children}</>;
  }

  if (fallbackDisabled) {
    // Elegant fallback: clone children and append disabled styles + attribute
    return (
      <>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            const anyChild = child as any;
            return React.cloneElement(child as any, {
              disabled: true,
              style: {
                ...(anyChild.props?.style || {}),
                opacity: 0.5,
                cursor: 'not-allowed',
                pointerEvents: 'none',
              },
              title: `Required access: ${resource}:${action}`,
            });
          }
          return child;
        })}
      </>
    );
  }

  return <>{fallback}</>;
}

// Semantic alias
export const Can = PermissionGate;

interface ProtectedRouteProps {
  resource: string;
  action: string;
  children: ReactNode;
}

/**
 * <ProtectedRoute />
 * Enforces route-level access control. Renders an elegant Access Denied state if unauthorized.
 */
export function ProtectedRoute({ resource, action, children }: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950/40 backdrop-blur-md">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-semibold text-muted-foreground animate-pulse">
            Verifying corporate credentials...
          </p>
        </div>
      </div>
    );
  }

  const userPermissions = session?.user?.permissions || [];
  const isAllowed = hasPermission(userPermissions, resource, action);

  if (!isAllowed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] p-8 text-center animate-fade-in">
        <div className="h-16 w-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-6 border border-rose-500/20">
          <ShieldAlert className="h-8 w-8 text-rose-500" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">
          Enterprise Access Blocked
        </h1>
        <p className="text-sm text-muted-foreground/80 max-w-md mb-6 leading-relaxed">
          Your active corporate security profile lacks the required privilege (
          <code className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-rose-400 font-mono text-xs">
            {resource}:{action}
          </code>
          ) to load this secure module. Contact your organization administrator to request role
          reassignment.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted/40 transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow"
          >
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
