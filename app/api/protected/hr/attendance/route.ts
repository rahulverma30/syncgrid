import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AttendanceLog, Employee, EmployeeActivity } from '@/models';
import { AttendanceCheckSchema } from '@/schemas/hr';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;

    // Find Employee associated with this user
    const employee = await Employee.findOne({ companyId, userId, isSoftDeleted: false })
      .select('_id')
      .lean();
    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: 'NOT_FOUND',
          message: 'Employee profile not registered for this user',
        },
        { status: 404 }
      );
    }

    const url = new URL(request.url);
    const targetEmployeeId = url.searchParams.get('employeeId') || employee._id.toString();

    // Check if looking at someone else
    const isSelf = targetEmployeeId === employee._id.toString();
    const roles = session.user.roles || [];
    const hasElevatedAccess = roles.some((r: string) =>
      ['super-admin', 'admin', 'hr-manager', 'department-manager'].includes(r.toLowerCase())
    );

    if (!isSelf && !hasElevatedAccess) {
      return NextResponse.json(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'You cannot view other staff attendance records',
        },
        { status: 403 }
      );
    }

    // Define "Today" boundaries (UTC-safe start and end of day)
    const now = new Date();
    const startOfDay = new Date(now.setUTCHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setUTCHours(23, 59, 59, 999));

    // Get today's punch record
    const todayPunch = await AttendanceLog.findOne({
      companyId,
      employeeId: targetEmployeeId,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).lean();

    // Get past 7 days logs
    const weekAgo = new Date();
    weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);
    const pastLogs = await AttendanceLog.find({
      companyId,
      employeeId: targetEmployeeId,
      date: { $gte: weekAgo },
    })
      .sort({ date: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        todayPunch,
        history: pastLogs,
        isSelf,
      },
    });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const userName = session.user.name;

    // Find Employee associated with this user
    const employee = await Employee.findOne({ companyId, userId, isSoftDeleted: false });
    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: 'NOT_FOUND',
          message: 'Employee profile not registered for this user',
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parseResult = AttendanceCheckSchema.safeParse(body);
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

    // Today range
    const now = new Date();
    const startOfDay = new Date(now.setUTCHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setUTCHours(23, 59, 59, 999));

    // Check if punch exists already for today
    let punch = await AttendanceLog.findOne({
      companyId,
      employeeId: employee._id,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (!punch) {
      // 1. Clock-in Action!
      const currentHour = new Date().getUTCHours();
      let status: 'present' | 'late' = 'present';
      if (currentHour >= 9) {
        status = 'late'; // Late clock-in (after 9:00 AM UTC/local reference)
      }

      punch = new AttendanceLog({
        companyId,
        employeeId: employee._id,
        date: new Date(),
        checkIn: new Date(),
        workMode: validated.workMode,
        location: validated.location || 'Remote Coordinates',
        notes: validated.notes || '',
        status,
      });

      await punch.save();

      // Increment employee attendance totals
      employee.attendanceSummary.presentCount += 1;
      if (status === 'late') {
        employee.attendanceSummary.lateCount += 1;
      }
      await employee.save();

      // Log Activity
      const activity = new EmployeeActivity({
        companyId,
        employeeId: employee._id,
        userId,
        type: 'checked_in',
        title: 'Checked In',
        description: `${userName} checked in at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${validated.workMode}).`,
        metadata: { workMode: validated.workMode, checkInTime: punch.checkIn },
      });
      await activity.save();

      return NextResponse.json({ success: true, action: 'clocked_in', data: punch });
    } else {
      // 2. Clock-out Action!
      if (punch.checkOut) {
        return NextResponse.json(
          {
            success: false,
            error: 'BAD_REQUEST',
            message: 'You have already checked out for today!',
          },
          { status: 400 }
        );
      }

      punch.checkOut = new Date();

      // Compute total minutes clocked
      const diffMs = punch.checkOut.getTime() - punch.checkIn.getTime();
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      const hoursDecimal = Number((diffMinutes / 60).toFixed(2));

      // Overtime threshold (8 hours = 480 minutes)
      if (diffMinutes > 480) {
        punch.overtimeMinutes = diffMinutes - 480;
      }

      await punch.save();

      // Increment total tracked hours on Employee
      employee.attendanceSummary.hoursTracked += hoursDecimal;
      await employee.save();

      // Log Activity
      const activity = new EmployeeActivity({
        companyId,
        employeeId: employee._id,
        userId,
        type: 'checked_out',
        title: 'Checked Out',
        description: `${userName} checked out at ${punch.checkOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Total shift: ${hoursDecimal}h.`,
        metadata: { checkOutTime: punch.checkOut, hoursTracked: hoursDecimal },
      });
      await activity.save();

      return NextResponse.json({ success: true, action: 'clocked_out', data: punch });
    }
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
