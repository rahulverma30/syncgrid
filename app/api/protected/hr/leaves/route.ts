import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { LeaveRequest, Employee, EmployeeActivity } from '@/models';
import { LeaveRequestCreateSchema, LeaveApprovalSchema } from '@/schemas/hr';
import { hasRole } from '@/lib/auth/permission-checks';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const roles = session.user.roles || [];

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

    const hasApproverAccess = hasRole(roles, [
      'super-admin',
      'admin',
      'hr-manager',
      'department-manager',
    ]);

    // Standard workers see only their own requests
    const query: Record<string, any> = { companyId };
    if (!hasApproverAccess) {
      query.employeeId = employee._id;
    }

    const requests = await LeaveRequest.find(query)
      .populate({ path: 'employeeId', select: 'fullName designation email leaveBalances' })
      .populate({ path: 'approvedBy', select: 'name email' })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        requests,
        balances: employee.leaveBalances,
      },
    });
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
    const userId = session.user.id;
    const userName = session.user.name;

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
    const parseResult = LeaveRequestCreateSchema.safeParse(body);
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
    const start = new Date(validated.startDate);
    const end = new Date(validated.endDate);

    if (end < start) {
      return NextResponse.json(
        { success: false, error: 'BAD_REQUEST', message: 'End date cannot be prior to start date' },
        { status: 400 }
      );
    }

    // Timezone-safe inclusive day difference calculation
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check Balance limits
    const balanceKey =
      validated.leaveType === 'casual'
        ? 'casualDays'
        : validated.leaveType === 'sick'
          ? 'sickDays'
          : validated.leaveType === 'paid'
            ? 'paidDays'
            : null;

    if (balanceKey) {
      const balance = employee.leaveBalances[balanceKey] || 0;
      if (totalDays > balance) {
        return NextResponse.json(
          {
            success: false,
            error: 'LIMIT_EXCEEDED',
            message: `You requested ${totalDays} days of ${validated.leaveType} leave, but only have ${balance} days remaining.`,
          },
          { status: 400 }
        );
      }
    }

    // Check Calendar Overlap conflicts
    const overlap = await LeaveRequest.findOne({
      companyId,
      employeeId: employee._id,
      status: { $in: ['pending', 'approved'] },
      $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }],
    });

    if (overlap) {
      return NextResponse.json(
        {
          success: false,
          error: 'CONFLICT',
          message: `Booking conflict: You already have a leave request registered between ${new Date(overlap.startDate).toLocaleDateString()} and ${new Date(overlap.endDate).toLocaleDateString()}.`,
        },
        { status: 409 }
      );
    }

    const newRequest = new LeaveRequest({
      companyId,
      employeeId: employee._id,
      leaveType: validated.leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason: validated.reason || '',
      status: 'pending',
    });

    await newRequest.save();

    // Log Activity
    const activity = new EmployeeActivity({
      companyId,
      employeeId: employee._id,
      userId,
      type: 'leave_requested',
      title: 'Time-off Requested',
      description: `${userName} submitted a request for ${totalDays} days of ${validated.leaveType} leave.`,
      metadata: { leaveType: validated.leaveType, totalDays, startDate: start, endDate: end },
    });
    await activity.save();

    return NextResponse.json({ success: true, data: newRequest }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});

export const PUT = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const userName = session.user.name;
    const roles = session.user.roles || [];

    // RBAC check: Only Admins or managers can approve leave requests
    const hasApproverAccess = hasRole(roles, [
      'super-admin',
      'admin',
      'hr-manager',
      'department-manager',
    ]);
    if (!hasApproverAccess) {
      return NextResponse.json(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'Only managers or HR can approve time off requests',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parseResult = LeaveApprovalSchema.safeParse(body);
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

    const { status, managerNotes } = parseResult.data;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'BAD_REQUEST', message: 'Leave Request ID param is required' },
        { status: 400 }
      );
    }

    const leaveRequest = await LeaveRequest.findOne({ _id: id, companyId });
    if (!leaveRequest) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Leave Request not found' },
        { status: 404 }
      );
    }

    if (leaveRequest.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: 'BAD_REQUEST',
          message: 'This leave request has already been processed',
        },
        { status: 400 }
      );
    }

    leaveRequest.status = status;
    leaveRequest.approvedBy = userId;
    leaveRequest.approvedAt = new Date();
    leaveRequest.managerNotes = managerNotes;

    await leaveRequest.save();

    const employee = await Employee.findById(leaveRequest.employeeId);
    if (employee) {
      if (status === 'approved') {
        const balanceKey =
          leaveRequest.leaveType === 'casual'
            ? 'casualDays'
            : leaveRequest.leaveType === 'sick'
              ? 'sickDays'
              : leaveRequest.leaveType === 'paid'
                ? 'paidDays'
                : null;

        if (balanceKey) {
          employee.leaveBalances[balanceKey] = Math.max(
            0,
            employee.leaveBalances[balanceKey] - leaveRequest.totalDays
          );
          await employee.save();
        }

        // Log Approval Activity
        const activity = new EmployeeActivity({
          companyId,
          employeeId: employee._id,
          userId,
          type: 'leave_approved',
          title: 'Time-off Approved',
          description: `${employee.fullName}'s time-off request was approved by manager ${userName}.`,
          metadata: { leaveRequestId: leaveRequest._id, totalDays: leaveRequest.totalDays },
        });
        await activity.save();
      } else {
        // Log Rejection Activity
        const activity = new EmployeeActivity({
          companyId,
          employeeId: employee._id,
          userId,
          type: 'leave_rejected',
          title: 'Time-off Rejected',
          description: `${employee.fullName}'s time-off request was rejected by manager ${userName}.`,
          metadata: { leaveRequestId: leaveRequest._id },
        });
        await activity.save();
      }
    }

    return NextResponse.json({ success: true, data: leaveRequest });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
