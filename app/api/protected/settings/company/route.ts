import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Company } from '@/models';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    const company = await Company.findById(companyId).lean();
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Company not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: company });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'API_ERROR', message: error.message },
      { status: 500 }
    );
  }
});

export const PUT = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const body = await request.json();

    // Ensure only admins/managers can update this
    const roles = session.user.roles || [];
    const isManager = roles.some((r: string) =>
      ['admin', 'super-admin', 'manager'].includes(r.toLowerCase())
    );

    if (!isManager) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Insufficient privileges' },
        { status: 403 }
      );
    }

    const { name, slug, settings } = body;
    const updateData: any = {};
    if (name) updateData.name = name;
    if (slug) updateData.slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (settings) {
      updateData['settings.timezone'] = settings.timezone;
      updateData['settings.locale'] = settings.locale;
    }

    const updated = await Company.findByIdAndUpdate(
      companyId,
      { $set: updateData },
      { new: true }
    ).lean();

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'API_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
