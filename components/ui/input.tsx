/**
 * Input component
 * Reusable form input
 */

'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

export function Input({
  className,
  label,
  error,
  hint,
  icon,
  iconPosition = 'left',
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      <div className="relative flex items-center">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 flex items-center text-muted-foreground pointer-events-none">
            {icon}
          </div>
        )}
        <input
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            icon && iconPosition === 'left' && 'pl-10',
            icon && iconPosition === 'right' && 'pr-10',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          {...props}
        />
        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 flex items-center text-muted-foreground pointer-events-none">
            {icon}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
