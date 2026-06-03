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
  kpis: {
    revenue: KPIValue;
    activeProjects: KPIValue;
    completedProjects: KPIValue;
    totalLeads: KPIValue;
    convertedLeads: KPIValue;
    pendingInvoices: KPIValue;
    teamProductivity: KPIValue;
    monthlyGrowth: KPIValue;
    clientRetention: KPIValue;
    profitability: KPIValue;
  };
  charts: {
    revenueArea: { name: string; amount: number; target: number }[];
    leadConversionBar: { name: string; leads: number; conversions: number }[];
    projectGrowthLine: { name: string; active: number; completed: number }[];
    teamProductivityRadar: { subject: string; A: number; B: number; fullMark: number }[];
    expensesBar: { name: string; revenue: number; expenses: number; profit: number }[];
    projectStatusPie: { name: string; value: number; color: string }[];
    teamWorkload: { name: string; allocated: number; capacity: number }[];
  };
  transactions: {
    id: string;
    client: string;
    amount: string;
    status: 'paid' | 'pending' | 'failed' | 'refunded';
    date: string;
    type: 'invoice' | 'expense' | 'refund';
  }[];
  activities: {
    id: string;
    user: { name: string; avatar?: string; initials: string };
    action: string;
    target: string;
    time: string;
    type: 'project' | 'lead' | 'task' | 'finance' | 'security';
  }[];
  notifications: {
    id: string;
    title: string;
    description: string;
    time: string;
    type: 'reminder' | 'deadline' | 'mention' | 'approval';
    read: boolean;
  }[];
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

    // Map the real aggregation payload into the format expected by our UI components
    const formatCurrency = (val: number) =>
      `$${(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return {
      kpis: {
        revenue: {
          value: formatCurrency(data.kpis.revenueTotal),
          change: 'Real data',
          isPositive: true,
          comparisonLabel: 'total collected',
        },
        activeProjects: {
          value: `${data.kpis.activeProjects || 0}`,
          change: 'in progress',
          isPositive: true,
          comparisonLabel: 'active sprints',
        },
        completedProjects: {
          value: `${data.kpis.projectCompletionRate?.toFixed(1) || 0}%`,
          change: 'completion',
          isPositive: true,
          comparisonLabel: 'completion rate',
        },
        totalLeads: {
          value: '0',
          change: '0%',
          isPositive: true,
          comparisonLabel: 'leads acquired',
        },
        convertedLeads: {
          value: '0',
          change: '0%',
          isPositive: true,
          comparisonLabel: 'conversion',
        },
        pendingInvoices: {
          value: formatCurrency(data.kpis.totalOutstanding),
          change: formatCurrency(data.kpis.totalOverdue),
          isPositive: false,
          comparisonLabel: 'amount overdue',
        },
        teamProductivity: {
          value: `${data.kpis.laborUtilization?.toFixed(1) || 0}%`,
          change: 'billable',
          isPositive: true,
          comparisonLabel: 'billable utilization',
        },
        monthlyGrowth: { value: '0%', change: '0%', isPositive: true, comparisonLabel: 'growth' },
        clientRetention: {
          value: '0%',
          change: '0%',
          isPositive: true,
          comparisonLabel: 'retention',
        },
        profitability: {
          value: `${data.kpis.profitMargin?.toFixed(1) || 0}%`,
          change: formatCurrency(data.kpis.netProfit),
          isPositive: data.kpis.netProfit >= 0,
          comparisonLabel: 'net profit',
        },
      },
      charts: {
        revenueArea: (data.cashflowTrends || []).map((t: any) => ({
          name: t.month,
          amount: t.income,
          target: t.income * 1.2, // mock target 20% higher
        })),
        leadConversionBar: [], // No lead data currently in aggregation
        projectGrowthLine: [], // Requires historical project data not in agg yet
        teamProductivityRadar: [], // No radar data
        expensesBar: (data.cashflowTrends || []).map((t: any) => ({
          name: t.month,
          revenue: t.income,
          expenses: t.expense,
          profit: t.income - t.expense,
        })),
        projectStatusPie: [], // Can map this if backend expands
        teamWorkload: (data.workloadDistribution || []).map((w: any) => ({
          name: w.name,
          allocated: w.value * 40, // 40h approx per head
          capacity: w.value * 40, // full capacity used for demo
        })),
      },
      transactions: [], // Not returning raw TXs in current dashboard endpoint
      activities: (data.insights || []).map((i: any) => ({
        id: i._id,
        user: { name: 'System', initials: 'SYS' },
        action: i.title,
        target: i.category,
        time: 'recent',
        type: 'project',
      })),
      notifications: [],
    };
  } catch (err) {
    console.error('Failed to fetch analytics', err);
    // Return empty state on failure
    return {
      kpis: {
        revenue: { value: '$0', change: '0%', isPositive: true, comparisonLabel: '' },
        activeProjects: { value: '0', change: '0', isPositive: true, comparisonLabel: '' },
        completedProjects: { value: '0', change: '0%', isPositive: true, comparisonLabel: '' },
        totalLeads: { value: '0', change: '0%', isPositive: true, comparisonLabel: '' },
        convertedLeads: { value: '0', change: '0%', isPositive: true, comparisonLabel: '' },
        pendingInvoices: { value: '$0', change: '$0', isPositive: false, comparisonLabel: '' },
        teamProductivity: { value: '0%', change: '0%', isPositive: true, comparisonLabel: '' },
        monthlyGrowth: { value: '0%', change: '0%', isPositive: true, comparisonLabel: '' },
        clientRetention: { value: '0%', change: '0%', isPositive: true, comparisonLabel: '' },
        profitability: { value: '0%', change: '0%', isPositive: true, comparisonLabel: '' },
      },
      charts: {
        revenueArea: [],
        leadConversionBar: [],
        projectGrowthLine: [],
        teamProductivityRadar: [],
        expensesBar: [],
        projectStatusPie: [],
        teamWorkload: [],
      },
      transactions: [],
      activities: [],
      notifications: [],
    };
  }
}
