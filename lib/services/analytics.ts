/**
 * SyncGrid Enterprise Analytics Service Layer
 * Generates dynamic, highly realistic, date-filtered mock business intelligence datasets.
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

/**
 * Main mock service logic yielding dynamic metrics tailored to the current range query
 */
export function getAnalyticsData(
  range: string,
  startDate?: string,
  endDate?: string
): AnalyticsData {
  // Use a pseudo-random seed based on range or date inputs to give consistent but realistic variations
  const seed = range.length + (startDate?.length ?? 0) + (endDate?.length ?? 0);
  const factor = (seed % 5) * 0.1 + 0.8; // yields 0.8 to 1.2 multiplier for variation

  // Days adjustment multiplier based on date granularity
  let durationMultiplier = 1.0;
  let intervalLabel = 'vs last 30 days';
  if (range === 'today') {
    durationMultiplier = 0.05;
    intervalLabel = 'vs yesterday';
  } else if (range === 'weekly') {
    durationMultiplier = 0.25;
    intervalLabel = 'vs last week';
  } else if (range === 'yearly') {
    durationMultiplier = 12.0;
    intervalLabel = 'vs last year';
  } else if (range === 'custom') {
    intervalLabel = 'for specified range';
  }

  // Dynamic KPI Calculation
  const revAmount = 142500 * durationMultiplier * factor;
  const activeProjs = Math.round(18 * factor);
  const completedProjs = Math.round(24 * durationMultiplier * factor);
  const totalLeadsCount = Math.round(380 * durationMultiplier * factor);
  const convertedLeadsCount = Math.round(totalLeadsCount * 0.38 * factor);
  const invoiceCount = Math.round(8 * factor);
  const prodScore = Math.min(100, Math.round(92 * factor));
  const rententionRate = Math.min(100, Math.round(96.8 * factor));
  const profitMargin = Math.min(100, Math.round(24.5 * factor));

  // Generates clean chart dates dynamically
  const generateChartMonths = () => {
    if (range === 'yearly') {
      return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    }
    if (range === 'weekly') {
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    }
    if (range === 'today') {
      return ['09:00', '12:00', '15:00', '18:00', '21:00'];
    }
    return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  };

  const timeCategories = generateChartMonths();

  const revenueArea = timeCategories.map((name, i) => ({
    name,
    amount: Math.round(
      (revAmount / timeCategories.length) * (1 + Math.sin(i) * 0.2) * (i + 1) * 0.4
    ),
    target: Math.round((revAmount / timeCategories.length) * 1.1),
  }));

  const leadConversionBar = timeCategories.map((name, i) => {
    const leads = Math.round((totalLeadsCount / timeCategories.length) * (1 + Math.cos(i) * 0.3));
    return {
      name,
      leads,
      conversions: Math.round(leads * 0.38 * (1 + Math.sin(i) * 0.1)),
    };
  });

  const projectGrowthLine = timeCategories.map((name, i) => ({
    name,
    active: Math.round(activeProjs * (0.8 + Math.sin(i) * 0.2)),
    completed: Math.round(completedProjs * (0.5 + Math.cos(i) * 0.3)),
  }));

  const teamProductivityRadar = [
    { subject: 'Coding', A: Math.round(85 * factor), B: 90, fullMark: 100 },
    { subject: 'UX Design', A: Math.round(90 * factor), B: 85, fullMark: 100 },
    { subject: 'QA Testing', A: Math.round(75 * factor), B: 80, fullMark: 100 },
    { subject: 'Documentation', A: Math.round(80 * factor), B: 75, fullMark: 100 },
    { subject: 'DevOps', A: Math.round(70 * factor), B: 85, fullMark: 100 },
  ];

  const expensesBar = timeCategories.map((name, i) => {
    const revenue = Math.round((revAmount / timeCategories.length) * (1.2 + Math.cos(i) * 0.2));
    const expenses = Math.round(revenue * 0.7 * (1 + Math.sin(i) * 0.15));
    return {
      name,
      revenue,
      expenses,
      profit: revenue - expenses,
    };
  });

  const projectStatusPie = [
    { name: 'Planning', value: Math.round(4 * factor), color: 'hsl(var(--primary) / 0.4)' },
    { name: 'Development', value: Math.round(8 * factor), color: 'hsl(var(--primary))' },
    { name: 'Testing', value: Math.round(3 * factor), color: 'hsl(var(--secondary))' },
    { name: 'Deployment', value: Math.round(2 * factor), color: 'emerald-500' },
    { name: 'On Hold', value: Math.round(1 * factor), color: 'rose-500' },
  ];

  const teamWorkload = [
    { name: 'Sarah Conner', allocated: Math.round(36 * factor), capacity: 40 },
    { name: 'Alex Mercer', allocated: Math.round(42 * factor), capacity: 40 },
    { name: 'David Kim', allocated: Math.round(28 * factor), capacity: 40 },
    { name: 'Elena Rostova', allocated: Math.round(39 * factor), capacity: 40 },
    { name: 'Marcus Aurelius', allocated: Math.round(15 * factor), capacity: 40 },
  ];

  // Dynamic lists
  const transactions: AnalyticsData['transactions'] = [
    {
      id: 'TX-4001',
      client: 'Acme Enterprise Inc.',
      amount: `$${(24500 * factor).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      status: 'paid',
      date: '2 hours ago',
      type: 'invoice',
    },
    {
      id: 'TX-4002',
      client: 'Starlight Agency LLC',
      amount: `$${(12800 * factor).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      status: 'pending',
      date: '5 hours ago',
      type: 'invoice',
    },
    {
      id: 'TX-4003',
      client: 'AWS Cloud Server Sub',
      amount: `$${(1450 * factor).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      status: 'paid',
      date: '1 day ago',
      type: 'expense',
    },
    {
      id: 'TX-4004',
      client: 'Framer SaaS Subscription',
      amount: `$${(290 * factor).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      status: 'failed',
      date: '2 days ago',
      type: 'expense',
    },
    {
      id: 'TX-4005',
      client: 'Nova Systems Refund',
      amount: `$${(3500 * factor).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      status: 'refunded',
      date: '3 days ago',
      type: 'refund',
    },
  ];

  const activities: AnalyticsData['activities'] = [
    {
      id: 'ACT-901',
      user: { name: 'Sarah Conner', initials: 'SC' },
      action: 'completed task deploy sprint build',
      target: 'Nova Landing Page v2',
      time: '15 mins ago',
      type: 'project',
    },
    {
      id: 'ACT-902',
      user: { name: 'Alex Mercer', initials: 'AM' },
      action: 'converted cold lead into qualified',
      target: 'Acme Enterprise Lead Integration',
      time: '1 hour ago',
      type: 'lead',
    },
    {
      id: 'ACT-903',
      user: { name: 'System Security', initials: 'SYS' },
      action: 'triggered alert failed root API access attempt from IP 192.168.1.92',
      target: 'Server Core Endpoint',
      time: '3 hours ago',
      type: 'security',
    },
    {
      id: 'ACT-904',
      user: { name: 'David Kim', initials: 'DK' },
      action: 'generated client proposal invoice for',
      target: 'Starlight CRM Re-Architecture',
      time: '5 hours ago',
      type: 'finance',
    },
    {
      id: 'ACT-905',
      user: { name: 'Elena Rostova', initials: 'ER' },
      action: 'merged code push fix layout margins on enterprise table view',
      target: 'Global Design Core Rep',
      time: '1 day ago',
      type: 'task',
    },
  ];

  const notifications: AnalyticsData['notifications'] = [
    {
      id: 'NOT-101',
      title: 'Awaiting Invoice Approval',
      description: 'Acme Invoice TX-4001 needs primary finance manager clearance.',
      time: '10m ago',
      type: 'approval',
      read: false,
    },
    {
      id: 'NOT-102',
      title: 'Dev Sprint Deadline approaching',
      description: 'SyncGrid UI System integration sprint ends in exactly 24 hours.',
      time: '1h ago',
      type: 'deadline',
      read: false,
    },
    {
      id: 'NOT-103',
      title: 'Elena Rostova mentioned you',
      description: '"Can we double check the HSL color variables inside components/charts?"',
      time: '4h ago',
      type: 'mention',
      read: true,
    },
    {
      id: 'NOT-104',
      title: 'Weekly Backups verified',
      description: 'System database stashes successfully pushed to server AWS buckets.',
      time: '1d ago',
      type: 'reminder',
      read: true,
    },
  ];

  return {
    kpis: {
      revenue: { value: '$0', change: '0%', isPositive: true, comparisonLabel: intervalLabel },
      activeProjects: {
        value: '0',
        change: '0 new',
        isPositive: true,
        comparisonLabel: 'started this interval',
      },
      completedProjects: {
        value: '0',
        change: '0%',
        isPositive: true,
        comparisonLabel: intervalLabel,
      },
      totalLeads: { value: '0', change: '0%', isPositive: true, comparisonLabel: intervalLabel },
      convertedLeads: {
        value: '0',
        change: '0%',
        isPositive: true,
        comparisonLabel: 'avg conversion rate',
      },
      pendingInvoices: {
        value: '0',
        change: '$0',
        isPositive: false,
        comparisonLabel: 'total outstanding balance',
      },
      teamProductivity: {
        value: '0%',
        change: '0%',
        isPositive: true,
        comparisonLabel: 'efficiency index',
      },
      monthlyGrowth: {
        value: '0%',
        change: '0%',
        isPositive: true,
        comparisonLabel: 'growth index delta',
      },
      clientRetention: {
        value: '0%',
        change: '0%',
        isPositive: true,
        comparisonLabel: 'avg account continuity',
      },
      profitability: {
        value: '0%',
        change: '0%',
        isPositive: true,
        comparisonLabel: 'net income margin ratio',
      },
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
