'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';

interface LayoutProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

/**
 * Top-Level Page Outer Wrapper with entry spring animations
 */
export function PageWrapper({ children, className, id }: LayoutProps) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn('w-full min-h-screen space-y-6', className)}
    >
      {children}
    </motion.div>
  );
}

/**
 * Centered Content Container with responsive width bounds
 */
export function ContentContainer({ children, className, id }: LayoutProps) {
  return (
    <div id={id} className={cn('mx-auto w-full transition-all duration-300', className)}>
      {children}
    </div>
  );
}

/**
 * Section Division with separation paddings and borders
 */
export function SectionContainer({ children, className, id }: LayoutProps) {
  return (
    <section
      id={id}
      className={cn(
        'border-b border-border/60 py-6 sm:py-8 last:border-b-0 space-y-4 transition-all',
        className
      )}
    >
      {children}
    </section>
  );
}

interface DashboardGridProps extends LayoutProps {
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg';
}

/**
 * Dashboard Grid System supporting responsive autolayout columns
 */
export function DashboardGrid({ children, className, cols = 3, gap = 'md' }: DashboardGridProps) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  }[cols];

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-6',
    lg: 'gap-8',
  }[gap];

  return <div className={cn('grid w-full', colClasses, gapClasses, className)}>{children}</div>;
}

interface SplitLayoutProps extends LayoutProps {
  ratio?: 'equal' | 'wide-left' | 'wide-right';
}

/**
 * Split Layouts dividing views into customizable secondary columns
 */
export function SplitLayout({ children, className, ratio = 'equal' }: SplitLayoutProps) {
  const ratioClasses = {
    equal: 'grid-cols-1 lg:grid-cols-2',
    'wide-left': 'grid-cols-1 lg:grid-cols-[2fr_1fr]',
    'wide-right': 'grid-cols-1 lg:grid-cols-[1fr_2fr]',
  }[ratio];

  return <div className={cn('grid w-full gap-6', ratioClasses, className)}>{children}</div>;
}

/**
 * ScrollRegion displaying content lists in clean bounds without ugly browser scrollbars
 */
export function ScrollRegion({ children, className, id }: LayoutProps) {
  return (
    <div
      id={id}
      className={cn(
        'w-full overflow-auto scrollbar-hide scroll-smooth focus:outline-none max-h-[500px]',
        className
      )}
    >
      {children}
    </div>
  );
}
