/**
 * Badge component — enhanced with status dot, size variants,
 * semantic variants (pending/active/inactive), and improved dark mode support.
 */

'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { ReactNode } from 'react';
import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/15 text-primary',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-red-500/15 text-red-400',
        success: 'border-transparent bg-emerald-500/15 text-emerald-400',
        warning: 'border-transparent bg-amber-500/15 text-amber-400',
        info: 'border-transparent bg-sky-500/15 text-sky-400',
        outline: 'border-border text-foreground bg-transparent',
        muted: 'border-transparent bg-muted text-muted-foreground',
        // Semantic status variants
        active: 'border-transparent bg-emerald-500/15 text-emerald-400',
        inactive: 'border-transparent bg-muted text-muted-foreground',
        pending: 'border-transparent bg-amber-500/15 text-amber-400',
        blocked: 'border-transparent bg-red-500/15 text-red-400',
      },
      size: {
        sm: 'px-2 py-0 text-[10px]',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const dotColors: Record<string, string> = {
  default: 'bg-primary',
  secondary: 'bg-secondary-foreground',
  destructive: 'bg-red-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
  outline: 'bg-foreground',
  muted: 'bg-muted-foreground',
  active: 'bg-green-500',
  inactive: 'bg-muted-foreground',
  pending: 'bg-yellow-500',
  blocked: 'bg-red-500',
};

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  children: ReactNode;
  dot?: boolean;
}

export function Badge({
  className,
  variant = 'default',
  size,
  children,
  dot,
  ...props
}: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotColors[variant ?? 'default'])}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}
