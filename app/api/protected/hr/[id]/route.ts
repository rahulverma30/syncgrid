import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Employee, EmployeeActivity, User } from '@/models';
import { EmployeeUpdateSchema } from '@/schemas/hr';
import { hasRole } from '@/lib/auth/permission-checks';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const roles = session.user.roles || [];
    const params = await context.params;
    const { id } = params;

    const employee = await Employee.findOne({ _id: id, companyId, isSoftDeleted: false })
      .populate({ path: 'departmentId', select: 'name code managerId' })
      .populate({ path: 'teamId', select: 'name leaderId' })
      .populate({ path: 'userId', select: 'name email image' });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Employee profile not found' },
        { status: 404 }
      );
    }

    // RBAC: HR/Admins or the employee themselves can see full compensation details
    const isSelf = employee.userId && employee.userId._id.toString() === userId;
    const hasHrAccess = hasRole(roles, ['super-admin', 'admin', 'hr-manager']);

    const obj = employee.toObject();
    if (!hasHrAccess && !isSelf) {
      // Mask salary details
      obj.compensationMetadata = {
        salary: 0,
        currency: 'USD',
        payPeriod: 'monthly',
        masked: true,
      };
    }

    return NextResponse.json({ success: true, data: obj });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'QUERY_ERROR', message: error.message },
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
    const params = await context.params;
    const { id } = params;

    const employee = await Employee.findOne({ _id: id, companyId, isSoftDeleted: false });
    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Employee profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parseResult = EmployeeUpdateSchema.safeParse(body);
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

    // RBAC Permission Guard check
    const isSelf = employee.userId && employee.userId.toString() === userId;
    const hasHrAccess = hasRole(roles, ['super-admin', 'admin', 'hr-manager']);

    if (!hasHrAccess && !isSelf) {
      return NextResponse.json(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'You do not have permission to update this profile',
        },
        { status: 403 }
      );
    }

    // Field-level edit restrictions: Standard employees can only edit phone, emergencyContacts, skills, and certifications.
    if (!hasHrAccess) {
      const restrictedFields = [
        'fullName',
        'email',
        'designation',
        'departmentId',
        'teamId',
        'managerId',
        'employmentType',
        'joiningDate',
        'exitDate',
        'workMode',
        'status',
        'compensationMetadata',
        'assets',
        'documents',
      ];

      for (const field of restrictedFields) {
        if (body[field] !== undefined) {
          return NextResponse.json(
            {
              success: false,
              error: 'FORBIDDEN',
              message: `Standard employees are locked from editing field: "${field}"`,
            },
            { status: 403 }
          );
        }
      }
    }

    // Apply valid updates
    Object.assign(employee, validated);
    await employee.save();

    // Synchronize User status when employee status is updated
    if (validated.status && employee.userId) {
      const userStatus =
        validated.status === 'suspended' || validated.status === 'terminated'
          ? 'disabled'
          : 'active';
      await User.updateOne({ _id: employee.userId }, { $set: { status: userStatus } });
    }

    // Log Activity
    const activity = new EmployeeActivity({
      companyId,
      employeeId: employee._id,
      userId,
      type: 'promoted',
      title: 'Profile Updated',
      description: `Employee profile of ${employee.fullName} was updated by ${userName}.`,
      metadata: { updatedBy: userName },
    });
    await activity.save();

    const populated = await Employee.findById(employee._id)
      .populate({ path: 'departmentId', select: 'name code' })
      .populate({ path: 'teamId', select: 'name' })
      .populate({ path: 'userId', select: 'name email image' });

    return NextResponse.json({ success: true, data: populated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});

export const DELETE = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const userName = session.user.name;
    const roles = session.user.roles || [];
    const params = await context.params;
    const { id } = params;

    // RBAC: Only Admins/HR can terminate/soft-delete employees
    const hasHrAccess = hasRole(roles, ['super-admin', 'admin', 'hr-manager']);
    if (!hasHrAccess) {
      return NextResponse.json(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'Only HR Managers or Admins can offboard/delete employees',
        },
        { status: 403 }
      );
    }

    const employee = await Employee.findOne({ _id: id, companyId, isSoftDeleted: false });
    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Employee profile not found' },
        { status: 404 }
      );
    }

    // Soft delete employee profile and update status
    employee.isSoftDeleted = true;
    employee.status = 'terminated';
    employee.exitDate = new Date();
    await employee.save();

    // Deactivate User account on termination
    if (employee.userId) {
      await User.updateOne({ _id: employee.userId }, { $set: { status: 'disabled' } });
    }

    // Log Activity
    const activity = new EmployeeActivity({
      companyId,
      employeeId: employee._id,
      userId,
      type: 'transferred',
      title: 'Employee Terminated / Offboarded',
      description: `${employee.fullName} was offboarded and soft-deleted by ${userName}.`,
      metadata: { exitDate: employee.exitDate },
    });
    await activity.save();

    return NextResponse.json({ success: true, message: 'Employee offboarded successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
