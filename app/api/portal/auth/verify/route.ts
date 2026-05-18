import { NextResponse } from 'next/server';
import { getPortalSession } from '@/lib/auth/portal';

export async function GET() {
  try {
    const session = await getPortalSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'No active session found.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: session.user,
    });
  } catch (error: any) {
    console.error('Portal Session Verify API Error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
