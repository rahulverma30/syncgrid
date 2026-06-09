'use client';

import React from 'react';
import { cn } from '@/lib/cn';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Database } from 'lucide-react';

// Global Chart Palette synchronized to standard theme HSL rules
const CHART_THEME_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--info))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
];

/**
 * Reusable Empty Chart State
 */
function EmptyChartState({ height }: { height: number }) {
  return (
    <div
      style={{ height }}
      className="w-full flex flex-col items-center justify-center border border-dashed border-border/50 rounded-lg bg-card/10 select-none space-y-3"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/40 ring-1 ring-border/50">
        <Database className="h-4 w-4 text-muted-foreground opacity-50" />
      </div>
      <div className="text-center">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          No Data Available
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
          Insufficient records for this period
        </p>
      </div>
    </div>
  );
}

interface BaseChartProps {
  data: any[];
  xKey: string;
  className?: string;
  height?: number;
}

/**
 * Custom Tooltip component providing unified popovers
 */
function CustomHTMLTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-popover/90 backdrop-blur-md p-3.5 shadow-xl select-none text-left min-w-[120px]">
        {label && (
          <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase mb-1.5">
            {label}
          </p>
        )}
        <div className="space-y-1">
          {payload.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color || item.fill }}
                />
                {item.name}
              </span>
              <span className="font-mono font-bold text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

/**
 * AreaChartWrapper using premium filled gradient shapes
 */
interface AreaChartProps extends BaseChartProps {
  metrics: { key: string; label: string; color?: string }[];
}

export function AreaChartWrapper({ data, xKey, metrics, height = 300, className }: AreaChartProps) {
  if (!data || data.length === 0) return <EmptyChartState height={height} />;

  return (
    <div
      style={{ width: '100%', height }}
      className={cn('select-none text-xs font-mono', className)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
          <defs>
            {metrics.map((m, idx) => {
              const color = m.color || CHART_THEME_COLORS[idx % CHART_THEME_COLORS.length];
              return (
                <linearGradient key={m.key} id={`gradient-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
          <XAxis
            dataKey={xKey}
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
            tickFormatter={(value) => `$${value / 1000}K`}
            dx={-8}
          />
          <Tooltip
            content={<CustomHTMLTooltip />}
            cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            iconSize={8}
            className="text-muted-foreground text-[10px]"
            wrapperStyle={{ paddingBottom: '20px' }}
          />
          {metrics.map((m, idx) => {
            const color = m.color || CHART_THEME_COLORS[idx % CHART_THEME_COLORS.length];
            return (
              <Area
                key={m.key}
                name={m.label}
                type="monotone"
                dataKey={m.key}
                stroke={color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#gradient-${m.key})`}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * BarChartWrapper rendering beautiful rounded dashboard pillars
 */
interface BarChartProps extends BaseChartProps {
  metrics: { key: string; label: string; color?: string }[];
}

export function BarChartWrapper({ data, xKey, metrics, height = 300, className }: BarChartProps) {
  if (!data || data.length === 0) return <EmptyChartState height={height} />;

  return (
    <div
      style={{ width: '100%', height }}
      className={cn('select-none text-xs font-mono', className)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
          <XAxis
            dataKey={xKey}
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
          <Tooltip
            content={<CustomHTMLTooltip />}
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            iconSize={8}
            className="text-muted-foreground text-[10px]"
            wrapperStyle={{ paddingBottom: '20px' }}
          />
          {metrics.map((m, idx) => {
            const color = m.color || CHART_THEME_COLORS[idx % CHART_THEME_COLORS.length];
            return (
              <Bar
                key={m.key}
                name={m.label}
                dataKey={m.key}
                fill={color}
                radius={[4, 4, 0, 0]}
                maxBarSize={45}
              />
            );
          })}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * LineChartWrapper displaying smooth analytic nodes
 */
interface LineChartProps extends BaseChartProps {
  metrics: { key: string; label: string; color?: string }[];
}

export function LineChartWrapper({ data, xKey, metrics, height = 300, className }: LineChartProps) {
  if (!data || data.length === 0) return <EmptyChartState height={height} />;

  return (
    <div
      style={{ width: '100%', height }}
      className={cn('select-none text-xs font-mono', className)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
          <XAxis
            dataKey={xKey}
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
          <Tooltip
            content={<CustomHTMLTooltip />}
            cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            iconSize={8}
            className="text-muted-foreground text-[10px]"
            wrapperStyle={{ paddingBottom: '20px' }}
          />
          {metrics.map((m, idx) => {
            const color = m.color || CHART_THEME_COLORS[idx % CHART_THEME_COLORS.length];
            return (
              <Line
                key={m.key}
                name={m.label}
                type="monotone"
                dataKey={m.key}
                stroke={color}
                strokeWidth={2.5}
                activeDot={{ r: 6, strokeWidth: 0 }}
                dot={{ r: 3, strokeWidth: 0 }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * PieChartWrapper charting circular distribution ratios
 */
interface PieChartProps {
  data: { name: string; value: number; color?: string }[];
  height?: number;
  className?: string;
}

export function PieChartWrapper({ data, height = 300, className }: PieChartProps) {
  if (!data || data.length === 0) return <EmptyChartState height={height} />;

  return (
    <div
      style={{ width: '100%', height }}
      className={cn('select-none text-xs font-mono flex items-center justify-center', className)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={85}
            paddingAngle={3.5}
            dataKey="value"
          >
            {data.map((entry, idx) => {
              const color = entry.color || CHART_THEME_COLORS[idx % CHART_THEME_COLORS.length];
              return (
                <Cell
                  key={`cell-${idx}`}
                  fill={color}
                  className="stroke-card hover:opacity-90 transition-opacity"
                  strokeWidth={2}
                />
              );
            })}
          </Pie>
          <Tooltip content={<CustomHTMLTooltip />} />
          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            iconSize={8}
            className="text-muted-foreground text-[10px]"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
