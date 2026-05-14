/**
 * Radio button component
 * Reusable form radio
 */

'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  className?: string;
}

export function RadioGroup({ options, value, onChange, label, error, className }: RadioGroupProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      {options.map((option) => (
        <div key={option.value} className="flex items-start gap-2">
          <div className="relative mt-1">
            <input
              type="radio"
              name={label}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange?.(e.target.value)}
              className="sr-only"
            />
            <div
              className={cn(
                'h-5 w-5 rounded-full border-2 border-input flex items-center justify-center transition-colors',
                value === option.value ? 'border-primary bg-primary' : 'bg-background'
              )}
            >
              {value === option.value && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium cursor-pointer select-none">{option.label}</label>
            {option.description && <p className="text-xs text-muted-foreground">{option.description}</p>}
          </div>
        </div>
      ))}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
