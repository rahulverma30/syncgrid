import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ProjectActivity } from '@/models/ProjectActivity';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    const companyId = session.user.companyId;

    const timeline = await ProjectActivity.find({ projectId: id, companyId })
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({ success: true, data: timeline });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'QUERY_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
