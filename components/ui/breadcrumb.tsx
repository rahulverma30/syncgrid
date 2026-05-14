/**
 * Breadcrumb component
 * Navigation breadcrumb system
 */

'use client';

import { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn('flex items-center gap-2 text-sm', className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          {item.href && !item.active ? (
            <a href={item.href} className="text-primary hover:underline">
              {item.label}
            </a>
          ) : (
            <span className={item.active ? 'text-foreground font-medium' : 'text-muted-foreground'}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
