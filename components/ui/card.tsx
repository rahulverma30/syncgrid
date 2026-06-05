/**
 * Card components — enhanced with variant prop, highlighted accent,
 * micro-lift interaction, and CardStat sub-component for KPIs.
 */

'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type CardVariant = 'default' | 'elevated' | 'flat' | 'outlined';

interface CardProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  variant?: CardVariant;
  /** Adds a left-border accent for status/highlight cards */
  highlighted?: boolean;
  highlightColor?: string;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'rounded-xl border border-border/60 bg-card/95 shadow-sm backdrop-blur-sm',
  elevated: 'rounded-xl border border-border/80 bg-card/95 shadow-lg backdrop-blur-md',
  flat: 'rounded-xl bg-muted/30 border border-transparent',
  outlined: 'rounded-xl border border-border bg-transparent',
};

export function Card({
  children,
  className,
  interactive = false,
  variant = 'default',
  highlighted = false,
  highlightColor = 'border-l-primary',
}: CardProps) {
  return (
    <div
      className={cn(
        variantClasses[variant],
        'text-card-foreground',
        interactive &&
          'cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-px active:scale-[0.99]',
        highlighted && `border-l-4 ${highlightColor}`,
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}
export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('flex flex-col space-y-1.5 border-b border-border p-6', className)}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}
export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)}>
      {children}
    </h2>
  );
}

interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}
export function CardDescription({ children, className }: CardDescriptionProps) {
  return <p className={cn('text-sm text-muted-foreground', className)}>{children}</p>;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}
export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn('p-6 pt-4', className)}>{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}
export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn('flex items-center border-t border-border p-6 pt-4', className)}>
      {children}
    </div>
  );
}

/**
 * CardStat — KPI metric display card sub-component
 */
interface CardStatProps {
  label: string;
  value: ReactNode;
  change?: {
    value: string;
    positive?: boolean;
  };
  icon?: ReactNode;
  className?: string;
}

export function CardStat({ label, value, change, icon, className }: CardStatProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 space-y-4 shadow-sm hover:shadow-md transition-all duration-300',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
      <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
      {change && (
        <p
          className={cn(
            'text-xs font-medium',
            change.positive
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          )}
        >
          {change.positive ? '↑' : '↓'} {change.value}
        </p>
      )}
    </div>
  );
}
