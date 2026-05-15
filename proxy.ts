import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getAuthSecret } from '@/lib/env';
import { AUTH_PUBLIC_ROUTES } from '@/constants/rbac';
import { hasPermission } from '@/lib/auth/permission-checks';

const PROTECTED_PREFIXES = ['/dashboard', '/api/protected'];

const ROUTE_PERMISSIONS: Record<string, { resource: string; action: string }> = {
  '/dashboard': { resource: 'dashboard', action: 'read' },
  '/api/protected': { resource: 'api', action: 'read' },
};

function isPublicRoute(pathname: string) {
  return AUTH_PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function getRouteRequirement(pathname: string) {
  const matched = Object.keys(ROUTE_PERMISSIONS)
    .sort((a, b) => b.length - a.length)
    .find((route) => pathname === route || pathname.startsWith(`${route}/`));

  return matched ? ROUTE_PERMISSIONS[matched] : null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const protectedRoute = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!protectedRoute || isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: getAuthSecret(),
  });

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const requirement = getRouteRequirement(pathname);

  if (
    requirement &&
    !hasPermission(token.permissions as string[], requirement.resource, requirement.action)
  ) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'FORBIDDEN' }, { status: 403 });
    }

    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*'],
};
