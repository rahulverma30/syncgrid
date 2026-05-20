import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Role } from '@/models';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    // Fetch roles belonging to this company or system-wide roles (companyId = null)
    const roles = await Role.find({
      $or: [{ companyId }, { companyId: null }],
    })
      .sort({ hierarchyLevel: 1 })
      .lean();

    return NextResponse.json({ success: true, data: roles });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});
