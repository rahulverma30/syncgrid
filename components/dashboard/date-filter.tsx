'use client';

import React from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { DatePicker } from '@/components/ui/advanced-form';
import { motion, AnimatePresence } from 'framer-motion';

export interface DateFilterValue {
  range: string;
  startDate: string;
  endDate: string;
}

interface DateFilterProps {
  value: DateFilterValue;
  onChange: (val: DateFilterValue) => void;
}

const PRESETS = [
  { value: 'today', label: 'Today (24h)' },
  { value: 'weekly', label: 'Weekly Overview' },
  { value: 'monthly', label: 'Monthly Summary' },
  { value: 'yearly', label: 'Annual Analytics' },
  { value: 'custom', label: 'Custom Date Range...' },
];

export function DateFilter({ value, onChange }: DateFilterProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activePreset = PRESETS.find((p) => p.value === value.range) || PRESETS[2];

  const handleSelectPreset = (rangeVal: string) => {
    if (rangeVal === 'custom') {
      const todayStr = new Date().toISOString().split('T')[0];
      onChange({
        range: 'custom',
        startDate: todayStr,
        endDate: todayStr,
      });
    } else {
      onChange({
        range: rangeVal,
        startDate: '',
        endDate: '',
      });
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative z-30 select-none">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Dropdown Selector */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-9 items-center justify-between gap-2.5 rounded-lg border border-border/80 bg-background/50 px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent/40 focus:outline-none focus:ring-2 focus:ring-ring text-left min-w-[160px] shadow-sm transition-all"
        >
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground/80" />
            {activePreset.label}
          </span>
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 text-muted-foreground/80 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        {/* Custom inputs inline when active */}
        {value.range === 'custom' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2"
          >
            <div className="w-32">
              <DatePicker
                aria-label="Start date"
                value={value.startDate}
                onChange={(e) =>
                  onChange({
                    ...value,
                    startDate: e.target.value,
                  })
                }
                className="h-9 py-1 px-2.5 text-xs bg-background/40"
              />
            </div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              to
            </span>
            <div className="w-32">
              <DatePicker
                aria-label="End date"
                value={value.endDate}
                onChange={(e) =>
                  onChange({
                    ...value,
                    endDate: e.target.value,
                  })
                }
                className="h-9 py-1 px-2.5 text-xs bg-background/40"
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Preset List Dropdown Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-1.5 w-56 rounded-lg border border-border bg-popover/95 backdrop-blur-md p-1.5 text-popover-foreground shadow-lg max-h-60 overflow-y-auto"
          >
            <div className="space-y-0.5">
              {PRESETS.map((preset) => {
                const isSelected = value.range === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleSelectPreset(preset.value)}
                    className={cn(
                      'flex w-full items-center justify-between rounded px-2.5 py-1.5 text-xs text-left transition-colors',
                      isSelected
                        ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                        : 'hover:bg-accent/80 text-foreground'
                    )}
                  >
                    <span>{preset.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-current" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
