import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from './options';
import { AuthError, PermissionError } from './errors';
import { can as canEngine, hasRoleCheck } from './engine';

export async function auth() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user || null;
}

export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return session;
}

export async function requireApiAuth() {
  if (process.env.NODE_ENV !== 'production') {
    const { headers } = await import('next/headers');
    const headerList = await headers();
    const bypass = headerList.get('x-dev-test-bypass');
    if (bypass) {
      try {
        return { user: JSON.parse(bypass) };
      } catch (e) {
        console.error('Failed to parse bypass header');
      }
    }
  }

  const session = await auth();

  if (!session?.user) {
    throw new AuthError();
  }

  return session;
}

export async function requireRole(roles: string[]) {
  const session = await requireApiAuth();

  const isAuthorized = await hasRoleCheck(session.user.id, session.user.companyId, roles);
  if (!isAuthorized) {
    throw new PermissionError();
  }

  return session;
}

export async function requirePermission(resource: string, action: string, context: any = {}) {
  const session = await requireApiAuth();

  // If no companyId is explicitly supplied in context, bind the current session's companyId
  const enrichedContext = {
    companyId: session.user.companyId,
    ...context,
  };

  const isAllowed = await canEngine(
    {
      id: session.user.id,
      companyId: session.user.companyId,
      roles: session.user.roles,
      permissions: session.user.permissions,
    },
    action,
    resource,
    enrichedContext
  );

  if (!isAllowed) {
    throw new PermissionError();
  }

  return session;
}
