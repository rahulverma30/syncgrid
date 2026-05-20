import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getAuthSecret } from '@/lib/env';
import { AUTH_PUBLIC_ROUTES } from '@/constants/rbac';

/**
 * RBAC Route Protection Middleware
 *
 * Protects routes and enforces authentication/authorization at the gateway layer.
 * Uses NextAuth JWT tokens for secure validation.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (AUTH_PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.next();
  }

  // Protect dashboard, secure modules, and secure API endpoints
  const protectedPaths = [
    '/dashboard',
    '/crm',
    '/clients',
    '/projects',
    '/tasks',
    '/finance',
    '/hr',
    '/analytics',
    '/collaboration',
    '/notifications',
    '/settings',
    '/roles',
    '/design-system',
    '/automation',
    '/calendar',
    '/knowledge',
    '/profile',
    '/reports',
    '/team',
    '/api/protected',
  ];

  const isProtected = protectedPaths.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtected) {
    const tStart = performance.now();
    const token = await getToken({
      req: request,
      secret: getAuthSecret(),
    });
    const tTokenEnd = performance.now();

    // Redirect to login if no valid token exists
    if (!token) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          {
            success: false,
            error: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
          { status: 401 }
        );
      }

      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user status is disabled
    if ((token as any).status === 'disabled') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          {
            success: false,
            error: 'FORBIDDEN',
            message: 'Account is disabled',
          },
          { status: 403 }
        );
      }

      return NextResponse.redirect(new URL('/login?error=account-disabled', request.url));
    }

    const tEnd = performance.now();
    // Token is valid and account is active, allow the request to proceed
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    '/((?!_next|static|favicon.ico|public).*)',
    '/dashboard/:path*',
    '/api/protected/:path*',
  ],
};
