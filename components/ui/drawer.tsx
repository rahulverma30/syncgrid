/**
 * Drawer/slide-out component.
 * Reusable animated drawer that can enter from either side.
 */

'use client';

import { ReactNode, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useLockBodyScroll } from '@/hooks';

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
  useLockBodyScroll(isOpen);

  const from = side === 'right' ? '100%' : '-100%';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: from }}
            animate={{ x: 0 }}
            exit={{ x: from }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={cn(
              'absolute top-0 h-full w-full max-w-sm overflow-y-auto border-border bg-card shadow-xl',
              side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
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
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">{children}</div>

            {footer && <div className="border-t border-border p-6">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
