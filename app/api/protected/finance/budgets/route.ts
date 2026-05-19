import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Budget, Project, Department } from '@/models';
import { hasRole } from '@/lib/auth/permission-checks';
import { BudgetUpdateSchema } from '@/schemas/finance';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    const budgets = await Budget.find({ companyId })
      .populate({ path: 'projectId', select: 'name status' })
      .populate({ path: 'departmentId', select: 'name' })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: budgets });
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
    const parseResult = BudgetUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const validated = parseResult.data;

    const budget = new Budget({
      companyId,
      name: validated.name,
      type: validated.type,
      projectId: validated.projectId || null,
      departmentId: validated.departmentId || null,
      amount: validated.amount,
      currency: validated.currency || 'USD',
      spentAmount: 0,
      remainingAmount: validated.amount,
      startDate: validated.startDate,
      endDate: validated.endDate,
      alertThreshold: validated.alertThreshold || 80,
      alertFired: false,
      status: 'active',
      notes: validated.notes,
    });

    await budget.save();

    return NextResponse.json({ success: true, data: budget }, { status: 201 });
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
    const roles = session.user.roles || [];

    const isAuthorized = hasRole(roles, ['super-admin', 'admin', 'finance']);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { _id, ...updatePayload } = body;

    const parseResult = BudgetUpdateSchema.safeParse(updatePayload);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const validated = parseResult.data;

    const budget = await Budget.findOne({ _id, companyId });
    if (!budget) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Budget settings not found' },
        { status: 404 }
      );
    }

    budget.name = validated.name;
    budget.type = validated.type;
    budget.projectId = validated.projectId || null;
    budget.departmentId = validated.departmentId || null;
    budget.amount = validated.amount;
    budget.remainingAmount = Math.max(0, validated.amount - budget.spentAmount);
    budget.startDate = validated.startDate;
    budget.endDate = validated.endDate;
    budget.alertThreshold = validated.alertThreshold;
    budget.notes = validated.notes;

    // Reset alarm flag if remaining headroom is positive again
    if ((budget.spentAmount / budget.amount) * 100 < budget.alertThreshold) {
      budget.alertFired = false;
    }

    await budget.save();

    return NextResponse.json({ success: true, data: budget });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
