/**
 * Modal/Dialog component
 * Reusable modal dialog
 */

/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useLockBodyScroll } from '@/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}: ModalProps) {
  useLockBodyScroll(isOpen);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70"
            onClick={onClose}
          />

          {/* Dialog Container Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            role="dialog"
            aria-modal="true"
            className={cn(
              'relative z-10 w-full rounded-xl border border-border/50 bg-card p-6 shadow-2xl shadow-black/50 flex flex-col max-h-[90vh] overflow-hidden text-left',
              sizeClasses[size],
              className
            )}
          >
            {/* Sticky Header Section */}
            <div className="flex items-start justify-between gap-4 border-b border-border/40 pb-4 select-none flex-shrink-0">
              <div className="space-y-0.5">
                {title && <h2 className="text-base font-bold text-foreground">{title}</h2>}
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close modal"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Scrollable Main Content Body */}
            <div className="flex-1 overflow-y-auto pr-1 text-sm text-foreground my-4 leading-relaxed scrollbar-thin">
              {children}
            </div>

            {/* Sticky Footer Action Bar */}
            {footer && (
              <div className="border-t border-border/40 pt-4 flex items-center justify-end gap-2.5 select-none flex-shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
