import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from './options';
import { AuthError, PermissionError } from './errors';
import { hasPermission, hasRole } from './permission-checks';

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
  const session = await auth();

  if (!session?.user) {
    throw new AuthError();
  }

  return session;
}

export async function requireRole(roles: string[]) {
  const session = await requireApiAuth();

  if (!hasRole(session.user.roles, roles)) {
    throw new PermissionError();
  }

  return session;
}

export async function requirePermission(resource: string, action: string) {
  const session = await requireApiAuth();

  if (!hasPermission(session.user.permissions, resource, action)) {
    throw new PermissionError();
  }

  return session;
}
