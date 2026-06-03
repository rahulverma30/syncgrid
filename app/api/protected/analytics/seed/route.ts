import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'API_ERROR', message: 'Sandbox seeding is disabled in production.' },
    { status: 403 }
  );
}

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'API_ERROR', message: 'Sandbox seeding is disabled in production.' },
    { status: 403 }
  );
}
