import { NextResponse } from 'next/server';
import { getPortalSession, setPortalSessionCookie } from '@/lib/auth/portal';

export async function POST() {
  try {
    const session = await getPortalSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Session has expired.' },
        { status: 401 }
      );
    }

    // Refresh HTTP-Only cookie with new 24h expiration
    const sessionPayload = {
      userId: session.user.id,
      email: session.user.email,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };
    await setPortalSessionCookie(sessionPayload);

    return NextResponse.json({
      success: true,
      message: 'Session refreshed successfully.',
      data: {
        expiresAt: sessionPayload.expiresAt,
      },
    });
  } catch (error: any) {
    console.error('Session touch error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
