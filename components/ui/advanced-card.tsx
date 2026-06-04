'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { MetricText, MutedText } from './typography';

interface AdvancedCardProps {
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Standard AnalyticsCard wrapping title, descriptions, content, and footers beautifully
 */
interface AnalyticsCardProps extends AdvancedCardProps {
  title: string | ReactNode;
  description?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  isLoading?: boolean;
}

export function AnalyticsCard({
  children,
  className,
  title,
  description,
  actions,
  footer,
  isLoading = false,
  onClick,
}: AnalyticsCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-lg border border-border bg-card text-card-foreground shadow-sm relative overflow-hidden bg-card/60 backdrop-blur-md border border-border/80 transition-all duration-300',
        onClick && 'cursor-pointer hover:border-border-hover hover:shadow-md active:scale-[0.99]',
        className
      )}
    >
      <div className="flex flex-col space-y-1.5 border-b border-border p-6 flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1 flex-1 text-left">
          {typeof title === 'string' ? (
            <h2 className="text-base font-bold tracking-tight">{title}</h2>
          ) : (
            title
          )}
          {description && <p className="text-xs text-muted-foreground/80">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="p-6 pt-4 pb-4">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        ) : (
          children
        )}
      </div>
      {footer && (
        <div className="flex items-center border-t border-border p-6 pt-4 border-t border-border/40 pt-4 text-xs text-muted-foreground">
          {footer}
        </div>
      )}
    </div>
  );
}

/**
 * MetricCard dedicated to showing huge visual numeric statistics
 */
interface MetricCardProps extends AdvancedCardProps {
  title: string;
  value: string | number;
  trend?: number; // e.g. 12.5 (positive) or -4.2 (negative)
  trendLabel?: string; // e.g. "vs last month"
  description?: string;
  icon?: ReactNode;
  progress?: number; // percentage value between 0 and 100 for progress indicators
  isLoading?: boolean;
}

export function MetricCard({
  title,
  value,
  trend,
  trendLabel,
  icon,
  progress,
  className,
  description,
  isLoading = false,
  onClick,
}: MetricCardProps) {
  const isPositive = trend && trend >= 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-lg border border-border bg-card text-card-foreground shadow-sm relative overflow-hidden bg-card/70 backdrop-blur-md border border-border/80 transition-all duration-300',
        onClick && 'cursor-pointer hover:border-border-hover hover:shadow-md active:scale-[0.99]',
        className
      )}
    >
      <div className="p-6 space-y-4">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between space-y-0 text-left">
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {title}
              </span>
              {icon && <div className="text-primary/70">{icon}</div>}
            </div>

            <div className="space-y-1 text-left">
              <MetricText>{value}</MetricText>
              {(trend !== undefined || trendLabel) && (
                <div className="flex items-center gap-1.5 text-xs">
                  {trend !== undefined && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-semibold font-mono',
                        isPositive
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-destructive/10 text-destructive'
                      )}
                    >
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {isPositive ? '+' : ''}
                      {trend}%
                    </span>
                  )}
                  {trendLabel && <span className="text-muted-foreground/80">{trendLabel}</span>}
                </div>
              )}
              {description && (
                <div className="text-xs text-muted-foreground/80 pt-0.5">{description}</div>
              )}
            </div>

            {progress !== undefined && (
              <div className="space-y-1.5 pt-1 text-left">
                <div className="h-1.5 w-full rounded-full bg-muted/65 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground/80 font-mono">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * ActivityCard representing transaction blocks, log lists, or dynamic workflows
 */
interface ActivityCardProps extends AdvancedCardProps {
  title: string;
  subtitle?: string;
  time?: string;
  status?: 'success' | 'warning' | 'error' | 'info';
}

export function ActivityCard({
  title,
  subtitle,
  time,
  status = 'info',
  className,
  onClick,
}: ActivityCardProps) {
  const statusColor = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
    info: 'bg-blue-500',
  }[status];

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-lg border border-border bg-card text-card-foreground shadow-sm relative overflow-hidden bg-card/40 backdrop-blur-sm border border-border/40 hover:border-border/80 transition-all duration-200',
        onClick && 'cursor-pointer hover:bg-card/65 active:scale-[0.99]',
        className
      )}
    >
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={cn('h-2 w-2 rounded-full flex-shrink-0 animate-pulse', statusColor)} />
          <div className="space-y-0.5 text-left">
            <h4 className="text-sm font-semibold tracking-tight leading-none text-foreground">
              {title}
            </h4>
            {subtitle && <MutedText className="text-xs leading-none mt-0.5">{subtitle}</MutedText>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 text-right">
          {time && <span className="text-[10px] font-mono text-muted-foreground/80">{time}</span>}
          {onClick && (
            <ArrowRight className="h-4 w-4 text-muted-foreground/50 hover:text-foreground transition-colors" />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * InteractiveCard utilizing Framer Motion spring scaling on cursor hover
 */
export function InteractiveCard({ children, className, onClick }: AdvancedCardProps) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={cn(
        'card card-interactive relative border border-border/80 bg-card/60 backdrop-blur-md shadow-sm hover:shadow-md hover:border-border transition-colors duration-250',
        className
      )}
    >
      {children}
    </motion.div>
  );
}

/**
 * GlassCard providing ultra-premium frosted-glass panels
 */
export function GlassCard({ children, className, onClick }: AdvancedCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-xl border border-white/10 dark:border-white/5 bg-white/5 dark:bg-black/25 backdrop-blur-lg shadow-2xl p-6 transition-all duration-300',
        onClick && 'cursor-pointer hover:bg-white/10 dark:hover:bg-black/35 active:scale-[0.99]',
        className
      )}
    >
      {children}
    </div>
  );
}
