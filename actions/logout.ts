'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Server action to sign out the current user
 * Clears the session and redirects to login safely on the server side
 * by removing the NextAuth cookies.
 */
export async function logoutAction() {
  const cookieStore = await cookies();

  // Clear all standard and secure NextAuth cookies
  cookieStore.delete('next-auth.session-token');
  cookieStore.delete('__Secure-next-auth.session-token');
  cookieStore.delete('next-auth.callback-url');
  cookieStore.delete('next-auth.csrf-token');

  redirect('/login');
}
