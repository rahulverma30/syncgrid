import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Department, Employee } from '@/models';
import { DepartmentCreateSchema } from '@/schemas/hr';
import { hasRole } from '@/lib/auth/permission-checks';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    // Fetch all active departments in company
    const departments = await Department.find({ companyId, isSoftDeleted: false })
      .populate({ path: 'managerId', select: 'name email image' })
      .sort({ name: 1 })
      .lean();

    // Fetch headcount per department
    const headcountAggregation = await Employee.aggregate([
      { $match: { companyId, isSoftDeleted: false, status: 'active' } },
      { $group: { _id: '$departmentId', count: { $sum: 1 } } },
    ]);

    const headcountMap: Record<string, number> = {};
    headcountAggregation.forEach((item) => {
      if (item._id) headcountMap[item._id.toString()] = item.count;
    });

    const deptList = departments.map((d: any) => ({
      ...d,
      headcount: headcountMap[d._id.toString()] || 0,
    }));

    // Helper to build recursive tree structure
    const buildTree = (parentId: string | null = null): any[] => {
      const nodes: any[] = [];
      deptList.forEach((dept) => {
        const parentStr = dept.parentDepartmentId ? dept.parentDepartmentId.toString() : null;
        if (parentStr === parentId) {
          const children = buildTree(dept._id.toString());
          nodes.push({
            ...dept,
            children,
          });
        }
      });
      return nodes;
    };

    const tree = buildTree(null);

    // Also return a flat list for dropdown menus
    return NextResponse.json({ success: true, data: { tree, list: deptList } });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const roles = session.user.roles || [];

    // RBAC: limit department creation to Admins/HR
    const hasHrAccess = hasRole(roles, ['super-admin', 'admin', 'hr-manager']);
    if (!hasHrAccess) {
      return NextResponse.json(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'Only Admins or HR Managers can create departments',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parseResult = DepartmentCreateSchema.safeParse(body);
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

    // Check duplicate code
    const duplicate = await Department.findOne({
      companyId,
      code: validated.code,
      isSoftDeleted: false,
    });
    if (duplicate) {
      return NextResponse.json(
        { success: false, error: 'CONFLICT', message: 'Department with this code already exists' },
        { status: 409 }
      );
    }

    const newDepartment = new Department({
      companyId,
      ...validated,
    });

    await newDepartment.save();

    const populated = await Department.findById(newDepartment._id).populate({
      path: 'managerId',
      select: 'name email image',
    });

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
