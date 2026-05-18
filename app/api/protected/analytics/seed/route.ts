import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import {
  AnalyticsSnapshot,
  KPIConfiguration,
  SavedReport,
  DashboardLayout,
  FinancialActivity,
} from '@/models';
import { hasRole } from '@/lib/auth/permission-checks';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const userName = session.user.name;
    const roles = session.user.roles || [];

    const isAuthorized = hasRole(roles, ['super-admin', 'admin', 'finance']);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // 1. Wipe out existing collections for this company
    await AnalyticsSnapshot.deleteMany({ companyId });
    await KPIConfiguration.deleteMany({ companyId });
    await SavedReport.deleteMany({ companyId });
    await DashboardLayout.deleteMany({ companyId, userId });

    // 2. Seed 12 Months of consolidated daily historical Snapshots
    const snapshotsList: any[] = [];
    const now = Date.now();
    const day = 1000 * 60 * 60 * 24;

    let baseRevenue = 28000;
    let baseExpense = 21000;
    let baseHours = 380;
    let baseTasks = 45;

    for (let i = 12; i >= 0; i--) {
      const snapDate = new Date(now - i * 30 * day);

      const revTotal = baseRevenue + Math.floor(Math.random() * 8000);
      const expTotal = baseExpense + Math.floor(Math.random() * 4000);
      const profit = revTotal - expTotal;
      const margin = revTotal > 0 ? (profit / revTotal) * 100 : 0;

      snapshotsList.push({
        companyId,
        snapshotDate: snapDate,
        revenueTotal: revTotal,
        expenseTotal: expTotal,
        profitMargin: Number(margin.toFixed(2)),
        billableHours: baseHours + Math.floor(Math.random() * 120),
        nonBillableHours: 80 + Math.floor(Math.random() * 40),
        activeProjects: 4 + Math.floor(Math.random() * 3),
        completedSprints: 2 + Math.floor(Math.random() * 2),
        completedTasks: baseTasks + Math.floor(Math.random() * 25),
        cycleTimeAverage: 36 + Math.floor(Math.random() * 12),
        blockersCount: 2 + Math.floor(Math.random() * 5),
      });

      // Linear positive progression factor
      baseRevenue += 1200;
      baseExpense += 600;
      baseHours += 10;
      baseTasks += 2;
    }

    await AnalyticsSnapshot.insertMany(snapshotsList);

    // 3. Seed Default KPIs definitions and warning thresholds
    const defaultKpis = [
      {
        companyId,
        metricName: 'project_profitability',
        title: 'Project Profit Margin %',
        description: 'Net project revenues compared to direct project expenses.',
        targetValue: 35,
        currentValue: 29.5,
        unit: 'percent',
        warningThreshold: 80,
        criticalThreshold: 60,
        scoringWeight: 3,
        status: 'warning',
        alertFired: true,
      },
      {
        companyId,
        metricName: 'employee_utilization',
        title: 'Workforce Billable Utilization',
        description: 'Billable time ratios logged by consultants & developers.',
        targetValue: 80,
        currentValue: 74.5,
        unit: 'percent',
        warningThreshold: 90,
        criticalThreshold: 75,
        scoringWeight: 2,
        status: 'critical',
        alertFired: true,
      },
      {
        companyId,
        metricName: 'revenue_growth',
        title: 'Quarterly Revenue Growth Rate',
        description: 'Quarterly income progression speed ratios.',
        targetValue: 15,
        currentValue: 18.2, // exceeding targets!
        unit: 'percent',
        warningThreshold: 75,
        criticalThreshold: 50,
        scoringWeight: 2,
        status: 'on_track',
        alertFired: false,
      },
      {
        companyId,
        metricName: 'overdue_invoice_ratio',
        title: 'Overdue Receivables Ratio',
        description: 'Ratio of overdue payments to total outstanding billing.',
        targetValue: 10,
        currentValue: 14.5,
        unit: 'percent',
        warningThreshold: 80,
        criticalThreshold: 50,
        scoringWeight: 1,
        status: 'warning',
        alertFired: true,
      },
    ];

    await KPIConfiguration.insertMany(defaultKpis);

    // 4. Seed Fallback Saved Reports
    const defaultReports = [
      {
        companyId,
        name: 'Quarterly Revenue Performance Audit',
        type: 'financial',
        ownerId: userId,
        visibilityScope: 'organization',
        filters: { period: 'Q1-2026' },
        metrics: ['amount', 'count'],
        groupBy: 'month',
        aggregateType: 'sum',
        chartConfig: {
          chartType: 'bar',
          dimensions: ['amount'],
          legendPosition: 'bottom',
        },
      },
      {
        companyId,
        name: 'Workforce Utilization Audit Log',
        type: 'workforce',
        ownerId: userId,
        visibilityScope: 'organization',
        filters: { billable: true },
        metrics: ['totalHours', 'billableHours'],
        groupBy: 'employee',
        aggregateType: 'sum',
        chartConfig: {
          chartType: 'line',
          dimensions: ['totalHours'],
          legendPosition: 'bottom',
        },
      },
    ];

    await SavedReport.insertMany(defaultReports);

    // 5. Seed default user layout grids
    const defaultLayout = {
      companyId,
      userId,
      name: 'Executive Cockpit Default Layout',
      isDefault: true,
      widgets: [
        { widgetId: 'kpi_financials', x: 0, y: 0, w: 12, h: 3 },
        { widgetId: 'chart_cashflow', x: 0, y: 3, w: 8, h: 4 },
        { widgetId: 'chart_workload', x: 8, y: 3, w: 4, h: 4 },
        { widgetId: 'insight_cockpit', x: 0, y: 7, w: 12, h: 3 },
      ],
    };

    await DashboardLayout.create(defaultLayout);

    // 6. Log Financial Activity
    const seedAudit = new FinancialActivity({
      companyId,
      userId,
      userName,
      type: 'invoice_created',
      title: 'Reporting Cockpit Seeding Complete',
      description:
        'Analytics collections, dynamic snapshots timelines, layout positions, and custom metrics benchmarks seeded cleanly.',
      severity: 'info',
      metadata: { seededSnapshotsCount: snapshotsList.length },
    });
    await seedAudit.save();

    return NextResponse.json({
      success: true,
      message: 'Module 11 Analytics space seeded cleanly!',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'SEEDING_FAILED', message: error.message },
      { status: 500 }
    );
  }
});
