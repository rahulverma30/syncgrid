import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Holiday, Department } from '@/models';
import { hasRole } from '@/lib/auth/permission-checks';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    let list = await Holiday.find({ companyId })
      .populate({ path: 'departmentId', select: 'name code' })
      .sort({ date: 1 })
      .lean();

    // Auto-seed default holidays if empty
    if (list.length === 0) {
      const year = new Date().getFullYear();
      const defaultHolidays = [
        {
          companyId,
          name: "New Year's Day",
          date: new Date(`${year}-01-01T00:00:00.000Z`),
          description: 'Beginning of the fiscal and calendar year.',
          scope: 'company-wide',
          type: 'public',
          isRecurring: true,
        },
        {
          companyId,
          name: 'Memorial Day',
          date: new Date(`${year}-05-25T00:00:00.000Z`),
          description: 'Honoring corporate heroes and national service.',
          scope: 'company-wide',
          type: 'public',
          isRecurring: true,
        },
        {
          companyId,
          name: 'Independence Day',
          date: new Date(`${year}-07-04T00:00:00.000Z`),
          description: 'National Independence Day holiday.',
          scope: 'company-wide',
          type: 'public',
          isRecurring: true,
        },
        {
          companyId,
          name: 'Labor Day',
          date: new Date(`${year}-09-07T00:00:00.000Z`),
          description: 'Celebrating workforce achievements and operations.',
          scope: 'company-wide',
          type: 'public',
          isRecurring: true,
        },
        {
          companyId,
          name: 'Thanksgiving Day',
          date: new Date(`${year}-11-26T00:00:00.000Z`),
          description: 'Corporate day of appreciation and rest.',
          scope: 'company-wide',
          type: 'public',
          isRecurring: true,
        },
        {
          companyId,
          name: 'Christmas Day',
          date: new Date(`${year}-12-25T00:00:00.000Z`),
          description: 'Winter holidays seasonal break.',
          scope: 'company-wide',
          type: 'public',
          isRecurring: true,
        },
      ];

      await Holiday.insertMany(defaultHolidays);
      list = await Holiday.find({ companyId })
        .populate({ path: 'departmentId', select: 'name code' })
        .sort({ date: 1 })
        .lean();
    }

    return NextResponse.json({ success: true, data: list });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const roles = session.user.roles || [];

    // RBAC: Only admin or HR manager can configure holidays
    const isAuthorized = hasRole(roles, ['super-admin', 'admin', 'hr-manager']);
    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'Only managers or admins can add holidays.',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, date, description, scope, region, departmentId, type, isRecurring } = body;

    if (!name || !date) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: 'Name and Date are required.' },
        { status: 400 }
      );
    }

    const newHoliday = new Holiday({
      companyId,
      name,
      date: new Date(date),
      description: description || '',
      scope: scope || 'company-wide',
      region: region || '',
      departmentId: departmentId || null,
      type: type || 'public',
      isRecurring: !!isRecurring,
    });

    await newHoliday.save();
    return NextResponse.json({ success: true, data: newHoliday }, { status: 201 });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
