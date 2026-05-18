'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import {
  AreaChartWrapper,
  BarChartWrapper,
  LineChartWrapper,
  PieChartWrapper,
} from '@/components/ui/charts';
import { TrendingUp, Activity, PieChart, BarChart2 } from 'lucide-react';

interface ChartWrapperProps {
  type: 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'stacked' | 'metric';
  data: any[];
  xKey?: string;
  metrics?: { key: string; label: string; color?: string }[];
  title?: string;
  subtitle?: string;
  height?: number;
  className?: string;
  metricValue?: string | number;
  metricUnit?: string;
  metricTrending?: 'up' | 'down' | 'neutral';
}

export function ChartWrapper({
  type,
  data,
  xKey = 'label',
  metrics = [],
  title,
  subtitle,
  height = 320,
  className,
  metricValue,
  metricUnit,
  metricTrending = 'neutral',
}: ChartWrapperProps) {
  const containerVariants: any = {
    hidden: { opacity: 0, scale: 0.98, y: 5 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.35, ease: 'easeOut' },
    },
  };

  const getMetricIcon = () => {
    switch (type) {
      case 'pie':
      case 'donut':
        return <PieChart className="h-4 w-4" />;
      case 'bar':
        return <BarChart2 className="h-4 w-4" />;
      case 'area':
        return <Activity className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-card/60 backdrop-blur-md p-5 shadow-sm transition-all hover:shadow-md hover:border-border/80 flex flex-col justify-between',
        className
      )}
    >
      {/* Background radial accent glow to feel high-end */}
      <div className="absolute top-0 right-0 w-64 h-64 -mr-16 -mt-16 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header section */}
      {(title || subtitle) && (
        <div className="flex items-center justify-between mb-6 z-10">
          <div className="space-y-1">
            {title && (
              <h4 className="text-sm font-bold tracking-tight text-foreground/90 flex items-center gap-2">
                {getMetricIcon()}
                {title}
              </h4>
            )}
            {subtitle && <p className="text-xs text-muted-foreground font-medium">{subtitle}</p>}
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="flex-1 flex flex-col justify-center min-h-0 z-10">
        {type === 'metric' ? (
          <div className="flex flex-col py-6">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
                {metricValue ?? '0'}
              </span>
              {metricUnit && (
                <span className="text-sm font-semibold text-muted-foreground">{metricUnit}</span>
              )}
            </div>
            {metricTrending !== 'neutral' && (
              <div
                className={cn(
                  'mt-2 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full w-fit',
                  metricTrending === 'up'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-rose-500/10 text-rose-500'
                )}
              >
                <span>{metricTrending === 'up' ? '▲ Positive MoM' : '▼ Negative Trend'}</span>
              </div>
            )}
          </div>
        ) : data.length === 0 ? (
          <div
            style={{ height }}
            className="flex flex-col items-center justify-center text-center py-10"
          >
            <p className="text-xs text-muted-foreground font-medium">
              No aggregated parameters retrieved in selected filters.
            </p>
          </div>
        ) : type === 'area' ? (
          <AreaChartWrapper data={data} xKey={xKey} metrics={metrics} height={height} />
        ) : type === 'bar' ? (
          <BarChartWrapper data={data} xKey={xKey} metrics={metrics} height={height} />
        ) : type === 'line' ? (
          <LineChartWrapper data={data} xKey={xKey} metrics={metrics} height={height} />
        ) : type === 'pie' || type === 'donut' ? (
          <PieChartWrapper
            data={data.map((item, idx) => ({
              name: item.name || item.label || 'Unassigned',
              value: item.value || item.count || 0,
              color: item.color,
            }))}
            height={height}
          />
        ) : (
          <BarChartWrapper data={data} xKey={xKey} metrics={metrics} height={height} />
        )}
      </div>
    </motion.div>
  );
}
