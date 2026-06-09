import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Permission } from '@/models';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();

    // Fetch all permission blueprints
    const permissions = await Permission.find({})
      .sort({ module: 1, resource: 1, action: 1 })
      .lean();

    return NextResponse.json({ success: true, data: permissions });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
