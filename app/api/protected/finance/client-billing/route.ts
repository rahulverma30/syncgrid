import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ClientBillingProfile, Client } from '@/models';
import { hasRole } from '@/lib/auth/permission-checks';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    const profiles = await ClientBillingProfile.find({ companyId })
      .populate({ path: 'clientId', select: 'name company' })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: profiles });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const roles = session.user.roles || [];

    const isAuthorized = hasRole(roles, ['super-admin', 'admin', 'finance']);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const payload = await request.json();

    if (!payload.clientId) {
      return NextResponse.json(
        { success: false, error: 'BAD_REQUEST', message: 'clientId is required' },
        { status: 400 }
      );
    }

    let profile = await ClientBillingProfile.findOne({ clientId: payload.clientId, companyId });

    if (profile) {
      Object.assign(profile, payload);
      await profile.save();
    } else {
      profile = new ClientBillingProfile({
        companyId,
        ...payload,
      });
      await profile.save();
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
