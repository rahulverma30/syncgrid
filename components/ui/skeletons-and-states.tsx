'use client';

import React from 'react';
import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';
import { Inbox, Compass, Search, Info, Plus } from 'lucide-react';
import { Button } from './button';

/**
 * Reusable Card Skeleton
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-6 space-y-4 animate-pulse select-none',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-6 bg-muted rounded w-6 rounded-full" />
      </div>
      <div className="h-8 bg-muted rounded w-2/3" />
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded w-5/6" />
        <div className="h-3 bg-muted rounded w-4/6" />
      </div>
    </div>
  );
}

/**
 * Reusable Table Row Skeleton
 */
export function TableSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div
      className={cn(
        'w-full border border-border rounded-lg bg-card overflow-hidden animate-pulse select-none',
        className
      )}
    >
      <div className="bg-muted/40 border-b border-border h-12 flex items-center px-4 gap-4">
        <div className="h-4 bg-muted rounded w-8" />
        <div className="h-4 bg-muted rounded w-1/4" />
        <div className="h-4 bg-muted rounded w-1/5" />
        <div className="h-4 bg-muted rounded w-1/6" />
        <div className="h-4 bg-muted rounded w-12 ml-auto" />
      </div>
      <div className="divide-y divide-border/60">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="h-14 flex items-center px-4 gap-4">
            <div className="h-4 bg-muted rounded w-4" />
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-4 bg-muted rounded w-1/6" />
            <div className="h-8 bg-muted rounded w-8 rounded-full ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Reusable Chart Area Skeleton
 */
export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-6 space-y-6 animate-pulse select-none',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1.5 w-1/3">
          <div className="h-4 bg-muted rounded" />
          <div className="h-3 bg-muted rounded w-2/3" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 bg-muted rounded w-12" />
          <div className="h-6 bg-muted rounded w-12" />
        </div>
      </div>
      {/* Simulation of bar/area spikes */}
      <div className="h-48 w-full flex items-end gap-3 pt-6 border-b border-l border-muted/50 pl-3 pb-2">
        <div className="h-[25%] bg-muted rounded-t-md flex-1" />
        <div className="h-[65%] bg-muted rounded-t-md flex-1" />
        <div className="h-[45%] bg-muted rounded-t-md flex-1" />
        <div className="h-[85%] bg-muted rounded-t-md flex-1" />
        <div className="h-[55%] bg-muted rounded-t-md flex-1" />
        <div className="h-[30%] bg-muted rounded-t-md flex-1" />
        <div className="h-[75%] bg-muted rounded-t-md flex-1" />
      </div>
    </div>
  );
}

/**
 * Reusable Premium EmptyState Component
 */
interface EmptyStateProps {
  title: string;
  description: string;
  type?: 'inbox' | 'search' | 'explore' | 'info';
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function PremiumEmptyState({
  title,
  description,
  type = 'inbox',
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const iconMap = {
    inbox: <Inbox className="h-8 w-8 text-muted-foreground/60" />,
    search: <Search className="h-8 w-8 text-muted-foreground/60" />,
    explore: <Compass className="h-8 w-8 text-muted-foreground/60" />,
    info: <Info className="h-8 w-8 text-muted-foreground/60" />,
  }[type];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm shadow-inner min-h-[300px] select-none',
        className
      )}
    >
      <div className="h-16 w-16 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground shadow-sm mb-4">
        {iconMap}
      </div>
      <h3 className="text-base font-bold text-foreground tracking-tight">{title}</h3>
      <p className="text-xs text-muted-foreground/80 max-w-sm mt-1 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-5 h-9 text-xs gap-1.5 select-none font-semibold">
          <Plus className="h-4 w-4 text-current" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
