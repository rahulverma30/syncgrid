import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';

export const GET = withApiAuth(async (_request, _context, session) => {
  return NextResponse.json({
    success: true,
    data: {
      user: session.user,
    },
  });
});
