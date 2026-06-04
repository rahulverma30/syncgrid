/**
 * EmptyState component — enhanced with variant prop, icon fallback,
 * gradient background, and clear CTA affordance.
 */

'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Inbox, SearchX, AlertTriangle } from 'lucide-react';

type EmptyStateVariant = 'default' | 'search' | 'error' | 'compact';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: EmptyStateVariant;
  badge?: string;
}

const defaultIcons: Record<EmptyStateVariant, ReactNode> = {
  default: <Inbox className="h-10 w-10 text-muted-foreground/50" />,
  search: <SearchX className="h-10 w-10 text-muted-foreground/50" />,
  error: <AlertTriangle className="h-10 w-10 text-destructive/50" />,
  compact: <Inbox className="h-6 w-6 text-muted-foreground/50" />,
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  variant = 'default',
  badge,
}: EmptyStateProps) {
  const isCompact = variant === 'compact';
  const resolvedIcon = icon ?? defaultIcons[variant];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        isCompact ? 'py-8 gap-2' : 'py-16 gap-4',
        className
      )}
    >
      {/* Icon container */}
      {resolvedIcon && (
        <div
          className={cn(
            'flex items-center justify-center rounded-2xl border border-border/50',
            'bg-gradient-to-b from-muted/50 to-muted/20',
            isCompact ? 'h-12 w-12' : 'h-16 w-16'
          )}
        >
          {resolvedIcon}
        </div>
      )}

      {/* Badge */}
      {badge && (
        <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {badge}
        </span>
      )}

      {/* Text */}
      <div className="space-y-1.5">
        <h3 className={cn('font-semibold text-foreground', isCompact ? 'text-sm' : 'text-base')}>
          {title}
        </h3>
        {description && (
          <p
            className={cn(
              'text-muted-foreground leading-relaxed max-w-sm mx-auto',
              isCompact ? 'text-xs' : 'text-sm'
            )}
          >
            {description}
          </p>
        )}
      </div>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-2 mt-1">
          {action && (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-1.5 justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {action.icon}
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
