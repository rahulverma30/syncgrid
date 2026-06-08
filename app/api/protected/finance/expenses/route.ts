import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Expense, Employee, Project, FinancialActivity, Budget, Transaction } from '@/models';
import { hasRole } from '@/lib/auth/permission-checks';
import { ExpenseSubmitSchema } from '@/schemas/finance';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const roles = session.user.roles || [];

    const url = new URL(request.url);
    const category = url.searchParams.get('category') || '';
    const reimbursementStatus = url.searchParams.get('reimbursementStatus') || '';

    // Standard employee can only see their own filed expenses
    const isSpecialist = hasRole(roles, ['super-admin', 'admin', 'finance']);
    const isProjectManager = hasRole(roles, ['project-manager']);

    const query: Record<string, any> = {
      companyId,
      isSoftDeleted: false,
    };

    if (category) {
      query.category = category;
    }
    if (reimbursementStatus) {
      query.reimbursementStatus = reimbursementStatus;
    }

    // Role Enforcement Filter
    if (!isSpecialist && !isProjectManager) {
      // Find corresponding employee profile first
      const employee = await Employee.findOne({ userId, companyId });
      if (employee) {
        query.employeeId = employee._id;
      } else {
        query.createdById = userId;
      }
    }

    const expenses = await Expense.find(query)
      .select('-approvalWorkflow.history -notes')
      .populate({ path: 'employeeId', select: 'firstName lastName email' })
      .populate({ path: 'projectId', select: 'name status' })
      .sort({ expenseDate: -1 })
      .lean();

    return NextResponse.json({ success: true, data: expenses });
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
    const userName = session.user.name || 'System User';
    const roles = session.user.roles || [];

    const body = await request.json();
    const parseResult = ExpenseSubmitSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const validated = parseResult.data;

    // Sequential index increment EXP-XXXX
    const count = await Expense.countDocuments({ companyId });
    const expenseNumber = `EXP-${(1000 + count + 1).toString()}`;

    // Find Employee ID if not direct admin corporate logging
    let employeeId = null;
    const isSpecialist = hasRole(roles, ['super-admin', 'admin', 'finance']);

    const employee = await Employee.findOne({ userId, companyId });
    if (employee) {
      employeeId = employee._id;
    }

    const isEmployeeClaim = !isSpecialist && employeeId;

    const expense = new Expense({
      companyId,
      expenseNumber,
      category: validated.category,
      merchant: validated.merchant,
      employeeId: isEmployeeClaim ? employeeId : body.employeeId || null,
      projectId: validated.projectId,
      amount: validated.amount,
      currency: validated.currency || 'USD',
      taxAmount: validated.taxAmount || 0,
      expenseDate: validated.expenseDate || new Date(),
      receiptUrl: validated.receiptUrl,
      receiptName: validated.receiptName,
      receiptSize: validated.receiptSize,
      reimbursementStatus: isEmployeeClaim ? 'pending' : 'none',
      approvalWorkflow: {
        currentStep: isEmployeeClaim ? 'manager' : 'done',
        status: isEmployeeClaim ? 'pending' : 'approved',
        approverId: isEmployeeClaim ? undefined : userId,
        comments: isEmployeeClaim
          ? undefined
          : 'Direct corporate logging by administrative specialist',
        history: [],
      },
      paymentStatus: isEmployeeClaim ? 'unpaid' : 'paid',
      paymentDate: isEmployeeClaim ? undefined : new Date(),
      notes: validated.notes,
      isRecurring: false,
      createdById: userId,
    });

    await expense.save();

    // Budget utilization tracking - if direct approved corporate project/department spend, increment spent amount!
    if (!isEmployeeClaim && validated.projectId) {
      const budget = await Budget.findOne({
        companyId,
        projectId: validated.projectId,
        status: 'active',
      });

      if (budget) {
        budget.spentAmount += validated.amount;
        budget.remainingAmount = Math.max(0, budget.amount - budget.spentAmount);

        // Check alerts thresholds
        const thresholdLimit = (budget.spentAmount / budget.amount) * 100;
        if (thresholdLimit >= budget.alertThreshold && !budget.alertFired) {
          budget.alertFired = true;
          // Log budget critical threshold activity
          const budgetAudit = new FinancialActivity({
            companyId,
            userId,
            userName,
            type: 'budget_threshold_crossed',
            title: 'Budget Alert Threshold Fired!',
            description: `Active budget "${budget.name}" spent ratio has crossed its allocated threshold boundary of ${budget.alertThreshold}% (Spent: ${budget.spentAmount}/${budget.amount}).`,
            metadata: { budgetId: budget._id, spentRatio: thresholdLimit },
            severity: 'critical',
          });
          await budgetAudit.save();
        }
        await budget.save();
      }
    }

    // Log Financial Activity
    const audit = new FinancialActivity({
      companyId,
      userId,
      userName,
      type: 'expense_approved',
      title: isEmployeeClaim ? 'Reimbursement Claim Filed' : 'Business Expense Logged',
      description: isEmployeeClaim
        ? `Employee filed claim ${expenseNumber} for ${validated.currency} ${validated.amount.toFixed(2)}.`
        : `Logged direct corporate expense ${expenseNumber} to merchant "${validated.merchant}" (Amount: ${validated.currency} ${validated.amount.toFixed(2)}).`,
      metadata: { expenseId: expense._id, amount: validated.amount, category: validated.category },
      severity: 'info',
    });
    await audit.save();

    return NextResponse.json({ success: true, data: expense }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});

// Approvals updates handler
export const PUT = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const userName = session.user.name || 'System User';
    const roles = session.user.roles || [];

    const isAuthorized = hasRole(roles, ['super-admin', 'admin', 'finance']);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Unauthorized finance permissions' },
        { status: 403 }
      );
    }

    const { id, status, comments } = await request.json();

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'BAD_REQUEST', message: 'Missing parameters' },
        { status: 400 }
      );
    }

    const expense = await Expense.findOne({ _id: id, companyId, isSoftDeleted: false });
    if (!expense) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Expense claim not found' },
        { status: 404 }
      );
    }

    expense.reimbursementStatus = status === 'approved' ? 'approved' : 'rejected';
    expense.approvalWorkflow = {
      currentStep: 'done',
      status: status === 'approved' ? 'approved' : 'rejected',
      approverId: userId,
      comments: comments || 'Claim resolved by finance manager',
      history: [
        ...expense.approvalWorkflow.history,
        {
          approverId: userId,
          action: status === 'approved' ? 'approved' : 'rejected',
          comments: comments || '',
          timestamp: new Date(),
        },
      ],
    };

    if (status === 'approved') {
      expense.paymentStatus = 'paid';
      expense.paymentDate = new Date();

      // Log a general ledger payout transaction
      const txnCount = await Transaction.countDocuments({ companyId });
      const transactionNumber = `TXN-${(10000 + txnCount + 1).toString()}`;

      const txn = new Transaction({
        companyId,
        transactionNumber,
        paymentMethod: 'bank_transfer',
        type: 'expense',
        currency: expense.currency,
        exchangeRate: 1.0,
        amount: expense.amount,
        status: 'cleared',
        paymentDate: new Date(),
        description: `Reimbursement pay for claim ${expense.expenseNumber}`,
        createdById: userId,
      });

      await txn.save();

      // Adjust budgets
      if (expense.projectId) {
        const budget = await Budget.findOne({
          companyId,
          projectId: expense.projectId,
          status: 'active',
        });
        if (budget) {
          budget.spentAmount += expense.amount;
          budget.remainingAmount = Math.max(0, budget.amount - budget.spentAmount);

          const thresholdLimit = (budget.spentAmount / budget.amount) * 100;
          if (thresholdLimit >= budget.alertThreshold && !budget.alertFired) {
            budget.alertFired = true;

            const budgetAudit = new FinancialActivity({
              companyId,
              userId,
              userName,
              type: 'budget_threshold_crossed',
              title: 'Budget Alert Threshold Fired!',
              description: `Active budget "${budget.name}" spent has crossed its allocated threshold of ${budget.alertThreshold}% (Spent: ${budget.spentAmount}/${budget.amount}).`,
              metadata: { budgetId: budget._id, spentRatio: thresholdLimit },
              severity: 'critical',
            });
            await budgetAudit.save();
          }
          await budget.save();
        }
      }
    }

    await expense.save();

    // Log Financial Activity
    const audit = new FinancialActivity({
      companyId,
      userId,
      userName,
      type: 'expense_approved',
      title: status === 'approved' ? 'Expense Reimbursement Cleared' : 'Expense Claim Rejected',
      description: `Finance manager resolved claim ${expense.expenseNumber} as ${status.toUpperCase()}.`,
      metadata: { expenseId: expense._id, status },
      severity: 'info',
    });
    await audit.save();

    return NextResponse.json({ success: true, data: expense });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
