import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth/session';

/**
 * GET /api/auth/me
 * Returns the current authenticated user's information
 * @protected Requires valid JWT token
 * @returns User profile with permissions
 */
export async function GET() {
  try {
    const session = await requireApiAuth();

    return NextResponse.json({
      success: true,
      data: session.user,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
      { status: 401 }
    );
  }
}
