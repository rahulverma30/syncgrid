'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/cn';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  Columns,
  RefreshCw,
  X,
  SlidersHorizontal,
  CheckCircle,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Checkbox } from './checkbox';
import { DropdownMenu } from './dropdown-menu';
import { Select } from './select';
import { toast } from 'sonner';

interface FilterOption {
  column: string;
  label: string;
  options: { label: string; value: string }[];
}

interface EnterpriseTableToolbarProps {
  globalFilter: string;
  setGlobalFilter: (val: string) => void;
  selectedRowsCount?: number;
  bulkActions?: {
    label: string;
    onClick: () => void;
    destructive?: boolean;
    icon?: React.ReactNode;
  }[];
  filters?: FilterOption[];
  activeFilters?: Record<string, string>;
  onFilterChange?: (col: string, val: string) => void;
  onClearFilters?: () => void;
  exportData?: () => void;
  columnsList?: { id: string; label: string; visible: boolean; onToggle: () => void }[];
}

/**
 * Enterprise Table Toolbar Upgrade introducing visual filters, bulk operations, active search chips, and export triggers
 */
export function EnterpriseTableToolbar({
  globalFilter,
  setGlobalFilter,
  selectedRowsCount = 0,
  bulkActions = [],
  filters = [],
  activeFilters = {},
  onFilterChange,
  onClearFilters,
  exportData,
  columnsList = [],
}: EnterpriseTableToolbarProps) {
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const hasActiveFilters = Object.values(activeFilters).some(Boolean);

  const handleExport = (format: 'csv' | 'xlsx') => {
    toast.success(`Exporting grid data as ${format.toUpperCase()}...`);
    if (exportData) exportData();
  };

  return (
    <div className="space-y-3.5 w-full select-none">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80" />
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search records dynamically..."
            className="pl-9 bg-background/50 focus-visible:ring-2"
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Active Bulk Actions */}
          <AnimatePresence>
            {selectedRowsCount > 0 && bulkActions.length > 0 && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="flex items-center gap-2 border border-border/80 bg-accent/30 rounded-md p-1"
              >
                <span className="text-xs font-semibold px-2 text-muted-foreground">
                  {selectedRowsCount} selected
                </span>
                {bulkActions.map((action, idx) => (
                  <Button
                    key={idx}
                    variant={action.destructive ? 'destructive' : 'secondary'}
                    size="sm"
                    onClick={action.onClick}
                    className="h-8 text-xs gap-1.5"
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dynamic Filters Trigger */}
          {filters.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={cn(
                'h-9 text-xs gap-1.5',
                isFilterPanelOpen && 'bg-accent text-accent-foreground'
              )}
            >
              <SlidersHorizontal className="h-4 w-4 text-current" />
              Filters
              {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-primary" />}
            </Button>
          )}

          {/* Columns Visibility */}
          {columnsList.length > 0 && (
            <DropdownMenu
              trigger={
                <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5">
                  <Columns className="h-4 w-4" />
                  Columns
                </Button>
              }
              items={columnsList.map((col) => ({
                label: col.label,
                onClick: col.onToggle,
                icon: (
                  <span className="mr-2">
                    <Checkbox checked={col.visible} />
                  </span>
                ),
              }))}
            />
          )}

          {/* Export Selector */}
          <DropdownMenu
            trigger={
              <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5">
                <Download className="h-4 w-4" />
                Export
              </Button>
            }
            items={[
              {
                label: 'Export as CSV',
                onClick: () => handleExport('csv'),
                icon: <FileCode className="h-4 w-4 mr-2 text-muted-foreground" />,
              },
              {
                label: 'Export as Excel',
                onClick: () => handleExport('xlsx'),
                icon: <FileSpreadsheet className="h-4 w-4 mr-2 text-muted-foreground" />,
              },
            ]}
          />
        </div>
      </div>

      {/* Slide-out Filters panel */}
      <AnimatePresence>
        {isFilterPanelOpen && filters.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border border-border/60 bg-muted/20 rounded-lg p-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
              {filters.map((filter) => (
                <div key={filter.column} className="space-y-1 text-left">
                  <label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    {filter.label}
                  </label>
                  <div className="relative">
                    <Select
                      value={activeFilters[filter.column] ?? ''}
                      onChange={(val) => onFilterChange && onFilterChange(filter.column, val)}
                      className="h-9 text-xs rounded-lg px-2 bg-background/50 border-input"
                      options={[{ value: '', label: 'All options' }, ...filter.options]}
                    />
                  </div>
                </div>
              ))}
            </div>
            {hasActiveFilters && onClearFilters && (
              <div className="flex justify-end pt-3 mt-3 border-t border-border/40">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="h-8 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                >
                  <RefreshCw className="h-3 w-3 mr-1.5" />
                  Clear all filters
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Search & Filter Chips display */}
      <AnimatePresence>
        {(hasActiveFilters || globalFilter) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex flex-wrap items-center gap-1.5"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
              Active tags:
            </span>
            {globalFilter && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-xs font-semibold select-none shadow-sm">
                Search: {`"${globalFilter}"`}
                <button
                  onClick={() => setGlobalFilter('')}
                  className="rounded-full p-0.5 hover:bg-primary/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {Object.entries(activeFilters).map(([col, val]) => {
              if (!val) return null;
              const filterLabel = filters.find((f) => f.column === col)?.label || col;
              const optionLabel =
                filters.find((f) => f.column === col)?.options.find((o) => o.value === val)
                  ?.label || val;

              return (
                <span
                  key={col}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary text-secondary-foreground border border-border px-2.5 py-0.5 text-xs font-semibold select-none shadow-sm"
                >
                  {filterLabel}: {optionLabel}
                  <button
                    onClick={() => onFilterChange && onFilterChange(col, '')}
                    className="rounded-full p-0.5 hover:bg-muted-foreground/20 text-muted-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
