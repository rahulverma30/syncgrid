'use client';

import React, { ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/cn';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Button } from './button';
import { ChevronDown, Loader2 } from 'lucide-react';
import { DropdownMenu } from './dropdown-menu';

interface AdvancedButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick' | 'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd'
> {
  children: ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isLoading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  icon?: ReactNode;
}

/**
 * Advanced Spring-Animated Motion Button supporting dynamic loading spinners and icons
 */
export const AdvancedButton = forwardRef<HTMLButtonElement, AdvancedButtonProps>(
  (
    {
      children,
      className,
      onClick,
      isLoading = false,
      disabled = false,
      type = 'button',
      variant = 'default',
      size = 'default',
      icon,
      ...props
    },
    ref
  ) => {
    // Map motion variants to Framer Motion tap actions
    const motionProps = {
      whileHover: disabled || isLoading ? {} : { scale: 1.025, y: -1 },
      whileTap: disabled || isLoading ? {} : { scale: 0.975, y: 0 },
      transition: { type: 'spring', stiffness: 450, damping: 25 },
    } as HTMLMotionProps<'button'>;

    return (
      <motion.button
        {...motionProps}
        {...props}
        ref={ref as any}
        type={type}
        disabled={disabled || isLoading}
        onClick={onClick}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer h-10 px-4 py-2 select-none shadow-sm active:scale-[0.98]',
          // Map variants to specific styles
          variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90',
          variant === 'secondary' &&
            'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/40',
          variant === 'outline' &&
            'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
          variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground shadow-none',
          variant === 'destructive' &&
            'bg-destructive text-destructive-foreground hover:bg-destructive/90',
          variant === 'link' && 'text-primary underline-offset-4 hover:underline shadow-none',
          // Map sizes
          size === 'sm' && 'h-9 rounded-md px-3 text-xs',
          size === 'lg' && 'h-11 rounded-md px-8 text-base',
          size === 'icon' && 'h-10 w-10 p-0',
          className
        )}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-current" />
        ) : icon ? (
          <span className="mr-2 inline-flex flex-shrink-0 text-current">{icon}</span>
        ) : null}
        {children}
      </motion.button>
    );
  }
);

AdvancedButton.displayName = 'AdvancedButton';

/**
 * Reusable compact IconButton component
 */
export function IconButton({
  icon,
  className,
  onClick,
  isLoading = false,
  disabled = false,
  variant = 'outline',
  title,
}: Omit<AdvancedButtonProps, 'children' | 'size'> & { icon: ReactNode; title?: string }) {
  return (
    <AdvancedButton
      variant={variant}
      size="icon"
      onClick={onClick}
      isLoading={isLoading}
      disabled={disabled}
      className={cn(
        'rounded-full bg-background border border-border/80 text-muted-foreground hover:text-foreground',
        className
      )}
      title={title}
    >
      {isLoading ? null : icon}
    </AdvancedButton>
  );
}

interface SplitButtonOption {
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

interface SplitButtonProps {
  label: string;
  onClick: () => void;
  options: SplitButtonOption[];
  className?: string;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'secondary' | 'destructive';
}

/**
 * Premium SplitButton combining primary actions with secondary dropdown listings
 */
export function SplitButton({
  label,
  onClick,
  options,
  className,
  isLoading = false,
  disabled = false,
  variant = 'default',
}: SplitButtonProps) {
  const primaryBg = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/95',
    secondary:
      'bg-secondary text-secondary-foreground hover:bg-secondary/90 border border-border/60',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/95',
  }[variant];

  const dropdownItems = options.map((opt) => ({
    label: opt.label,
    onClick: opt.onClick,
    destructive: opt.destructive,
  }));

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md overflow-hidden shadow-sm transition-all',
        className
      )}
    >
      <Button
        onClick={onClick}
        disabled={disabled || isLoading}
        className={cn(
          'rounded-r-none h-10 px-4 py-2 font-semibold text-sm select-none rounded-l-md border-r border-background/25',
          primaryBg
        )}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-current" />}
        {label}
      </Button>

      <DropdownMenu
        trigger={
          <Button
            disabled={disabled || isLoading}
            className={cn('rounded-l-none h-10 w-9 p-0 rounded-r-md select-none', primaryBg)}
          >
            <ChevronDown className="h-4 w-4 text-current" />
          </Button>
        }
        items={dropdownItems}
      />
    </div>
  );
}
