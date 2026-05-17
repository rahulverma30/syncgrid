import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Invoice, Transaction, Expense, Budget, Project, Client } from '@/models';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    const now = new Date();

    // 1. Calculate General KPI Metrics
    // Revenue = cleared income transactions
    const incomeTxns = await Transaction.find({
      companyId,
      type: 'income',
      status: 'cleared',
    });
    const totalRevenue = incomeTxns.reduce((acc, curr) => acc + curr.amount, 0);

    // Expense = cleared expense transactions + direct paid corporate expenses
    const expenseTxns = await Transaction.find({
      companyId,
      type: { $in: ['expense', 'refund'] },
      status: 'cleared',
    });
    const totalExpenses = expenseTxns.reduce((acc, curr) => acc + curr.amount, 0);

    // Outstanding Receivables
    const outstandingInvoices = await Invoice.find({
      companyId,
      isSoftDeleted: false,
      isArchived: false,
      status: { $in: ['sent', 'partially_paid', 'overdue'] },
    });
    const totalOutstanding = outstandingInvoices.reduce((acc, curr) => acc + curr.outstandingAmount, 0);

    // Overdue Receivables
    const overdueInvoices = outstandingInvoices.filter((inv) => new Date(inv.dueDate) < now);
    const totalOverdue = overdueInvoices.reduce((acc, curr) => acc + curr.outstandingAmount, 0);

    // Profit margin ratios
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // 2. Generate Cashflow Trend (Monthly aggregates for last 6 months)
    const monthlyCashflow: Record<string, { month: string; income: number; expense: number }> = {};

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlyCashflow[monthKey] = {
        month: monthKey,
        income: 0,
        expense: 0,
      };
    }

    // Add Income transaction totals
    incomeTxns.forEach((txn) => {
      const monthKey = new Date(txn.paymentDate).toLocaleString('default', { month: 'short', year: 'numeric' });
      if (monthlyCashflow[monthKey]) {
        monthlyCashflow[monthKey].income += txn.amount;
      }
    });

    // Add Expense transaction totals
    expenseTxns.forEach((txn) => {
      const monthKey = new Date(txn.paymentDate).toLocaleString('default', { month: 'short', year: 'numeric' });
      if (monthlyCashflow[monthKey]) {
        monthlyCashflow[monthKey].expense += txn.amount;
      }
    });

    const cashflowTrends = Object.values(monthlyCashflow);

    // 3. Category Expense Breakdown
    const activeExpenses = await Expense.find({
      companyId,
      isSoftDeleted: false,
      paymentStatus: 'paid',
    });

    const categoryTotals: Record<string, number> = {};
    activeExpenses.forEach((exp) => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    const expenseBreakdown = Object.entries(categoryTotals).map(([name, value]) => ({
      name: name.replace('_', ' ').toUpperCase(),
      value,
    }));

    // 4. Budgets utilization lists
    const activeBudgets = await Budget.find({
      companyId,
      status: 'active',
    }).populate({ path: 'projectId', select: 'name' });

    const budgetStatus = activeBudgets.map((b: any) => ({
      id: b._id,
      name: b.name,
      allocated: b.amount,
      spent: b.spentAmount,
      remaining: b.remainingAmount,
      percentage: b.amount > 0 ? (b.spentAmount / b.amount) * 100 : 0,
      alertFired: b.alertFired,
      projectName: b.projectId?.name || 'Operational Overhead',
    }));

    // 5. Project Margins Analyzer
    // Fetch all active projects
    const projectsList = await Project.find({ companyId });

    const projectMargins = await Promise.all(
      projectsList.map(async (p: any) => {
        // Project revenue = sum of paid amounts on invoices linked to this project
        const projectInvoices = await Invoice.find({
          companyId,
          projectId: p._id,
          isSoftDeleted: false,
        });
        const revenue = projectInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

        // Project expenses = sum of expenses allocated to this project
        const projectExpensesList = await Expense.find({
          companyId,
          projectId: p._id,
          isSoftDeleted: false,
          paymentStatus: 'paid',
        });
        const cost = projectExpensesList.reduce((sum, exp) => sum + exp.amount, 0);

        const margin = revenue - cost;
        const percent = revenue > 0 ? (margin / revenue) * 100 : 0;

        return {
          id: p._id,
          name: p.name,
          revenue,
          cost,
          margin,
          percent,
        };
      })
    );

    const dashboardSummary = {
      kpis: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        totalOutstanding,
        totalOverdue,
      },
      cashflowTrends,
      expenseBreakdown,
      budgetStatus,
      projectMargins: projectMargins.filter((pm) => pm.revenue > 0 || pm.cost > 0),
    };

    return NextResponse.json({ success: true, data: dashboardSummary });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'QUERY_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
