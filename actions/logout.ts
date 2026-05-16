'use server';

import { signOut } from 'next-auth/react';
import { redirect } from 'next/navigation';

/**
 * Server action to sign out the current user
 * Clears the session and redirects to login
 * @public Can be called from client components
 */
export async function logoutAction() {
  await signOut({
    redirect: false,
  });

  redirect('/login');
}
