/**
 * Analytics state store
 * Manages custom report selections, filter segments, layouts positions, and forecasting options.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface IGlobalFilters {
  dateRange: {
    start: string;
    end: string;
  };
  departmentId: string;
  projectId: string;
  employeeId: string;
  clientId: string;
  financialPeriod: string; // e.g. "Q1-2026", "2026-FY", "Custom"
}

export interface ICustomReportQuery {
  name: string;
  type: 'financial' | 'project' | 'workforce' | 'productivity';
  metrics: string[];
  groupBy: string;
  aggregateType: 'sum' | 'avg' | 'count' | 'max' | 'min';
  chartType: 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'stacked' | 'metric';
}

interface AnalyticsState {
  // Tabs & Views
  activeTab: 'cockpit' | 'builder' | 'kpi' | 'forecaster' | 'drilldown';
  setActiveTab: (tab: 'cockpit' | 'builder' | 'kpi' | 'forecaster' | 'drilldown') => void;

  // Global filters console
  filters: IGlobalFilters;
  setFilters: (filters: Partial<IGlobalFilters>) => void;
  resetFilters: () => void;

  // Dashboard customization controls
  isLayoutEditable: boolean;
  setLayoutEditable: (editable: boolean) => void;
  dashboardLayout: any[];
  setDashboardLayout: (layout: any[]) => void;

  // Visual report builder parameters
  reportQuery: ICustomReportQuery;
  setReportQuery: (query: Partial<ICustomReportQuery>) => void;
  resetReportQuery: () => void;

  // Fetch / operation progress indicators
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  operationError: string | null;
  setOperationError: (error: string | null) => void;

  // Cache lists
  savedReports: any[];
  setSavedReports: (reports: any[]) => void;
  kpiConfigurations: any[];
  setKpiConfigurations: (kpis: any[]) => void;
}

const initialFilters: IGlobalFilters = {
  dateRange: {
    start: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString().split('T')[0], // last 90 days default
    end: new Date().toISOString().split('T')[0],
  },
  departmentId: '',
  projectId: '',
  employeeId: '',
  clientId: '',
  financialPeriod: 'last_90_days',
};

const initialReportQuery: ICustomReportQuery = {
  name: 'New Custom Performance Report',
  type: 'financial',
  metrics: ['revenueTotal'],
  groupBy: 'month',
  aggregateType: 'sum',
  chartType: 'bar',
};

export const useAnalyticsStore = create<AnalyticsState>()(
  devtools((set) => ({
    activeTab: 'cockpit',
    setActiveTab: (activeTab) => set({ activeTab }),

    filters: initialFilters,
    setFilters: (newFilters) =>
      set((state) => ({
        filters: {
          ...state.filters,
          ...newFilters,
        },
      })),
    resetFilters: () => set({ filters: initialFilters }),

    isLayoutEditable: false,
    setLayoutEditable: (isLayoutEditable) => set({ isLayoutEditable }),
    dashboardLayout: [],
    setDashboardLayout: (dashboardLayout) => set({ dashboardLayout }),

    reportQuery: initialReportQuery,
    setReportQuery: (newQuery) =>
      set((state) => ({
        reportQuery: {
          ...state.reportQuery,
          ...newQuery,
        },
      })),
    resetReportQuery: () => set({ reportQuery: initialReportQuery }),

    isLoading: false,
    setIsLoading: (isLoading) => set({ isLoading }),
    operationError: null,
    setOperationError: (operationError) => set({ operationError }),

    savedReports: [],
    setSavedReports: (savedReports) => set({ savedReports }),
    kpiConfigurations: [],
    setKpiConfigurations: (kpiConfigurations) => set({ kpiConfigurations }),
  }))
);
