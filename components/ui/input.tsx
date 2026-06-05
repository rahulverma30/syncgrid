/**
 * Input component — enhanced with required indicator, success state,
 * character counter, size variants, and proper label association.
 */

'use client';

import { ReactNode, useId } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  success?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  iconButton?: boolean;
  iconButtonAriaLabel?: string;
  onIconClick?: React.MouseEventHandler<HTMLButtonElement>;
  inputSize?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

const sizeClasses = {
  sm: 'h-8 text-xs px-2.5',
  md: 'h-10 text-sm px-3',
  lg: 'h-12 text-base px-4',
};

export function Input({
  className,
  label,
  error,
  hint,
  success,
  icon,
  iconPosition = 'left',
  iconButton,
  iconButtonAriaLabel,
  onIconClick,
  inputSize = 'md',
  showCount,
  required,
  maxLength,
  value,
  id,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const currentLength = typeof value === 'string' ? value.length : 0;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-0.5 select-none"
        >
          {label}
          {required && (
            <span className="text-destructive text-xs leading-none" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 flex items-center text-muted-foreground pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          required={required}
          maxLength={maxLength}
          value={value}
          className={cn(
            'flex w-full rounded-lg border border-input bg-background/50 text-foreground shadow-sm transition-all',
            'placeholder:text-muted-foreground/60',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring',
            'hover:border-input/80 hover:bg-background',
            'disabled:cursor-not-allowed disabled:opacity-50',
            sizeClasses[inputSize],
            icon && iconPosition === 'left' && 'pl-10',
            icon && iconPosition === 'right' && 'pr-10',
            error
              ? 'border-destructive focus-visible:ring-destructive/50'
              : success
                ? 'border-green-500 focus-visible:ring-green-500/50'
                : 'border-input',
            className
          )}
          {...props}
        />
        {icon &&
          iconPosition === 'right' &&
          (iconButton ? (
            <button
              type="button"
              onClick={onIconClick}
              aria-label={iconButtonAriaLabel}
              className="absolute right-3 flex items-center text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              {icon}
            </button>
          ) : (
            <div className="absolute right-3 flex items-center text-muted-foreground pointer-events-none">
              {icon}
            </div>
          ))}
      </div>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          {error && <p className="text-xs text-destructive">{error}</p>}
          {success && !error && (
            <p className="text-xs text-green-600 dark:text-green-400">{success}</p>
          )}
          {hint && !error && !success && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {showCount && maxLength && (
          <p
            className={cn(
              'text-xs shrink-0 tabular-nums',
              currentLength >= maxLength ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {currentLength}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}
