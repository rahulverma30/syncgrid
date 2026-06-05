/**
 * Card components — Premium dark surfaces.
 * Clean hierarchy, minimal borders, executive-quality KPIs.
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
  default: 'rounded-xl border border-border/40 bg-card shadow-sm',
  elevated: 'rounded-xl border border-border/50 bg-card shadow-lg shadow-black/20',
  flat: 'rounded-xl bg-muted/20 border border-border/20',
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
          'cursor-pointer transition-all duration-200 hover:border-border/70 hover:shadow-md hover:-translate-y-px active:scale-[0.99]',
        highlighted && `border-l-2 ${highlightColor}`,
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
  return <div className={cn('flex flex-col space-y-1 px-5 pt-5 pb-4', className)}>{children}</div>;
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}
export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h2 className={cn('text-[15px] font-semibold leading-none tracking-tight', className)}>
      {children}
    </h2>
  );
}

interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}
export function CardDescription({ children, className }: CardDescriptionProps) {
  return <p className={cn('text-[13px] text-muted-foreground mt-0.5', className)}>{children}</p>;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}
export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn('px-5 pb-5', className)}>{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}
export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn('flex items-center border-t border-border/30 px-5 py-3.5', className)}>
      {children}
    </div>
  );
}

/**
 * CardStat — Executive KPI metric card
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
        'rounded-xl border border-border/40 bg-card p-5 space-y-3 shadow-sm hover:border-border/70 hover:shadow-md transition-all duration-200',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </p>
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
      <p className="text-[28px] font-bold tracking-tight text-foreground leading-none">{value}</p>
      {change && (
        <p
          className={cn(
            'text-xs font-semibold',
            change.positive ? 'text-emerald-400' : 'text-red-400'
          )}
        >
          {change.positive ? '↑' : '↓'} {change.value}
        </p>
      )}
    </div>
  );
}
