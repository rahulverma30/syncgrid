import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { EmployeeAnnouncement, Employee } from '@/models';
import { EmployeeAnnouncementCreateSchema } from '@/schemas/hr';
import { hasRole } from '@/lib/auth/permission-checks';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;

    // Get current employee department
    const employee = await Employee.findOne({ companyId, userId, isSoftDeleted: false })
      .select('departmentId')
      .lean();

    // Retrieve announcements: either targeted to user's department, or null (company-wide)
    const query: Record<string, any> = {
      companyId,
      $or: [{ departmentId: null }],
    };

    if (employee?.departmentId) {
      query.$or.push({ departmentId: employee.departmentId });
    }

    const announcements = await EmployeeAnnouncement.find(query)
      .populate({ path: 'postedBy', select: 'name email' })
      .populate({ path: 'departmentId', select: 'name code' })
      .sort({ isPinned: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: announcements });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const roles = session.user.roles || [];

    // RBAC: Only Admins or HR Managers can broadcast memos
    const hasHrAccess = hasRole(roles, ['super-admin', 'admin', 'hr-manager']);
    if (!hasHrAccess) {
      return NextResponse.json(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'Only Admins or HR Managers can post announcements',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parseResult = EmployeeAnnouncementCreateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: parseResult.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const validated = parseResult.data;

    const announcement = new EmployeeAnnouncement({
      companyId,
      postedBy: userId,
      ...validated,
    });

    await announcement.save();

    const populated = await EmployeeAnnouncement.findById(announcement._id)
      .populate({ path: 'postedBy', select: 'name email' })
      .populate({ path: 'departmentId', select: 'name code' });

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
