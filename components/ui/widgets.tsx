'use client';

import React from 'react';
import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';
import { Card, CardContent } from './card';
import { ActivityCard } from './advanced-card';
import { ArrowUpRight, ArrowDownRight, Award, Zap, Shield, HelpCircle } from 'lucide-react';
import { MetricText, MutedText } from './typography';

interface WidgetProps {
  title: string;
  className?: string;
}

/**
 * KPIWidget with trending indicators and linear progress tracks
 */
interface KPIWidgetProps extends WidgetProps {
  value: string | number;
  trend: number; // positive or negative
  trendLabel?: string;
  progress?: number; // 0 to 100
  color?: 'primary' | 'success' | 'warning' | 'info';
}

export function KPIWidget({
  title,
  value,
  trend,
  trendLabel = 'vs last quarter',
  progress,
  color = 'primary',
  className,
}: KPIWidgetProps) {
  const isPositive = trend >= 0;

  const trackColor = {
    primary: 'bg-primary',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
  }[color];

  return (
    <Card
      className={cn(
        'relative overflow-hidden bg-card/60 backdrop-blur-md border border-border/80',
        className
      )}
    >
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
            {title}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold font-mono',
              isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
            )}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {isPositive ? '+' : ''}
            {trend}%
          </span>
        </div>

        <div className="space-y-1">
          <MetricText>{value}</MetricText>
          <p className="text-[10px] text-muted-foreground/85 font-medium">{trendLabel}</p>
        </div>

        {progress !== undefined && (
          <div className="space-y-1 pt-1.5">
            <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={cn('h-full rounded-full', trackColor)}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground/80">
              <span>Goal Progress</span>
              <span>{progress}%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface RadialProgressProps extends WidgetProps {
  percentage: number;
  valueLabel?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

/**
 * ProgressCircleWidget rendering dynamic SVG radial percentage outlines
 */
export function ProgressCircleWidget({
  title,
  percentage,
  valueLabel,
  subtitle,
  icon,
  className,
}: RadialProgressProps) {
  const radius = 32;
  const strokeWidth = 6.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Card
      className={cn(
        'relative overflow-hidden bg-card/60 backdrop-blur-md border border-border/80 p-6',
        className
      )}
    >
      <div className="flex items-center justify-between gap-4 select-none text-left">
        <div className="space-y-2.5 flex-1">
          <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase block">
            {title}
          </span>
          <div className="space-y-0.5">
            <h3 className="text-2xl font-black font-mono tracking-tight text-foreground">
              {valueLabel || `${percentage}%`}
            </h3>
            {subtitle && <MutedText className="text-xs">{subtitle}</MutedText>}
          </div>
        </div>

        {/* Circular Indicator */}
        <div className="relative flex items-center justify-center flex-shrink-0">
          <svg className="h-20 w-20 transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r={radius}
              strokeWidth={strokeWidth}
              className="stroke-muted/40 fill-none"
            />
            <motion.circle
              cx="40"
              cy="40"
              r={radius}
              strokeWidth={strokeWidth}
              className="stroke-primary fill-none"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>
          {icon && <div className="absolute text-primary/80">{icon}</div>}
        </div>
      </div>
    </Card>
  );
}

interface MiniChartWidgetProps extends WidgetProps {
  value: string;
  points: number[];
  color?: string;
}

/**
 * DynamicMetricWidget bundling miniature HSL visual sparklines
 */
export function DynamicMetricWidget({
  title,
  value,
  points,
  color = 'currentColor',
  className,
}: MiniChartWidgetProps) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;

  const width = 120;
  const height = 40;
  const padding = 2;

  const svgPoints = points
    .map((p, idx) => {
      const x = (idx / (points.length - 1)) * (width - padding * 2) + padding;
      const y = height - ((p - min) / range) * (height - padding * 2) - padding;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <Card
      className={cn(
        'relative overflow-hidden bg-card/60 backdrop-blur-md border border-border/80 p-6',
        className
      )}
    >
      <div className="flex items-center justify-between gap-4 select-none text-left">
        <div className="space-y-1.5 flex-grow">
          <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
            {title}
          </span>
          <h3 className="text-2xl font-black font-mono tracking-tight text-foreground">{value}</h3>
        </div>

        {/* Sparkline Visual */}
        <div className="flex-shrink-0">
          <svg width={width} height={height} className="overflow-visible">
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={svgPoints}
            />
          </svg>
        </div>
      </div>
    </Card>
  );
}
