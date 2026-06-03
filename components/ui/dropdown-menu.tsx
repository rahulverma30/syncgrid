/**
 * Dropdown menu component
 * Reusable dropdown menu
 */

/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { ReactNode, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useOutsideClick } from '@/hooks';
import { cn } from '@/lib/cn';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DropdownItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface DropdownMenuProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export function DropdownMenu({ trigger, items, align = 'right', className }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, placement: 'bottom' });

  useEffect(() => setMounted(true), []);

  const updateCoords = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = items.length * 40; // Approx height
    const dropdownWidth = 200; // min-w-[200px]
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let placement: 'bottom' | 'top' = 'bottom';
    let top = rect.bottom + window.scrollY + 6;

    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      placement = 'top';
      top = rect.top + window.scrollY - dropdownHeight - 6;
    }

    let left = rect.left + window.scrollX;
    if (align === 'right') {
      left = rect.right + window.scrollX - dropdownWidth;
    }

    // Ensure it doesn't go offscreen horizontally
    if (left < 0) left = 10;
    if (left + dropdownWidth > window.innerWidth) {
      left = window.innerWidth - dropdownWidth - 10;
    }

    setCoords({ top, left, placement });
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('scroll', updateCoords, { capture: true });
      window.addEventListener('resize', updateCoords);
    }
    return () => {
      window.removeEventListener('scroll', updateCoords, { capture: true });
      window.removeEventListener('resize', updateCoords);
    };
  }, [isOpen, items.length, align]);

  // Click outside handling for both trigger and portal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn('flex items-center gap-2 transition-colors', className)}
      >
        {trigger}
      </button>

      {mounted &&
        isOpen &&
        createPortal(
          <AnimatePresence>
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: coords.placement === 'bottom' ? -5 : 5, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: coords.placement === 'bottom' ? -5 : 5, scale: 0.98 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={{ top: coords.top, left: coords.left }}
              className="absolute z-[9999] min-w-[200px] rounded-md border border-border bg-popover text-popover-foreground shadow-lg flex flex-col"
            >
              {items.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    item.onClick();
                    setIsOpen(false);
                  }}
                  disabled={item.disabled}
                  className={cn(
                    'w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                    index === 0 && 'rounded-t-md',
                    index === items.length - 1 && 'rounded-b-md',
                    item.destructive &&
                      'text-destructive hover:bg-destructive/10 hover:text-destructive'
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
