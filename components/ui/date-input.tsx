/**
 * DateInput — Dark-theme-native date input component.
 * Replaces all native <input type="date"> instances to ensure
 * proper dark-mode styling across every browser.
 *
 * Uses `color-scheme: dark` to force the native date picker chrome
 * into dark mode, combined with custom Tailwind styling that matches
 * the SyncGrid input design system.
 */
'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/cn';
import { Calendar } from 'lucide-react';

interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, label, error, wrapperClassName, id, ...props }, ref) => {
    const inputId = id || `date-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className={cn('flex flex-col gap-1', wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60 z-10" />
          <input
            ref={ref}
            id={inputId}
            type="date"
            style={{ colorScheme: 'dark' }}
            className={cn(
              // Base sizing & typography
              'h-9 w-full rounded-md pl-9 pr-3 py-2 text-sm font-medium',
              // Dark-mode background matching card surface
              'bg-input border border-border/60',
              // Text colours
              'text-foreground placeholder:text-muted-foreground/50',
              // Focus ring consistent with other inputs
              'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0',
              // Transition
              'transition-colors duration-150',
              // Error state
              error && 'border-destructive focus-visible:ring-destructive',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-destructive font-medium">{error}</p>}
      </div>
    );
  }
);

DateInput.displayName = 'DateInput';
