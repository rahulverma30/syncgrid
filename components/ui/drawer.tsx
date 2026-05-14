/**
 * Drawer/Slide-out component
 * Reusable drawer that slides in from the side
 */

'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  side?: 'left' | 'right';
  className?: string;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  side = 'right',
  className,
}: DrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sideClasses = {
    left: 'left-0 animate-slide-in-right',
    right: 'right-0 animate-slide-out-right',
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          'absolute top-0 h-full w-full max-w-sm rounded-l-lg bg-card shadow-xl overflow-y-auto',
          sideClasses[side],
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-6">
          <div>
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">{children}</div>

        {footer && <div className="border-t border-border p-6">{footer}</div>}
      </div>
    </div>
  );
}
