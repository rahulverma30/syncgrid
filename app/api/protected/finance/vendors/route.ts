import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Vendor } from '@/models';
import { hasRole } from '@/lib/auth/permission-checks';
import { VendorProfileSchema } from '@/schemas/finance';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    const vendors = await Vendor.find({ companyId }).sort({ name: 1 }).lean();

    return NextResponse.json({ success: true, data: vendors });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'QUERY_ERROR', message: error.message },
      { status: 500 }
    );
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

    const body = await request.json();
    const parseResult = VendorProfileSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const validated = parseResult.data;

    let vendor;
    if (body._id) {
      vendor = await Vendor.findOneAndUpdate(
        { _id: body._id, companyId },
        { $set: validated },
        { new: true }
      );
    } else {
      vendor = new Vendor({
        companyId,
        ...validated,
        status: 'active',
      });
      await vendor.save();
    }

    return NextResponse.json({ success: true, data: vendor });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
