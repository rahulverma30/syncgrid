import { NextResponse } from 'next/server';
import { signOut } from 'next-auth/react';

/**
 * POST /api/auth/logout
 * Logs out the current user and clears the session
 * @public Can be called by authenticated users
 * @returns Success confirmation
 */
export async function POST() {
  try {
    // NextAuth handles session clearing automatically via client-side signOut
    // This is just a confirmation endpoint for API calls
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'LOGOUT_FAILED',
        message: 'Unable to logout',
      },
      { status: 500 }
    );
  }
}
