'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { ChartWrapper } from './ChartWrapper';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Clock,
  AlertTriangle,
  RefreshCw,
  LayoutGrid,
  ChevronUp,
  ChevronDown,
  Activity,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  IDashboardWidget,
  IExecutiveInsight,
  IKpiSummary,
  ICashflowTrendPoint,
  IWorkloadDistributionPoint,
} from '@/types/analytics';

interface IDashboardAggregatedData {
  kpis: IKpiSummary;
  insights: IExecutiveInsight[];
  cashflowTrends: ICashflowTrendPoint[];
  workloadDistribution: IWorkloadDistributionPoint[];
  role: 'admin' | 'employee';
}

export function AnalyticsDashboard() {
  const {
    filters,
    isLayoutEditable,
    setLayoutEditable,
    dashboardLayout,
    setDashboardLayout,
    isLoading,
    setIsLoading,
  } = useAnalyticsStore();

  const [dashboardData, setDashboardData] = useState<IDashboardAggregatedData | null>(null);
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [lastTelemetryPulse, setLastTelemetryPulse] = useState<string | null>(null);
  const [pulseActive, setPulseActive] = useState<boolean>(false);

  // Fetch Dashboard Stats
  const fetchDashboardStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/protected/analytics/dashboard');
      const json = await response.json();
      if (json.success) {
        setDashboardData(json.data);
        if (json.data.layout?.widgets) {
          setDashboardLayout(json.data.layout.widgets);
        } else {
          // Default multi-dimensional snap layouts
          setDashboardLayout([
            { widgetId: 'kpi_financials', x: 0, y: 0, w: 12, h: 3 },
            { widgetId: 'chart_cashflow', x: 0, y: 3, w: 8, h: 4 },
            { widgetId: 'chart_workload', x: 8, y: 3, w: 4, h: 4 },
            { widgetId: 'insight_cockpit', x: 0, y: 7, w: 12, h: 3 },
          ]);
        }
      } else {
        toast.error('Could not aggregate metrics dashboard statistics.');
      }
    } catch (err) {
      toast.error('Network failure connecting to analytics service.');
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setDashboardLayout, setDashboardData]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      await Promise.resolve();
      if (!active) return;
      fetchDashboardStats();
    };
    load();
    return () => {
      active = false;
    };
  }, [filters, fetchDashboardStats]);

  // Realtime SSE Gateway Channel Subscription
  useEffect(() => {
    const sse = new EventSource('/api/protected/analytics/realtime');

    sse.addEventListener('telemetry', (event: MessageEvent) => {
      try {
        const realtimeTelemetry = JSON.parse(event.data) as IKpiSummary & { timestamp: string };

        // Trigger live pulse animation next to metrics
        setPulseActive(true);
        setLastTelemetryPulse(realtimeTelemetry.timestamp);

        // Optimistically merge live telemetry updates into local aggregates state
        setDashboardData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            kpis: {
              ...prev.kpis,
              revenueTotal: realtimeTelemetry.revenueTotal,
              profitMargin: realtimeTelemetry.profitMargin,
              netProfit: realtimeTelemetry.netProfit,
              laborUtilization: realtimeTelemetry.laborUtilization,
              overdueRatio: realtimeTelemetry.overdueRatio,
              totalOverdue: realtimeTelemetry.totalOverdue,
              budgetAlertsCount: realtimeTelemetry.budgetAlertsCount,
            },
          };
        });

        setTimeout(() => setPulseActive(false), 1500);
      } catch (err) {
        // Safe fail on parse errors
      }
    });

    return () => {
      sse.close();
    };
  }, []);

  // Layout positions updates
  const saveLayoutOrder = async (newLayout: IDashboardWidget[]) => {
    try {
      const res = await fetch('/api/protected/analytics/widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgets: newLayout }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Persistent dashboard widgets layout coordinates updated.');
      }
    } catch (err) {
      toast.error('Failed to save layout overrides.');
    }
  };

  // snap-to-grid dimension calibrator toggles
  const resizeWidget = (widgetId: string, action: 'expand' | 'shrink') => {
    const updated = dashboardLayout.map((widget: IDashboardWidget) => {
      if (widget.widgetId !== widgetId) return widget;

      let nextW = widget.w;
      if (action === 'expand') {
        if (widget.w === 4) nextW = 8;
        else if (widget.w === 8) nextW = 12;
      } else {
        if (widget.w === 12) nextW = 8;
        else if (widget.w === 8) nextW = 4;
      }
      return { ...widget, w: nextW };
    });

    setDashboardLayout(updated);
    saveLayoutOrder(updated);
  };

  // Move layout widgets (HTML5 native Drag and Drop or arrows)
  const handleDragStart = (id: string) => {
    setDraggedWidgetId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: string) => {
    if (!draggedWidgetId || draggedWidgetId === targetId) return;

    const dragIdx = dashboardLayout.findIndex((w) => w.widgetId === draggedWidgetId);
    const targetIdx = dashboardLayout.findIndex((w) => w.widgetId === targetId);

    const updated = [...dashboardLayout];
    const [draggedItem] = updated.splice(dragIdx, 1);
    updated.splice(targetIdx, 0, draggedItem);

    setDashboardLayout(updated);
    setDraggedWidgetId(null);
  };

  const moveWidget = (direction: 'up' | 'down', widgetId: string) => {
    const idx = dashboardLayout.findIndex((w) => w.widgetId === widgetId);
    if (idx === -1) return;

    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= dashboardLayout.length) return;

    const updated = [...dashboardLayout];
    const temp = updated[idx];
    updated[idx] = updated[newIdx];
    updated[newIdx] = temp;

    setDashboardLayout(updated);
    saveLayoutOrder(updated);
  };

  if (!dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <RefreshCw className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-semibold">
          Executing corporate MongoDB aggregation pipelines...
        </p>
      </div>
    );
  }

  const { kpis, insights, cashflowTrends, workloadDistribution } = dashboardData;

  const kpiItems = [
    {
      title: 'Net Revenue Generated',
      value: `$${(kpis.revenueTotal || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: <DollarSign className="h-4 w-4" />,
      sub: 'Cleared payments',
      color: 'from-blue-500/20 to-indigo-500/20',
      textColor: 'text-blue-500',
    },
    {
      title: 'Net Profit Margin',
      value: `${(kpis.profitMargin || 0).toFixed(1)}%`,
      icon: <TrendingUp className="h-4 w-4" />,
      sub: `Profit: $${(kpis.netProfit || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      color: 'from-emerald-500/20 to-teal-500/20',
      textColor: 'text-emerald-500',
    },
    {
      title: 'Billable Labor Utilization',
      value: `${(kpis.laborUtilization || 0).toFixed(1)}%`,
      icon: <Clock className="h-4 w-4" />,
      sub: 'Time log billable ratio',
      color: 'from-amber-500/20 to-orange-500/20',
      textColor: 'text-amber-500',
    },
    {
      title: 'Overdue Receivables Ratio',
      value: `${(kpis.overdueRatio || 0).toFixed(1)}%`,
      icon: <Percent className="h-4 w-4" />,
      sub: `Overdue: $${(kpis.totalOverdue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      color:
        kpis.overdueRatio > 12
          ? 'from-rose-500/20 to-red-500/20'
          : 'from-indigo-500/20 to-purple-500/20',
      textColor: kpis.overdueRatio > 12 ? 'text-rose-500' : 'text-indigo-500',
    },
  ];

  // Map widget rendering
  const renderWidget = (widgetId: string) => {
    switch (widgetId) {
      case 'kpi_financials':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {kpiItems.map((item, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -3 }}
                className="relative overflow-hidden rounded-xl border border-border bg-card/40 backdrop-blur-md p-5 flex flex-col justify-between shadow-sm hover:shadow-md"
              >
                <div
                  className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${item.color} rounded-bl-full opacity-60`}
                />
                <div className="flex items-center justify-between z-10 mb-4">
                  <span className="text-xs text-muted-foreground font-bold tracking-tight uppercase">
                    {item.title}
                  </span>
                  <div className={`p-1.5 rounded-lg bg-card/65 ${item.textColor}`}>{item.icon}</div>
                </div>
                <div className="z-10">
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-extrabold tracking-tight">{item.value}</h3>
                    {pulseActive && (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 font-semibold">{item.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        );

      case 'chart_cashflow':
        return (
          <ChartWrapper
            type="area"
            data={cashflowTrends}
            xKey="month"
            metrics={[
              { key: 'income', label: 'Company Inflow (Revenues)', color: 'hsl(var(--primary))' },
              { key: 'expense', label: 'Company Outflow (Expenses)', color: '#ec4899' },
            ]}
            title="Operational Capital Cashflows Timeline"
            subtitle="Historical month-by-month cashflow progression"
            height={260}
          />
        );

      case 'chart_workload':
        return (
          <ChartWrapper
            type="donut"
            data={workloadDistribution}
            title="Workforce Workload Distribution"
            subtitle="Total resources count per division"
            height={260}
          />
        );

      case 'insight_cockpit':
        return (
          <Card className="border-border bg-card/45 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary animate-pulse" />
                Executive Health Intelligence & Alarms
              </CardTitle>
              {kpis.budgetAlertsCount > 0 && (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/25 bg-rose-500/10 px-3 py-1 text-xs text-rose-500 font-bold">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {kpis.budgetAlertsCount} Active Budget Breaches
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((ins: IExecutiveInsight) => (
                  <div
                    key={ins._id}
                    className={`rounded-lg border p-4 flex items-start gap-3.5 select-none transition-colors ${
                      ins.severity === 'critical' || ins.severity === 'danger'
                        ? 'border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10'
                        : ins.severity === 'warning'
                          ? 'border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10'
                          : 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-full mt-0.5 ${
                        ins.severity === 'critical' || ins.severity === 'danger'
                          ? 'bg-rose-500/10 text-rose-500'
                          : ins.severity === 'warning'
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-emerald-500/10 text-emerald-500'
                      }`}
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-foreground">{ins.title}</h4>
                        <span className="text-[9px] uppercase tracking-wider bg-card/65 font-bold text-muted-foreground px-1.5 py-0.5 rounded-sm">
                          {ins.category}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                        {ins.description}
                      </p>
                      <span className="text-[9px] text-muted-foreground font-semibold block pt-1.5">
                        Detected: {new Date(ins.detectedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Cockpit toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-muted/40 backdrop-blur-md rounded-xl p-4 border border-border">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-primary animate-pulse" />
            Executive Cockpit Control Panel
            {lastTelemetryPulse && (
              <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">
                <Activity className="h-3 w-3 animate-pulse" /> Live Realtime Telemetry Syncing
              </span>
            )}
          </h3>
          <p className="text-xs text-muted-foreground font-medium">
            Customize layouts configurations, seed sandboxed parameters, or execute pipeline
            recalculations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (isLayoutEditable) {
                saveLayoutOrder(dashboardLayout);
              }
              setLayoutEditable(!isLayoutEditable);
            }}
            className="flex items-center gap-2"
          >
            <LayoutGrid className="h-4 w-4" />
            {isLayoutEditable ? 'Save Grid Layout' : 'Customize Layout'}
          </Button>
        </div>
      </div>

      {/* Main Grid Widgets Placement using CSS Grid Spans */}
      <div className="grid grid-cols-12 gap-6">
        <AnimatePresence mode="popLayout">
          {dashboardLayout.map((item: IDocumentPosition) => (
            <motion.div
              key={item.widgetId}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              draggable={isLayoutEditable}
              onDragStart={() => handleDragStart(item.widgetId)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(item.widgetId)}
              className={cn(
                'relative group rounded-xl',
                item.w === 12 && 'col-span-12',
                item.w === 8 && 'lg:col-span-8 md:col-span-12 col-span-12',
                item.w === 4 && 'lg:col-span-4 md:col-span-12 col-span-12',
                isLayoutEditable &&
                  'border-2 border-dashed border-primary/30 p-2 cursor-grab active:cursor-grabbing bg-primary/5'
              )}
            >
              {isLayoutEditable && (
                <div className="absolute top-2 right-2 flex items-center gap-2 z-30 bg-background border border-border rounded-lg p-1.5 shadow-md select-none">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase px-1">
                    Drag card to swap order
                  </span>

                  {/* snap-to-grid width resizing buttons */}
                  <div className="flex items-center gap-1 border-l border-border pl-1.5 mr-1">
                    <button
                      onClick={() => resizeWidget(item.widgetId, 'shrink')}
                      disabled={item.w <= 4}
                      className="p-1 hover:bg-muted rounded text-muted-foreground disabled:opacity-30"
                      title="Shrink Grid Width"
                    >
                      <Minimize2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => resizeWidget(item.widgetId, 'expand')}
                      disabled={item.w >= 12}
                      className="p-1 hover:bg-muted rounded text-muted-foreground disabled:opacity-30"
                      title="Expand Grid Width"
                    >
                      <Maximize2 className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 border-l border-border pl-1.5">
                    <button
                      onClick={() => moveWidget('up', item.widgetId)}
                      className="p-1 hover:bg-muted rounded text-muted-foreground"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => moveWidget('down', item.widgetId)}
                      className="p-1 hover:bg-muted rounded text-muted-foreground"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
              {renderWidget(item.widgetId)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Temporary types for clean build
type IDocumentPosition = IDashboardWidget;
