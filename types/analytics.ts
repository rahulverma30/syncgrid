/**
 * Enterprise Reporting & BI Suite TypeScript Contracts
 * Guarantees zero unsafe "any" parameters across APIs, Zustand, and Recharts wrappers.
 */

export interface IGlobalFilters {
  dateRange: {
    start: string;
    end: string;
  };
  departmentId: string;
  projectId: string;
  employeeId: string;
  clientId: string;
  financialPeriod: string;
}

export interface ICustomReportQuery {
  name: string;
  type: 'financial' | 'project' | 'workforce' | 'productivity';
  metrics: string[];
  groupBy: string;
  aggregateType: 'sum' | 'avg' | 'count' | 'max' | 'min';
  chartType: 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'stacked' | 'metric';
}

export interface IDashboardWidget {
  widgetId: 'kpi_financials' | 'chart_cashflow' | 'chart_workload' | 'insight_cockpit';
  x: number;
  y: number;
  w: number;
  h: number;
  isCollapsed?: boolean;
}

export interface IExecutiveInsight {
  _id: string;
  companyId: string;
  title: string;
  category: 'financial' | 'project' | 'workforce' | 'productivity';
  description: string;
  severity: 'info' | 'warning' | 'danger' | 'critical';
  detectedAt: string;
  isResolved: boolean;
}

export interface IKpiSummary {
  revenueTotal: number;
  profitMargin: number;
  netProfit: number;
  laborUtilization: number;
  overdueRatio: number;
  totalOverdue: number;
  budgetAlertsCount: number;
}

export interface IChartMetric {
  key: string;
  label: string;
  color: string;
}

export interface ICashflowTrendPoint {
  month: string;
  income: number;
  expense: number;
}

export interface IWorkloadDistributionPoint {
  name: string;
  value: number;
}

export interface IForecastDataPoint {
  label: string;
  actual?: number;
  projected?: number;
  lower?: number;
  upper?: number;
  isForecast: boolean;
  isAnomaly?: boolean;
}

export interface IForecastMeta {
  metricName: 'revenue' | 'workload' | 'budget';
  timelineMonths: number;
  confidenceInterval: number;
  growthRate: number;
}

export interface IForecastResponse {
  success: boolean;
  data: IForecastDataPoint[];
  meta: IForecastMeta;
}
