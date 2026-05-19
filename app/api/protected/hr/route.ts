import { NextResponse } from 'next/server';
import { withApiPermission } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Employee, EmployeeActivity } from '@/models';
import { EmployeeCreateSchema } from '@/schemas/hr';
import { hasPermission } from '@/lib/auth/permission-checks';

export const GET = withApiPermission(
  'hr',
  'read',
  async (request: Request, context: any, session: any) => {
    try {
      await connectToDatabase();
      const companyId = session.user.companyId;

      const url = new URL(request.url);
      const search = url.searchParams.get('search') || '';
      const departmentId = url.searchParams.get('departmentId') || '';
      const status = url.searchParams.get('status') || '';
      const skill = url.searchParams.get('skill') || '';
      const workMode = url.searchParams.get('workMode') || '';

      const query: Record<string, any> = {
        companyId,
        isSoftDeleted: false,
      };

      // Filter rules
      if (departmentId) query.departmentId = departmentId;
      if (status) query.status = status;
      if (workMode) query.workMode = workMode;

      if (skill) {
        query['skills.name'] = { $regex: new RegExp(skill, 'i') };
      }

      if (search) {
        query.$or = [
          { fullName: { $regex: new RegExp(search, 'i') } },
          { email: { $regex: new RegExp(search, 'i') } },
          { designation: { $regex: new RegExp(search, 'i') } },
          { employeeId: { $regex: new RegExp(search, 'i') } },
        ];
      }

      // Dynamic Permission: Only users with 'hr:manage' (HR Managers/Admins) can see raw compensation
      const hasHrAccess = hasPermission(session.user.permissions || [], 'hr', 'manage');

      const employees = await Employee.find(query)
        .select('-skills -certifications -emergencyContacts -assets -documents -payrollMetadata')
        .populate({ path: 'departmentId', select: 'name code managerId' })
        .populate({ path: 'teamId', select: 'name leaderId' })
        .populate({ path: 'userId', select: 'name email image' })
        .sort({ createdAt: -1 })
        .lean();

      // Mask compensation details for regular workers
      const processedEmployees = employees.map((emp) => {
        const obj = emp;
        if (!hasHrAccess) {
          // Strip sensitive compensation numbers
          obj.compensationMetadata = {
            salary: 0,
            currency: 'USD',
            payPeriod: 'monthly',
            masked: true,
          };
        }
        return obj;
      });

      return NextResponse.json({ success: true, data: processedEmployees });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: 'QUERY_ERROR', message: error.message },
        { status: 500 }
      );
    }
  }
);

export const POST = withApiPermission(
  'hr',
  'create',
  async (request: Request, context: any, session: any) => {
    try {
      await connectToDatabase();
      const companyId = session.user.companyId;
      const userId = session.user.id;
      const userName = session.user.name;

      const body = await request.json();
      const parseResult = EmployeeCreateSchema.safeParse(body);
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

      // Check duplicate active email
      const duplicate = await Employee.findOne({
        companyId,
        email: validated.email,
        isSoftDeleted: false,
      });
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: 'CONFLICT', message: 'Employee with this email already exists' },
          { status: 409 }
        );
      }

      const newEmployee = new Employee({
        companyId,
        ...validated,
        status: 'onboarding', // Default status on creation
      });

      await newEmployee.save();

      // Log Activity
      const activity = new EmployeeActivity({
        companyId,
        employeeId: newEmployee._id,
        userId,
        type: 'hired',
        title: 'Employee Hired',
        description: `${newEmployee.fullName} hired as ${newEmployee.designation || 'Staff'} by ${userName}.`,
        metadata: { designation: newEmployee.designation, employeeIdCode: newEmployee.employeeId },
      });
      await activity.save();

      const populated = await Employee.findById(newEmployee._id)
        .populate({ path: 'departmentId', select: 'name code' })
        .populate({ path: 'teamId', select: 'name' })
        .populate({ path: 'userId', select: 'name email image' });

      return NextResponse.json({ success: true, data: populated }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: 'ACTION_ERROR', message: error.message },
        { status: 500 }
      );
    }
  }
);
