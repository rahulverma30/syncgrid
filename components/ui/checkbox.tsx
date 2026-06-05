/**
 * Checkbox component
 * Reusable form checkbox
 */

'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Check } from 'lucide-react';

interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'onChange'
> {
  label?: string;
  onChange?: (checked: boolean) => void;
  checked?: boolean;
}

export function Checkbox({ label, onChange, checked, className, ...props }: CheckboxProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          className="sr-only"
          {...props}
        />
        <div
          className={cn(
            'h-4 w-4 rounded-[4px] border border-input flex items-center justify-center transition-all duration-200 shadow-sm',
            checked
              ? 'bg-primary border-primary text-primary-foreground'
              : 'bg-background hover:bg-accent/40',
            className
          )}
        >
          {checked && <Check className="h-3 w-3" />}
        </div>
      </div>
      {label && (
        <label className="text-xs font-medium text-foreground cursor-pointer select-none leading-none">
          {label}
        </label>
      )}
    </div>
  );
}
