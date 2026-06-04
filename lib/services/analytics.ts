/**
 * SyncGrid Enterprise Analytics Service Layer
 * Fetches real aggregation metrics from the database API.
 */

export interface KPIValue {
  value: string;
  change: string;
  isPositive: boolean;
  comparisonLabel: string;
}

export interface AnalyticsData {
  kpis: any;
  charts: any;
  transactions: any[];
  activities: any[];
  notifications: any[];
}

export async function getAnalyticsData(
  range: string,
  startDate?: string,
  endDate?: string
): Promise<AnalyticsData> {
  try {
    const res = await fetch('/api/protected/analytics/dashboard');
    const { data } = await res.json();

    if (!data) throw new Error('No data returned');

    const formatCurrency = (val: number) =>
      `$${(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return {
      kpis: {
        // --- CEO / Finance ---
        revenueThisMonth: {
          value: formatCurrency(data.kpis.revenueThisMonth),
          change: 'This month',
          isPositive: true,
          comparisonLabel: 'collected',
        },
        revenueThisQuarter: {
          value: formatCurrency(data.kpis.revenueThisQuarter),
          change: 'This quarter',
          isPositive: true,
          comparisonLabel: 'collected',
        },
        pendingInvoices: {
          value: formatCurrency(data.kpis.totalOutstanding),
          change: formatCurrency(data.kpis.totalOverdue),
          isPositive: false,
          comparisonLabel: 'amount overdue',
        },
        activeClients: {
          value: `${data.kpis.activeClientsCount || 0}`,
          change: 'active',
          isPositive: true,
          comparisonLabel: 'total clients',
        },
        profitability: {
          value: `${data.kpis.profitMargin?.toFixed(1) || 0}%`,
          change: formatCurrency(data.kpis.netProfit),
          isPositive: data.kpis.netProfit >= 0,
          comparisonLabel: 'net profit',
        },

        // --- Sales & Pipeline ---
        totalLeads: {
          value: `${data.kpis.totalLeads || 0}`,
          change: `${data.kpis.leadConversionRate?.toFixed(1) || 0}%`,
          isPositive: true,
          comparisonLabel: 'conversion rate',
        },
        pipelineValue: {
          value: formatCurrency(data.kpis.pipelineValue),
          change: `${data.kpis.totalDeals} deals`,
          isPositive: true,
          comparisonLabel: 'in pipeline',
        },
        wonDeals: {
          value: `${data.kpis.wonDeals || 0}`,
          change: `${data.kpis.dealConversionRate?.toFixed(1) || 0}%`,
          isPositive: true,
          comparisonLabel: 'win rate',
        },

        // --- Delivery & Operations ---
        activeProjects: {
          value: `${data.kpis.activeProjects || 0}`,
          change: `${data.kpis.projectCompletionRate?.toFixed(1) || 0}%`,
          isPositive: true,
          comparisonLabel: 'completion rate',
        },
        projectsAtRisk: {
          value: `${data.kpis.atRiskProjects || 0}`,
          change: 'needs attention',
          isPositive: false,
          comparisonLabel: 'at risk',
        },
        overdueTasks: {
          value: `${data.kpis.overdueTasks || 0}`,
          change: `${data.kpis.blockedTasks || 0} blocked`,
          isPositive: false,
          comparisonLabel: 'overdue',
        },
        teamProductivity: {
          value: `${data.kpis.laborUtilization?.toFixed(1) || 0}%`,
          change: `${data.kpis.hoursLoggedTotal || 0}h`,
          isPositive: true,
          comparisonLabel: 'logged',
        },

        // --- Workforce (HR) ---
        activeEmployees: {
          value: `${data.kpis.activeEmployeesCount || 0}`,
          change: 'Total',
          isPositive: true,
          comparisonLabel: 'employees',
        },
        presentToday: {
          value: `${data.kpis.presentToday || 0}`,
          change: `${data.kpis.lateEmployees || 0} late`,
          isPositive: true,
          comparisonLabel: 'present',
        },
        absentToday: {
          value: `${data.kpis.absentToday || 0}`,
          change: 'absent',
          isPositive: false,
          comparisonLabel: 'away',
        },
        onBreak: {
          value: `${data.kpis.onBreakEmployees || 0}`,
          change: 'on break',
          isPositive: true,
          comparisonLabel: 'currently',
        },
      },
      charts: {
        revenueArea: (data.cashflowTrends || []).map((t: any) => ({
          name: t.month,
          amount: t.income,
          target: t.income * 1.2,
        })),
        expensesBar: (data.cashflowTrends || []).map((t: any) => ({
          name: t.month,
          revenue: t.income,
          expenses: t.expense,
          profit: t.income - t.expense,
        })),
        teamWorkload: (data.teamWorkloadDetailed || []).map((w: any) => ({
          name: w.name,
          allocated: parseFloat(w.allocated.toFixed(1)),
          capacity: w.capacity,
        })),
      },
      transactions: [],
      activities: (data.insights || []).map((i: any) => ({
        id: i._id,
        user: { name: 'System Insight', initials: 'SYS' },
        action: i.title,
        target: i.category,
        time: 'recent',
        type: 'project',
      })),
      notifications: [],
    };
  } catch (err) {
    console.error('Failed to fetch analytics', err);
    return {
      kpis: {},
      charts: {
        revenueArea: [],
        expensesBar: [],
        teamWorkload: [],
      },
      transactions: [],
      activities: [],
      notifications: [],
    };
  }
}
