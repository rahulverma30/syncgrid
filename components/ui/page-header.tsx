/**
 * PageHeader component — enhanced with sticky option, compact mode,
 * breadcrumb slot, and consistent vertical spacing.
 */

'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
  className?: string;
  /** Pins the header at top with backdrop-blur on scroll */
  sticky?: boolean;
  /** Smaller heading for secondary/sub pages */
  compact?: boolean;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  breadcrumb,
  className,
  sticky = false,
  compact = false,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 border-b border-border pb-6 mb-6',
        'sm:flex-row sm:items-start sm:justify-between',
        sticky &&
          'sticky top-16 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 -mx-4 px-4 sm:-mx-6 sm:px-6',
        className
      )}
    >
      <div className="space-y-1.5 min-w-0">
        {/* Breadcrumb slot */}
        {breadcrumb && <div className="mb-1">{breadcrumb}</div>}

        {/* Eyebrow label */}
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {eyebrow}
          </p>
        )}

        {/* Title */}
        <h1
          className={cn(
            'font-semibold tracking-tight text-foreground truncate',
            compact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'
          )}
        >
          {title}
        </h1>

        {/* Description */}
        {description && (
          <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>

      {/* Actions slot */}
      {actions && <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
