/**
 * Premium Select/Dropdown component
 * Reusable searchable custom combobox with keyboard navigation and micro-animations
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import { ChevronDown, Check, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  'onChange' | 'placeholder'
> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
  value?: string;
  searchable?: boolean;
  placeholder?: string;
}

export function Select({
  label,
  error,
  hint,
  options = [],
  onChange,
  className,
  value,
  placeholder = 'Select an option',
  disabled,
  searchable,
  ...props
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options based on search query
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Automatic search enablement: if explicitly passed, or if list is greater than 5 items
  const isSearchEnabled = searchable ?? options.length > 5;

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openDropdown = () => {
    setSearchQuery('');
    const selectedIdx = options.findIndex((opt) => opt.value === value);
    setHighlightedIndex(selectedIdx >= 0 ? selectedIdx : 0);
    setIsOpen(true);
  };

  // Auto-focus search input when the dropdown opens
  useEffect(() => {
    if (!isOpen || !isSearchEnabled) return;

    const timeoutId = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen, isSearchEnabled]);

  // Adjust scroll when highlighted index changes
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        const listHeight = listRef.current.clientHeight;
        const listScrollTop = listRef.current.scrollTop;
        const elHeight = activeEl.clientHeight;
        const elOffsetTop = activeEl.offsetTop;

        if (elOffsetTop < listScrollTop) {
          listRef.current.scrollTop = elOffsetTop;
        } else if (elOffsetTop + elHeight > listScrollTop + listHeight) {
          listRef.current.scrollTop = elOffsetTop + elHeight - listHeight;
        }
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;
    onChange?.(option.value);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDropdown();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          filteredOptions.length > 0 ? (prev + 1) % filteredOptions.length : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          filteredOptions.length > 0
            ? (prev - 1 + filteredOptions.length) % filteredOptions.length
            : 0
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full relative" ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => (isOpen ? setIsOpen(false) : openDropdown())}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex w-full items-center justify-between h-10 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-slate-200 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus:ring-red-500/20 focus:border-red-500',
            isOpen && 'border-blue-500 ring-2 ring-blue-500/20',
            className
          )}
        >
          <span className={cn('block truncate', !selectedOption && 'text-slate-500')}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-slate-400 transition-transform duration-200 pointer-events-none',
              isOpen && 'transform rotate-180 text-blue-400'
            )}
          />
        </button>

        {/* Dropdown Portal */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 mt-1.5 w-full rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl p-1.5 max-h-72 overflow-hidden flex flex-col backdrop-blur-md"
            >
              {/* Search Box */}
              {isSearchEnabled && (
                <div className="flex items-center px-2 py-1.5 border-b border-slate-900 gap-2 mb-1">
                  <Search className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search options..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setHighlightedIndex(0);
                    }}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent text-xs text-slate-200 border-0 p-0 focus:ring-0 focus:outline-none outline-none placeholder-slate-500"
                  />
                </div>
              )}

              {/* Options List */}
              <div ref={listRef} className="overflow-y-auto max-h-56 custom-scrollbar space-y-0.5">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option, index) => {
                    const isSelected = option.value === value;
                    const isHighlighted = index === highlightedIndex;

                    return (
                      <div
                        key={option.value}
                        onClick={() => handleSelect(option)}
                        className={cn(
                          'flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all duration-150',
                          option.disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
                          isSelected
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'text-slate-300 hover:bg-slate-900',
                          isHighlighted && !isSelected && 'bg-slate-900 text-slate-100'
                        )}
                      >
                        <span className="block truncate">{option.label}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-white shrink-0" />}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-4 text-center text-xs text-slate-500">No results found</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {error && <p className="text-xs text-red-400 font-medium mt-0.5">{error}</p>}
      {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
    </div>
  );
}
