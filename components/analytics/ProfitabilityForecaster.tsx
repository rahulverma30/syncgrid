'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  TrendingUp,
  Brain,
  Sliders,
  CalendarDays,
  Gauge,
  HelpCircle,
  Activity,
  Maximize2,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { IForecastDataPoint, IForecastMeta } from '@/types/analytics';

interface CustomForecastTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  metricName: 'revenue' | 'workload';
}

const CustomForecastTooltip = ({
  active,
  payload,
  label,
  metricName,
}: CustomForecastTooltipProps) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload as IForecastDataPoint;
    const getMetricSymbol = () => (metricName === 'revenue' ? '$' : '');
    const getMetricUnit = () => (metricName === 'revenue' ? 'USD' : 'Hrs');

    return (
      <div className="rounded-lg border border-border bg-popover/90 backdrop-blur-md p-3 shadow-xl select-none text-left min-w-[170px] text-xs font-semibold">
        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 border-b border-border pb-1">
          {label} {dataPoint.isForecast ? '(PROJECTION)' : '(HISTORICAL)'}
        </p>
        <div className="space-y-1.5">
          {!dataPoint.isForecast && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Actual Result:</span>
                <span className="font-mono font-bold text-foreground">
                  {getMetricSymbol()}
                  {dataPoint.actual?.toLocaleString()} {getMetricUnit()}
                </span>
              </div>
              {dataPoint.isAnomaly && (
                <div className="flex items-center gap-1 text-[9px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-sm uppercase tracking-wide">
                  <AlertTriangle className="h-3 w-3" /> Billing Anomaly Detected
                </div>
              )}
            </>
          )}
          {dataPoint.isForecast && (
            <>
              <div className="flex justify-between items-center text-primary font-bold">
                <span>Predicted Median:</span>
                <span className="font-mono font-bold">
                  {getMetricSymbol()}
                  {dataPoint.projected?.toLocaleString()} {getMetricUnit()}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-emerald-500 bg-emerald-500/5 px-1.5 py-0.5 rounded-sm">
                <span>Optimistic Cap:</span>
                <span className="font-mono font-bold">
                  {getMetricSymbol()}
                  {dataPoint.upper?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-rose-500 bg-rose-500/5 px-1.5 py-0.5 rounded-sm">
                <span>Pessimistic Floor:</span>
                <span className="font-mono font-bold">
                  {getMetricSymbol()}
                  {dataPoint.lower?.toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export function ProfitabilityForecaster() {
  const { isLoading, setIsLoading } = useAnalyticsStore();

  const [metricName, setMetricName] = useState<'revenue' | 'workload'>('revenue');
  const [timelineMonths, setTimelineMonths] = useState(6);
  const [confidenceInterval, setConfidenceInterval] = useState(95);
  const [forecastMethod, setForecastMethod] = useState<'holt-winters' | 'ols'>('holt-winters');

  const [forecastDataset, setForecastDataset] = useState<IForecastDataPoint[]>([]);
  const [regressionMeta, setRegressionMeta] = useState<IForecastMeta | null>(null);

  const runPredictiveForecast = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/protected/analytics/forecasting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metricName,
          timelineMonths,
          confidenceInterval,
          forecastMethod,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setForecastDataset(json.data);
        setRegressionMeta(json.meta);
        toast.success(`Predictive curves computed over next ${timelineMonths} months!`);
      } else {
        toast.error(`Forecasting failed: ${json.message}`);
      }
    } catch (err) {
      toast.error('Network failure connecting to predictive engine.');
    } finally {
      setIsLoading(false);
    }
  }, [
    setIsLoading,
    metricName,
    timelineMonths,
    confidenceInterval,
    forecastMethod,
    setForecastDataset,
    setRegressionMeta,
  ]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      await Promise.resolve();
      if (!active) return;
      runPredictiveForecast();
    };
    load();
    return () => {
      active = false;
    };
  }, [runPredictiveForecast]);

  const getMetricSymbol = () => {
    return metricName === 'revenue' ? '$' : '';
  };

  const getMetricUnit = () => {
    return metricName === 'revenue' ? 'USD' : 'Hrs';
  };

  // Advanced WCAG Dynamic Accessibility Narrative Summary
  const screenReaderSummary = useMemo(() => {
    if (forecastDataset.length === 0) return 'Forecasting chart is empty.';
    const historicalPoints = forecastDataset.filter((d) => !d.isForecast);
    const forecastedPoints = forecastDataset.filter((d) => d.isForecast);
    const lastActual = historicalPoints[historicalPoints.length - 1]?.actual || 0;
    const lastProjected = forecastedPoints[forecastedPoints.length - 1]?.projected || 0;
    const growth = regressionMeta?.growthRate || 0;
    const anomalyCount = historicalPoints.filter((d) => d.isAnomaly).length;

    return `Predictive forecast chart using ${forecastMethod === 'ols' ? 'OLS Linear Regression' : 'Holt-Winters Double Exponential Smoothing'}. Historical baseline ended at actual result ${lastActual.toLocaleString()}. Predicted median projection for the horizon end is ${lastProjected.toLocaleString()} representing an aggregated slope trend of ${growth}% change month-over-month. ${anomalyCount > 0 ? `There are ${anomalyCount} anomaly data coordinates identified in your historical timeline.` : 'No billing anomalies were identified.'}`;
  }, [forecastDataset, forecastMethod, regressionMeta]);

  return (
    <div className="space-y-6">
      {/* Parameters Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 bg-muted/40 backdrop-blur-md rounded-xl p-4 border border-border items-center">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
            <Sliders className="h-3.5 w-3.5" />
            Forecast Target
          </label>
          <select
            value={metricName}
            onChange={(e) => setMetricName(e.target.value as 'revenue' | 'workload')}
            className="w-full bg-background border border-border rounded-lg p-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="revenue">Corporate Cashflow Revenue</option>
            <option value="workload">Workforce Billable Hours</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            Timeline Horizon
          </label>
          <select
            value={timelineMonths}
            onChange={(e) => setTimelineMonths(Number(e.target.value))}
            className="w-full bg-background border border-border rounded-lg p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value={3}>Next 3 Months (Quarterly Projection)</option>
            <option value={6}>Next 6 Months (Mid-Year Projection)</option>
            <option value={12}>Next 12 Months (Annual Target Model)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Gauge className="h-3.5 w-3.5" />
            Confidence Margin
          </label>
          <select
            value={confidenceInterval}
            onChange={(e) => setConfidenceInterval(Number(e.target.value))}
            className="w-full bg-background border border-border rounded-lg p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value={90}>90% Confidence Interval Bounds</option>
            <option value={95}>95% Confidence Interval Bounds (Standard)</option>
            <option value={99}>99% Confidence Interval Bounds (High-Risk)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Brain className="h-3.5 w-3.5" />
            Equation Strategy
          </label>
          <select
            value={forecastMethod}
            onChange={(e) => setForecastMethod(e.target.value as 'holt-winters' | 'ols')}
            className="w-full bg-background border border-border rounded-lg p-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary text-primary"
          >
            <option value="holt-winters">Holt-Winters Double Exponential</option>
            <option value="ols">OLS Linear Regression (Linear)</option>
          </select>
        </div>

        <div className="pt-4 lg:pt-0 lg:flex lg:justify-end">
          <Button
            onClick={runPredictiveForecast}
            disabled={isLoading}
            className="w-full lg:w-fit text-xs font-bold px-5 py-2.5 flex items-center gap-2"
          >
            <Brain className="h-4 w-4 animate-pulse" />
            Solve Equations
          </Button>
        </div>
      </div>

      {/* Numerical Stats Panels */}
      {regressionMeta && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-xl border border-border bg-card/45 backdrop-blur-md p-5 flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-muted-foreground uppercase">
                Slope Direction
              </span>
              <h3 className="text-xl font-extrabold text-foreground">
                {regressionMeta.growthRate > 0 ? '+' : ''}
                {regressionMeta.growthRate}% MoM Change
              </h3>
              <p className="text-[10px] text-muted-foreground font-semibold">
                Smoothed trend velocity expansion rate.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/45 backdrop-blur-md p-5 flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.15)]">
              <Maximize2 className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-muted-foreground uppercase">
                Optimistic Cap
              </span>
              <h3 className="text-xl font-extrabold text-foreground">
                {getMetricSymbol()}
                {forecastDataset
                  .filter((d) => d.isForecast)
                  .reduce((max, d) => Math.max(max, d.upper || 0), 0)
                  .toLocaleString()}
                {getMetricUnit() === 'USD' ? '' : ' hrs'}
              </h3>
              <p className="text-[10px] text-muted-foreground font-semibold">
                Highest optimistic standard deviation ceiling.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/45 backdrop-blur-md p-5 flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.15)]">
              <Activity className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-muted-foreground uppercase">
                Pessimistic Floor Limit
              </span>
              <h3 className="text-xl font-extrabold text-foreground">
                {getMetricSymbol()}
                {forecastDataset
                  .filter((d) => d.isForecast)
                  .reduce(
                    (min, d) => Math.min(min, d.lower === undefined ? Infinity : d.lower),
                    Infinity
                  )
                  .toLocaleString()}
                {getMetricUnit() === 'USD' ? '' : ' hrs'}
              </h3>
              <p className="text-[10px] text-muted-foreground font-semibold">
                Minimum variance confidence support floor.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Accessible Screen-Reader Description Narrative Summary */}
      <div className="sr-only" aria-live="polite">
        {screenReaderSummary}
      </div>

      {/* Advanced Double Confidence Bands Recharts */}
      <Card className="border-border bg-card/45 backdrop-blur-md">
        <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary animate-pulse" />
            {forecastMethod === 'ols'
              ? 'Least-Squares Linear Regressions & Confidence Bands'
              : 'Holt-Winters Double Exponential Smoothing Curve'}
          </CardTitle>
          <span className="text-[10px] font-bold text-muted-foreground bg-muted/65 px-2.5 py-0.5 rounded-full">
            Calculated at {confidenceInterval}% confidence intervals
          </span>
        </CardHeader>
        <CardContent className="py-6">
          <div className="h-[320px] w-full font-mono text-xs select-none">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={forecastDataset}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
                <XAxis
                  dataKey="label"
                  stroke="currentColor"
                  className="text-muted-foreground/80 font-mono text-[9px]"
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                <YAxis
                  stroke="currentColor"
                  className="text-muted-foreground/80 font-mono text-[9px]"
                  tickLine={false}
                  axisLine={false}
                  dx={-8}
                />
                <Tooltip content={<CustomForecastTooltip metricName={metricName} />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  className="text-muted-foreground text-[10px]"
                  wrapperStyle={{ paddingBottom: '20px' }}
                />
                {/* Historical Actuals - pulsating red warning circle on anomalies */}
                <Line
                  name="Historical Actual Performance"
                  type="monotone"
                  dataKey="actual"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload?.isAnomaly) {
                      return (
                        <g key={cx}>
                          <circle
                            cx={cx}
                            cy={cy}
                            r={7}
                            fill="#ef4444"
                            className="animate-ping opacity-60"
                          />
                          <circle
                            cx={cx}
                            cy={cy}
                            r={5}
                            fill="#f87171"
                            stroke="#dc2626"
                            strokeWidth={1.5}
                          />
                        </g>
                      );
                    }
                    return (
                      <circle
                        key={cx}
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill="hsl(var(--primary))"
                        strokeWidth={0}
                      />
                    );
                  }}
                  connectNulls
                />
                {/* Predicted Median */}
                <Line
                  name="Predicted Median Progression"
                  type="monotone"
                  dataKey="projected"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 4, strokeWidth: 0 }}
                  connectNulls
                />
                {/* Upper Confidence Band */}
                <Line
                  name="Optimistic Upper Bound"
                  type="monotone"
                  dataKey="upper"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                  connectNulls
                />
                {/* Lower Confidence Band */}
                <Line
                  name="Pessimistic Lower Bound"
                  type="monotone"
                  dataKey="lower"
                  stroke="#ec4899"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Model Definition Card */}
      <Card className="border-border bg-card/30 backdrop-blur-md">
        <CardContent className="p-4 flex gap-3 text-xs leading-relaxed select-none">
          <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-foreground">Mathematical Forecasting Logic Overview</h4>
            {forecastMethod === 'ols' ? (
              <p className="text-muted-foreground">
                This predictive engine runs an Ordinary Least Squares (OLS) Linear Regression model:{' '}
                <code className="text-primary font-bold">y = mx + c</code>. The slope parameters (m)
                and intercept (c) are computed by parsing consolidated snapshots in the historical
                snapshot database. Confidence intervals are calculated using standard error margins
                factored by the z-score coefficient corresponding to chosen parameters. The boundary
                width increases proportionally to{' '}
                <code className="text-primary font-semibold">√t</code> to reflect the compounding of
                operational variance over future timelines.
              </p>
            ) : (
              <p className="text-muted-foreground">
                This predictive engine runs a **Holt-Winters Double Exponential Smoothing** model to
                model level and trend sequences. Level factors are recursively smoothed using
                coefficient <code className="text-primary font-bold">α = 0.5</code>, while trend
                slopes are smoothed using coefficient{' '}
                <code className="text-primary font-bold">β = 0.3</code>. Standard error deviations
                are computed over historical variances, and bounds widen proportionally to{' '}
                <code className="text-primary font-semibold">√t</code>. Standard standard deviation
                formulas are run to isolate billing anomaly coordinates in historical data.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
