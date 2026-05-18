'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { CustomReportBuilder } from '@/components/analytics/CustomReportBuilder';
import { KPIManager } from '@/components/analytics/KPIManager';
import { ProfitabilityForecaster } from '@/components/analytics/ProfitabilityForecaster';
import { OperationalDrilldown } from '@/components/analytics/OperationalDrilldown';
import {
  TrendingUp,
  LayoutGrid,
  FileSpreadsheet,
  Target,
  Brain,
  Zap,
  Calendar,
  Sparkles,
} from 'lucide-react';

export default function AnalyticsPage() {
  const { activeTab, setActiveTab, filters, setFilters } = useAnalyticsStore();

  const tabsConfig = [
    { id: 'cockpit', label: 'Executive Cockpit', icon: <LayoutGrid className="h-4 w-4" /> },
    {
      id: 'builder',
      label: 'Custom Report Builder',
      icon: <FileSpreadsheet className="h-4 w-4" />,
    },
    { id: 'kpi', label: 'KPI Definitions Vault', icon: <Target className="h-4 w-4" /> },
    { id: 'forecaster', label: 'Predictive Forecaster', icon: <Brain className="h-4 w-4" /> },
    { id: 'drilldown', label: 'Operational Drilldowns', icon: <Zap className="h-4 w-4" /> },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <PageHeader
        eyebrow="Intelligence Module"
        title="Business Analytics & Executive Reporting"
        description="Aggregate multi-tenant workforce, financials, and project logs to execute high-performance pipelines, monitor KPI targets, and project mathematical forecasts."
      />

      {/* Global Date Filters Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card/45 backdrop-blur-md rounded-xl p-4 border border-border items-center select-none">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-xs font-bold text-foreground">Global Analytics Period:</span>
        </div>
        <div className="flex items-center gap-3 md:col-span-2 justify-end">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-bold uppercase tracking-wider text-[9px]">
              From:
            </span>
            <Input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) =>
                setFilters({
                  dateRange: { ...filters.dateRange, start: e.target.value },
                })
              }
              className="text-xs h-8 py-0 font-semibold"
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-bold uppercase tracking-wider text-[9px]">
              To:
            </span>
            <Input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) =>
                setFilters({
                  dateRange: { ...filters.dateRange, end: e.target.value },
                })
              }
              className="text-xs h-8 py-0 font-semibold"
            />
          </div>
        </div>
      </div>

      {/* Dynamic Tabs Control Console */}
      <div className="border-b border-border flex flex-wrap gap-1 select-none overflow-x-auto pb-px">
        {tabsConfig.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 outline-none -mb-px ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="activeTabGlow"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_1px_8px_rgba(var(--primary-rgb),0.5)]"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === 'cockpit' && (
            <motion.div
              key="cockpit"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <AnalyticsDashboard />
            </motion.div>
          )}

          {activeTab === 'builder' && (
            <motion.div
              key="builder"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <CustomReportBuilder />
            </motion.div>
          )}

          {activeTab === 'kpi' && (
            <motion.div
              key="kpi"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <KPIManager />
            </motion.div>
          )}

          {activeTab === 'forecaster' && (
            <motion.div
              key="forecaster"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <ProfitabilityForecaster />
            </motion.div>
          )}

          {activeTab === 'drilldown' && (
            <motion.div
              key="drilldown"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <OperationalDrilldown />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
