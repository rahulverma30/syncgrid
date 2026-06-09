import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import mongoose from 'mongoose';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import {
  Transaction,
  Invoice,
  TaskTimeLog,
  Project,
  Budget,
  ExecutiveInsight,
  Employee,
  Lead,
  Deal,
  Client,
  Task,
  AttendanceLog,
} from '@/models';
import { hasRole } from '@/lib/auth/permission-checks';
import { analyticsCache } from '@/lib/cache/analyticsCache';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const roles = session.user.roles || [];

    const isAuthorized = hasRole(roles, [
      'super-admin',
      'admin',
      'finance',
      'project-manager',
      'hr',
    ]);

    const cacheQueryObj = { userId, isAuthorized };

    // 1. Enterprise Cache Retrieval Lookup
    const cachedDashboard = await analyticsCache.get<any>(companyId, 'dashboard', cacheQueryObj);
    if (cachedDashboard) {
      console.log(
        `[OBSERVABILITY] Cache HIT for dashboard cockpit parameters - Tenant: ${companyId}`
      );
      return NextResponse.json({
        success: true,
        data: cachedDashboard,
        cachedAt: new Date().toISOString(),
      });
    }

    console.log(
      `[OBSERVABILITY] Cache MISS for dashboard cockpit parameters. Aggregating MongoDB pipelines - Tenant: ${companyId}`
    );

    const now = new Date();
    const startOfCurrentYear = new Date(now.getFullYear(), 0, 1);
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfCurrentQuarter = new Date(
      now.getFullYear(),
      Math.floor(now.getMonth() / 3) * 3,
      1
    );
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 2. Financial Performance Aggregation (Revenue vs Expenses)
    const incomeAgg = await Transaction.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          type: 'income',
          status: 'cleared',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          thisMonth: {
            $sum: {
              $cond: [{ $gte: ['$paymentDate', startOfCurrentMonth] }, '$amount', 0],
            },
          },
          thisQuarter: {
            $sum: {
              $cond: [{ $gte: ['$paymentDate', startOfCurrentQuarter] }, '$amount', 0],
            },
          },
        },
      },
    ]);

    const expenseAgg = await Transaction.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          type: { $in: ['expense', 'refund'] },
          status: 'cleared',
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const revenueTotal = incomeAgg[0]?.total || 0;
    const revenueThisMonth = incomeAgg[0]?.thisMonth || 0;
    const revenueThisQuarter = incomeAgg[0]?.thisQuarter || 0;
    const expenseTotal = expenseAgg[0]?.total || 0;
    const netProfit = revenueTotal - expenseTotal;
    const profitMargin = revenueTotal > 0 ? (netProfit / revenueTotal) * 100 : 0;

    // 3. Overdue Invoices Receivables Calculation
    const overdueAgg = await Invoice.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          isSoftDeleted: false,
          status: { $in: ['sent', 'partially_paid', 'overdue'] },
        },
      },
      {
        $group: {
          _id: null,
          outstanding: { $sum: '$outstandingAmount' },
          overdue: {
            $sum: {
              $cond: [{ $lt: ['$dueDate', now] }, '$outstandingAmount', 0],
            },
          },
        },
      },
    ]);

    const totalOutstanding = overdueAgg[0]?.outstanding || 0;
    const totalOverdue = overdueAgg[0]?.overdue || 0;
    const overdueRatio = totalOutstanding > 0 ? (totalOverdue / totalOutstanding) * 100 : 0;

    // 4. Project Health & Sprint Completion Rates
    const projectsList = await Project.find({ companyId, isArchived: false })
      .select('status healthScore riskLevel')
      .lean();
    const totalProjects = projectsList.length;
    const completedProjects = projectsList.filter((p) => p.status === 'completed').length;
    const activeProjects = projectsList.filter((p) =>
      ['planning', 'design', 'development', 'testing', 'deployment'].includes(p.status)
    ).length;
    const atRiskProjects = projectsList.filter(
      (p) => ['medium', 'high', 'critical'].includes(p.riskLevel) || p.healthScore < 50
    ).length;

    const projectCompletionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

    // 5. Workforce & Resource Utilization Metrics (TaskTimeLog billable ratio)
    const utilizationAgg = await TaskTimeLog.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
      {
        $group: {
          _id: null,
          totalBillableMinutes: {
            $sum: {
              $cond: [{ $eq: ['$billable', true] }, '$durationMinutes', 0],
            },
          },
          totalMinutes: { $sum: '$durationMinutes' },
        },
      },
    ]);

    const billableMins = utilizationAgg[0]?.totalBillableMinutes || 0;
    const totalMins = utilizationAgg[0]?.totalMinutes || 0;
    const laborUtilization = totalMins > 0 ? (billableMins / totalMins) * 100 : 0;
    const hoursLoggedTotal = Math.round(totalMins / 60);

    // 6. Sales Overview: Leads & Deals & Clients
    const activeClientsCount = await Client.countDocuments({ companyId, isArchived: false });

    const leadsList = await Lead.find({ companyId }).select('status').lean();
    const totalLeads = leadsList.length;
    const convertedLeads = leadsList.filter(
      (l) => l.status === 'qualified' || l.status === 'converted'
    ).length;
    const leadConversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    const dealsList = await Deal.find({ companyId }).select('stage amount').lean();
    const totalDeals = dealsList.length;
    const wonDeals = dealsList.filter((d) => d.stage === 'closed-won').length;
    const lostDeals = dealsList.filter((d) => d.stage === 'closed-lost').length;
    const pipelineDeals = dealsList.filter((d) => !['closed-won', 'closed-lost'].includes(d.stage));
    const pipelineValue = pipelineDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
    const dealConversionRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;

    // 7. Tasks & Operations
    const tasksAgg = await Task.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          overdue: {
            $sum: {
              $cond: [
                { $and: [{ $lt: ['$dueDate', now] }, { $ne: ['$status', 'completed'] }] },
                1,
                0,
              ],
            },
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          blocked: {
            $sum: { $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0] },
          },
        },
      },
    ]);

    const totalTasks = tasksAgg[0]?.total || 0;
    const overdueTasks = tasksAgg[0]?.overdue || 0;
    const blockedTasks = tasksAgg[0]?.blocked || 0;
    const taskCompletionRate = totalTasks > 0 ? (tasksAgg[0]?.completed / totalTasks) * 100 : 0;

    // 8. HR / Workforce Present Today
    const activeEmployeesCount = await Employee.countDocuments({ companyId, isActive: true });

    const todaysAttendance = await AttendanceLog.find({
      companyId,
      date: startOfToday,
    }).lean();

    const presentToday = todaysAttendance.filter((a) =>
      ['present', 'late', 'half-day'].includes(a.status)
    ).length;
    const absentToday = activeEmployeesCount - presentToday;
    const onBreakEmployees = todaysAttendance.filter((a) => a.breakStart && !a.breakEnd).length;
    const lateEmployees = todaysAttendance.filter((a) => a.status === 'late').length;

    // 9. Recent 6-Month Cashflow aggregated timelines (Inflows vs Outflows)
    const cashflowTimelines = await Transaction.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          status: 'cleared',
          paymentDate: { $gte: startOfCurrentYear },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthlyCashflowMap: Record<string, { month: string; income: number; expense: number }> =
      {};
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    cashflowTimelines.forEach((item) => {
      const monthIdx = item._id.month - 1;
      const monthLabel = `${monthNames[monthIdx]} ${item._id.year}`;
      if (!monthlyCashflowMap[monthLabel]) {
        monthlyCashflowMap[monthLabel] = { month: monthLabel, income: 0, expense: 0 };
      }
      if (item._id.type === 'income') {
        monthlyCashflowMap[monthLabel].income += item.total;
      } else {
        monthlyCashflowMap[monthLabel].expense += item.total;
      }
    });

    const cashflowTrends = Object.values(monthlyCashflowMap);

    // 10. Dynamic Workload distribution metrics per department
    const employeeList = await Employee.find({ companyId })
      .select('departmentId name')
      .populate({
        path: 'departmentId',
        select: 'name',
      })
      .lean();

    // Detailed Workload Distribution (Assign Tasks -> Employees)
    const employeeWorkload: Record<string, { allocated: number; capacity: number; name: string }> =
      {};
    employeeList.forEach((emp: any) => {
      employeeWorkload[emp._id.toString()] = { allocated: 0, capacity: 40, name: emp.name }; // Baseline 40h
    });

    const activeTasksList = await Task.find({
      companyId,
      status: { $nin: ['completed', 'cancelled'] },
      assignees: { $exists: true, $not: { $size: 0 } },
    })
      .select('assignees estimatedHours')
      .lean();

    activeTasksList.forEach((t) => {
      if (t.estimatedHours && t.assignees) {
        const perPerson = t.estimatedHours / t.assignees.length;
        t.assignees.forEach((a: any) => {
          if (employeeWorkload[a.toString()]) {
            employeeWorkload[a.toString()].allocated += perPerson;
          }
        });
      }
    });

    const teamWorkloadDetailed = Object.values(employeeWorkload)
      .sort((a, b) => b.allocated - a.allocated)
      .slice(0, 10); // Top 10 loaded members

    const responseData = {
      kpis: {
        revenueTotal,
        revenueThisMonth,
        revenueThisQuarter,
        expenseTotal,
        netProfit,
        profitMargin,
        totalOutstanding,
        totalOverdue,
        overdueRatio,
        laborUtilization,
        hoursLoggedTotal,

        activeProjects,
        completedProjects,
        projectCompletionRate,
        atRiskProjects,

        activeClientsCount,

        totalLeads,
        convertedLeads,
        leadConversionRate,

        totalDeals,
        wonDeals,
        lostDeals,
        pipelineValue,
        dealConversionRate,

        totalTasks,
        overdueTasks,
        blockedTasks,
        taskCompletionRate,

        activeEmployeesCount,
        presentToday,
        absentToday,
        onBreakEmployees,
        lateEmployees,
      },
      insights: await ExecutiveInsight.find({ companyId }).sort({ detectedAt: -1 }).limit(3).lean(),
      cashflowTrends,
      teamWorkloadDetailed,
      role: isAuthorized ? 'admin' : 'employee',
    };

    // Store in caching layer for 5 minutes
    await analyticsCache.set(companyId, 'dashboard', cacheQueryObj, responseData, 300);

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
