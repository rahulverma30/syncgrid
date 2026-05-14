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
            'h-5 w-5 rounded-md border border-input flex items-center justify-center transition-colors',
            checked ? 'bg-primary border-primary' : 'bg-background'
          )}
        >
          {checked && <Check className="h-3 w-3 text-primary-foreground" />}
        </div>
      </div>
      {label && <label className="text-sm font-medium cursor-pointer select-none">{label}</label>}
    </div>
  );
}
