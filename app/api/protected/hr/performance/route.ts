import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { EmployeePerformanceReview, Employee, EmployeeActivity } from '@/models';
import { EmployeePerformanceReviewCreateSchema } from '@/schemas/hr';
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

    const url = new URL(request.url);
    const targetEmployeeId = url.searchParams.get('employeeId') || '';

    const hasManagerAccess = hasRole(roles, [
      'super-admin',
      'admin',
      'hr-manager',
      'department-manager',
    ]);

    const query: Record<string, any> = { companyId };

    if (targetEmployeeId) {
      // If specifying someone else, check access
      if (targetEmployeeId !== employee._id.toString() && !hasManagerAccess) {
        return NextResponse.json(
          { success: false, error: 'FORBIDDEN', message: 'You cannot view other staff reviews' },
          { status: 403 }
        );
      }
      query.employeeId = targetEmployeeId;
    } else if (!hasManagerAccess) {
      // Standard employee sees only their reviews
      query.employeeId = employee._id;
    }

    const reviews = await EmployeePerformanceReview.find(query)
      .populate({ path: 'employeeId', select: 'fullName designation' })
      .populate({ path: 'reviewerId', select: 'name email' })
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: reviews });
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
    const roles = session.user.roles || [];

    // RBAC: Only managers and HR can evaluate staff
    const hasManagerAccess = hasRole(roles, [
      'super-admin',
      'admin',
      'hr-manager',
      'department-manager',
    ]);
    if (!hasManagerAccess) {
      return NextResponse.json(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'Only managers or HR can log performance scores',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parseResult = EmployeePerformanceReviewCreateSchema.safeParse(body);
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

    const targetEmployee = await Employee.findOne({
      _id: validated.employeeId,
      companyId,
      isSoftDeleted: false,
    });
    if (!targetEmployee) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Target Employee not found' },
        { status: 404 }
      );
    }

    const review = new EmployeePerformanceReview({
      companyId,
      reviewerId: userId,
      ...validated,
    });

    await review.save();

    // Reconcile and update aggregations on Employee model
    targetEmployee.performanceMetadata.lastReviewScore = validated.score;
    targetEmployee.performanceMetadata.activeGoalsCount = (validated.goals || []).filter(
      (g: any) => g.status === 'in_progress' || g.status === 'pending'
    ).length;

    await targetEmployee.save();

    // Log Activity
    const activity = new EmployeeActivity({
      companyId,
      employeeId: targetEmployee._id,
      userId,
      type: 'performance_submitted',
      title: 'Performance Score Submitted',
      description: `Performance evaluation for ${targetEmployee.fullName} submitted by ${userName} (Score: ${validated.score}/5).`,
      metadata: { reviewId: review._id, score: validated.score },
    });
    await activity.save();

    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
