import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { NextResponse } from 'next/server';

const handler = NextAuth(authOptions);

const customHandler = async (req, res) => {
  try {
    return await handler(req, res);
  } catch (error) {
    console.error('NextAuth Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'AUTH_ERROR',
        message: error.message || 'Authentication error occurred',
      },
      { status: 500 }
    );
  }
};

export { customHandler as GET, customHandler as POST };
