'use client';

import React, { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { motion, HTMLMotionProps } from 'framer-motion';

interface TypographyProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}

/**
 * Premium PageTitle Heading
 */
export function PageTitle({ children, className, as: Component = 'h1' }: TypographyProps) {
  return (
    <Component
      className={cn(
        'text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl',
        'bg-clip-text transition-all duration-300',
        className
      )}
    >
      {children}
    </Component>
  );
}

/**
 * Premium SectionTitle Heading
 */
export function SectionTitle({ children, className, as: Component = 'h2' }: TypographyProps) {
  return (
    <Component
      className={cn(
        'text-xl font-bold tracking-tight text-foreground sm:text-2xl md:text-3xl',
        className
      )}
    >
      {children}
    </Component>
  );
}

/**
 * MutedText Annotation Layout
 */
export function MutedText({ children, className, as: Component = 'p' }: TypographyProps) {
  return (
    <Component
      className={cn('text-sm text-muted-foreground md:text-base leading-relaxed', className)}
    >
      {children}
    </Component>
  );
}

/**
 * CaptionText Tiny Info Labels
 */
export function CaptionText({ children, className, as: Component = 'span' }: TypographyProps) {
  return (
    <Component
      className={cn(
        'text-xs font-medium text-muted-foreground/80 tracking-wide uppercase',
        className
      )}
    >
      {children}
    </Component>
  );
}

/**
 * MetricText Large Key Statistics
 */
export function MetricText({ children, className, as: Component = 'div' }: TypographyProps) {
  return (
    <Component
      className={cn(
        'text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl font-mono',
        className
      )}
    >
      {children}
    </Component>
  );
}

interface GradientTextProps extends TypographyProps {
  from?: string;
  to?: string;
  animate?: boolean;
}

/**
 * Premium Metallic GradientText displaying key highlights
 */
export function GradientText({
  children,
  className,
  as: Component = 'span',
  from = 'from-primary via-primary/80 to-muted-foreground',
  to,
  animate = false,
}: GradientTextProps) {
  const defaultGradient = to ? `bg-gradient-to-r ${from} ${to}` : `bg-gradient-to-r ${from}`;

  if (animate) {
    const motionProps = {
      animate: { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] },
      transition: { duration: 8, ease: 'easeInOut', repeat: Infinity },
    } as HTMLMotionProps<'span'>;

    return (
      <motion.span
        {...motionProps}
        style={{ backgroundSize: '200% auto' }}
        className={cn(
          'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent font-extrabold',
          className
        )}
      >
        {children}
      </motion.span>
    );
  }

  return (
    <Component
      className={cn(
        'bg-clip-text text-transparent font-extrabold bg-cover bg-no-repeat',
        defaultGradient,
        className
      )}
    >
      {children}
    </Component>
  );
}
