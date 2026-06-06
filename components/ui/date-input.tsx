/**
 * DateInput — Dark-theme-native date input component.
 * Replaces all native <input type="date"> instances to ensure
 * proper dark-mode styling across every browser.
 *
 * Uses `color-scheme: dark` to force the native date picker chrome
 * into dark mode, combined with custom Tailwind styling that matches
 * the SyncGrid input design system.
 *
 * Calendar is rendered via a React Portal so it correctly escapes
 * modal overflow / stacking-context constraints.
 */
'use client';

import React, { forwardRef, useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

// Helper functions for Custom DatePicker
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
const parseISODate = (isoString?: string | number | readonly string[]) => {
  if (typeof isoString !== 'string' || !isoString) return new Date();
  const [y, m, d] = isoString.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
};
const toISODate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/** Popover position relative to the viewport (fixed coordinates). */
interface PopoverPos {
  top: number;
  left: number;
  openUpward: boolean;
}

const CALENDAR_HEIGHT = 296; // approx rendered height of the calendar popover

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      className,
      label,
      error,
      wrapperClassName,
      id,
      value,
      onChange,
      placeholder = 'Select date',
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || `date-${Math.random().toString(36).slice(2, 9)}`;
    const [isOpen, setIsOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState(() => parseISODate(value));
    const [popoverPos, setPopoverPos] = useState<PopoverPos>({
      top: 0,
      left: 0,
      openUpward: false,
    });
    const [mounted, setMounted] = useState(false);

    const buttonRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    // Ensure we only portal on the client
    useEffect(() => {
      setMounted(true);
    }, []);

    useEffect(() => {
      if (typeof value === 'string' && value) {
        setCurrentDate(parseISODate(value));
      }
    }, [value]);

    /** Recompute the fixed position of the popover from the trigger button rect. */
    const updatePosition = useCallback(() => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < CALENDAR_HEIGHT + 8 && rect.top > CALENDAR_HEIGHT + 8;
      setPopoverPos({
        top: openUpward ? rect.top - CALENDAR_HEIGHT - 4 : rect.bottom + 4,
        left: rect.left,
        openUpward,
      });
    }, []);

    const handleOpen = () => {
      if (disabled) return;
      updatePosition();
      setIsOpen((prev) => !prev);
    };

    // Close when clicking outside both the button and the floating calendar
    useEffect(() => {
      if (!isOpen) return;
      function handleClickOutside(event: MouseEvent) {
        const target = event.target as Node;
        if (buttonRef.current?.contains(target) || popoverRef.current?.contains(target)) {
          return;
        }
        setIsOpen(false);
      }
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Reposition on scroll / resize while open
    useEffect(() => {
      if (!isOpen) return;
      const update = () => updatePosition();
      window.addEventListener('scroll', update, true);
      window.addEventListener('resize', update);
      return () => {
        window.removeEventListener('scroll', update, true);
        window.removeEventListener('resize', update);
      };
    }, [isOpen, updatePosition]);

    const handlePrevMonth = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleSelectDate = (day: number) => {
      const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isoString = toISODate(selectedDate);
      if (onChange) {
        const e = { target: { value: isoString } } as React.ChangeEvent<HTMLInputElement>;
        onChange(e);
      }
      setIsOpen(false);
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, isCurrentMonth: false });
    }

    const displayValue =
      value && typeof value === 'string'
        ? parseISODate(value).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : '';

    const calendarPopover =
      mounted && isOpen
        ? createPortal(
            <AnimatePresence>
              <motion.div
                ref={popoverRef}
                key="date-popover"
                initial={{ opacity: 0, y: popoverPos.openUpward ? 4 : -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: popoverPos.openUpward ? 4 : -4 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'fixed',
                  top: popoverPos.top,
                  left: popoverPos.left,
                  width: 260,
                  zIndex: 99999,
                }}
                className="rounded-xl border border-border bg-popover/95 backdrop-blur-md p-3 text-popover-foreground shadow-2xl"
              >
                {/* Month navigation */}
                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-accent/80 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="text-xs font-bold tracking-wide select-none">
                    {MONTH_NAMES[month]} {year}
                  </div>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-accent/80 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {WEEK_DAYS.map((d) => (
                    <div
                      key={d}
                      className="text-center text-[9px] font-bold uppercase text-muted-foreground/80 select-none"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* Day grid */}
                <div className="grid grid-cols-7 gap-1">
                  {days.map((d, idx) => {
                    const isSelected =
                      d.isCurrentMonth &&
                      displayValue &&
                      d.day === parseISODate(value as string).getDate() &&
                      month === parseISODate(value as string).getMonth() &&
                      year === parseISODate(value as string).getFullYear();
                    const isToday =
                      d.isCurrentMonth &&
                      d.day === new Date().getDate() &&
                      month === new Date().getMonth() &&
                      year === new Date().getFullYear();

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={!d.isCurrentMonth}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectDate(d.day);
                        }}
                        className={cn(
                          'h-7 w-7 mx-auto rounded text-[11px] font-semibold flex items-center justify-center transition-all select-none',
                          d.isCurrentMonth
                            ? 'hover:bg-accent hover:text-accent-foreground cursor-pointer text-foreground'
                            : 'text-muted-foreground/30 cursor-default',
                          isSelected &&
                            'bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90',
                          isToday && !isSelected && 'ring-1 ring-primary/50 text-primary'
                        )}
                      >
                        {d.day}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>,
            document.body
          )
        : null;

    return (
      <div className={cn('flex flex-col gap-1', wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input type="hidden" id={inputId} ref={ref} value={value} {...props} />
          <button
            ref={buttonRef}
            type="button"
            onClick={handleOpen}
            disabled={disabled}
            className={cn(
              'flex h-9 w-full items-center justify-between rounded-md border border-border/60 bg-input px-3 py-2 text-sm text-foreground ring-offset-background transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 select-none text-left',
              disabled && 'cursor-not-allowed opacity-50',
              error && 'border-destructive focus-visible:ring-destructive',
              isOpen && 'ring-2 ring-ring ring-offset-0',
              className
            )}
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
              <span
                className={cn('truncate font-medium', !displayValue && 'text-muted-foreground/50')}
              >
                {displayValue || placeholder}
              </span>
            </div>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200 shrink-0',
                isOpen && 'rotate-180'
              )}
            />
          </button>
        </div>
        {error && <p className="text-xs text-destructive font-medium">{error}</p>}
        {calendarPopover}
      </div>
    );
  }
);

DateInput.displayName = 'DateInput';
