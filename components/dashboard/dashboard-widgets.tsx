'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/ui/skeletons-and-states';

interface DashboardWidgetProps {
  title: string;
  description?: string;
  colSpan?: 1 | 2 | 3 | 4;
  isLoading?: boolean;
  isEmpty?: boolean;
  onRefresh?: () => void;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DashboardWidget({
  title,
  description,
  colSpan = 1,
  isLoading = false,
  isEmpty = false,
  onRefresh,
  headerActions,
  children,
  className,
}: DashboardWidgetProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      // Small artificial visual delay to show dynamic activity
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  const spanClasses = {
    1: 'col-span-1',
    2: 'col-span-1 md:col-span-2',
    3: 'col-span-1 lg:col-span-3',
    4: 'col-span-1 xl:col-span-4',
  };

  return (
    <Card
      className={cn(
        'flex flex-col h-full bg-card/40 border border-border/80 backdrop-blur-sm shadow-sm overflow-hidden select-none hover:shadow-md transition-shadow relative',
        spanClasses[colSpan],
        className
      )}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-border/40 p-4 bg-muted/10">
        <div className="space-y-0.5 text-left flex-1 min-w-0 pr-3">
          <h3 className="text-sm font-bold tracking-tight text-foreground truncate">{title}</h3>
          {description && (
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              className="h-7 w-7 rounded-md hover:bg-accent/40"
              aria-label="Refresh widget data"
            >
              <RefreshCw
                className={cn(
                  'h-3.5 w-3.5 text-muted-foreground',
                  isRefreshing && 'animate-spin text-primary'
                )}
              />
            </Button>
          )}
          {headerActions}
        </div>
      </div>

      {/* Widget Body Content */}
      <div className="flex-1 p-4 relative">
        {isLoading ? (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <CardSkeleton className="w-full h-full border-none bg-transparent shadow-none" />
          </div>
        ) : null}

        {isEmpty ? (
          <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center p-6 space-y-2">
            <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
              <MoreVertical className="h-5 w-5" />
            </div>
            <h4 className="text-xs font-semibold text-foreground">No data available</h4>
            <p className="text-[10px] text-muted-foreground max-w-[200px]">
              We couldn&apos;t load analytics for this current date selection.
            </p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full">
            {children}
          </motion.div>
        )}
      </div>
    </Card>
  );
}
