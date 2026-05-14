/**
 * Badge with close component
 * Closable badge/tag
 */

'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface BadgeWithCloseProps {
  label: string;
  onClose: () => void;
  variant?: 'default' | 'secondary' | 'outline';
  className?: string;
}

export function BadgeWithClose({ label, onClose, variant = 'default', className }: BadgeWithCloseProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium',
        variant === 'default' && 'border-transparent bg-primary text-primary-foreground',
        variant === 'secondary' && 'border-transparent bg-secondary text-secondary-foreground',
        variant === 'outline' && 'border-border',
        className
      )}
    >
      {label}
      <button
        onClick={onClose}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/20"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
