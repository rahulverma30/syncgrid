/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { Button } from './button';
import { useLockBodyScroll } from '@/hooks';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
}

/**
 * CenteredModal with glassmorphism, backdrop blurs, quick Esc closing, and nested-safe body scroll locking
 */
export function CenteredModal({ isOpen, onClose, title, children, className, footer }: ModalProps) {
  useLockBodyScroll(isOpen);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            role="dialog"
            aria-modal="true"
            className={cn(
              'relative z-50 w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl p-6 flex flex-col max-h-[90vh] overflow-hidden select-none',
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4 select-none flex-shrink-0">
              <h3 className="text-lg font-bold tracking-tight text-foreground">{title}</h3>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close modal"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto pr-1 text-sm text-foreground mb-6 leading-relaxed scrollbar-thin">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-3.5 border-t border-border/40 pt-4 select-none flex-shrink-0">
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

/**
 * Mobile-friendly DrawerModal sliding up from viewport bottoms elegantly
 */
export function DrawerModal({ isOpen, onClose, title, children, className, footer }: ModalProps) {
  useLockBodyScroll(isOpen);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            role="dialog"
            aria-modal="true"
            className={cn(
              'relative z-50 w-full max-w-xl rounded-t-2xl border-t border-border bg-card p-6 flex flex-col max-h-[85vh] overflow-hidden shadow-2xl pb-8',
              className
            )}
          >
            {/* Grab Handle */}
            <div className="mx-auto h-1.5 w-12 rounded-full bg-muted-foreground/35 mb-4 select-none flex-shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-4 select-none border-b border-border/40 flex-shrink-0">
              <h3 className="text-base font-bold tracking-tight text-foreground">{title}</h3>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close drawer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto text-sm text-foreground mb-6 leading-relaxed pr-1 scrollbar-thin">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-3 border-t border-border/40 pt-4 select-none flex-shrink-0">
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

/**
 * FullscreenModal overlay sheet for wide-density actions
 */
export function FullscreenModal({
  isOpen,
  onClose,
  title,
  children,
  className,
  footer,
}: ModalProps) {
  useLockBodyScroll(isOpen);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 1.015 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.015 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-background flex flex-col p-6 overflow-hidden w-full h-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/80 pb-4 mb-6 select-none flex-shrink-0">
            <h3 className="text-xl font-extrabold tracking-tight text-foreground">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close fullscreen view"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div
            className={cn(
              'flex-1 overflow-y-auto w-full text-sm text-foreground leading-relaxed pr-1 scrollbar-thin',
              className
            )}
          >
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 border-t border-border/80 pt-4 mt-6 select-none flex-shrink-0">
              {footer}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

/**
 * ConfirmationModal warning overlay checking dangerous or destructive actions
 */
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  type = 'warning',
  isLoading = false,
}: ConfirmationModalProps) {
  const iconMap = {
    danger: <AlertCircle className="h-6 w-6 text-rose-500 animate-bounce" />,
    warning: <AlertTriangle className="h-6 w-6 text-amber-500 animate-pulse" />,
    info: <Info className="h-6 w-6 text-blue-500" />,
    success: <CheckCircle className="h-6 w-6 text-emerald-500" />,
  }[type];

  const buttonVariant = {
    danger: 'destructive',
    warning: 'default',
    info: 'default',
    success: 'default',
  }[type] as 'default' | 'destructive' | 'secondary' | 'outline' | 'ghost' | 'link';

  const footerActions = (
    <>
      <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
        {cancelLabel}
      </Button>
      <Button variant={buttonVariant} size="sm" onClick={onConfirm} isLoading={isLoading}>
        {confirmLabel}
      </Button>
    </>
  );

  return (
    <CenteredModal isOpen={isOpen} onClose={onClose} title={title} footer={footerActions}>
      <div className="flex gap-4 items-start select-none pt-2">
        <div className="rounded-full p-2.5 flex-shrink-0 flex items-center justify-center">
          {iconMap}
        </div>
        <div className="space-y-1 text-left flex-1">
          <p className="text-sm font-medium text-foreground leading-relaxed">{message}</p>
          <p className="text-xs text-muted-foreground/80 font-medium">
            This transaction cannot be undone. Please confirm to continue.
          </p>
        </div>
      </div>
    </CenteredModal>
  );
}
