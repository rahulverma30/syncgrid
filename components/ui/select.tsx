/* eslint-disable react-hooks/set-state-in-effect */
/**
 * Premium Select/Dropdown component
 * Reusable searchable custom combobox with React Portal, smart flipping, keyboard navigation, and micro-animations
 */

'use client';

import React, { useState, useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);

  // Position coordinates state for Portal dropdown
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    placement: 'bottom' | 'top';
  }>({ top: 0, left: 0, width: 0, placement: 'bottom' });

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const listId = useId();
  const triggerId = useId();

  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    return options.filter((opt) => opt.label.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [options, searchQuery]);

  // Automatic search enablement: if explicitly passed, or if list is greater than 5 items
  const isSearchEnabled = searchable ?? options.length > 5;

  // Mount tracking to avoid Next.js hydration issues with Portals
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle click outside to close dropdown (handles both trigger container and portal dropdown list)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamic dropdown positioning and smart-flipping logic
  const updateCoords = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 260; // Estimated height boundary
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let placement: 'bottom' | 'top' = 'bottom';
    let top = rect.bottom + window.scrollY + 6;

    // Flip upwards if there is not enough space below, and more space above
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      placement = 'top';
      top = rect.top + window.scrollY - dropdownHeight - 6;
    }

    setCoords({
      top,
      left: rect.left + window.scrollX,
      width: rect.width,
      placement,
    });
  };

  // Recalculate dropdown boundaries on open, scroll, or resize
  useEffect(() => {
    if (!isOpen) return;

    updateCoords();

    // capture: true intercepts scrolling on scrollable child containers as well
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords, { capture: true });

    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, { capture: true });
    };
  }, [isOpen]);

  const openDropdown = () => {
    setSearchQuery('');
    const selectedIdx = filteredOptions.findIndex((opt) => opt.value === value);
    setHighlightedIndex(selectedIdx >= 0 ? selectedIdx : 0);
    setIsOpen(true);
  };

  // Auto-focus search input when the dropdown opens
  useEffect(() => {
    if (!isOpen || !isSearchEnabled) return;

    const timeoutId = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 60);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen, isSearchEnabled]);

  // Adjust scroll position when highlighted index changes
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
        triggerRef.current?.focus();
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full relative" ref={containerRef}>
      {label && (
        <label
          id={`${triggerId}-label`}
          className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5 select-none"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {/* Trigger Button */}
        <button
          id={triggerId}
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={isOpen ? listId : undefined}
          aria-labelledby={label ? `${triggerId}-label` : undefined}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation(); // Decouple click propagation for cards/Kanban
            isOpen ? setIsOpen(false) : openDropdown();
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex w-full items-center justify-between h-10 rounded-lg border border-input bg-background/50 px-3 py-2 text-sm text-foreground shadow-sm transition-all duration-150 hover:bg-background hover:border-input/80 focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus:ring-destructive focus:ring-offset-0',
            isOpen && 'ring-2 ring-ring/50 border-ring',
            className
          )}
        >
          <span
            className={cn('block truncate text-left', !selectedOption && 'text-muted-foreground')}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform duration-200 pointer-events-none shrink-0 ml-2',
              isOpen && 'transform rotate-180 text-foreground'
            )}
          />
        </button>

        {/* Dropdown Menu - rendered in a portal */}
        {mounted &&
          createPortal(
            <AnimatePresence mode="wait">
              {isOpen && (
                <motion.div
                  ref={dropdownRef}
                  onClick={(e) => e.stopPropagation()} // Stop bubbling event triggers
                  initial={{ opacity: 0, y: coords.placement === 'bottom' ? -4 : 4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: coords.placement === 'bottom' ? -4 : 4, scale: 0.98 }}
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    top: coords.top,
                    left: coords.left,
                    width: coords.width,
                  }}
                  className="z-[9999] rounded-xl border border-border/60 bg-popover/95 backdrop-blur-xl text-popover-foreground shadow-2xl p-1 max-h-[280px] overflow-hidden flex flex-col ring-1 ring-black/5 dark:ring-white/10"
                >
                  {/* Search Box */}
                  {isSearchEnabled && (
                    <div
                      className="flex items-center px-2 py-1.5 border-b border-border gap-2 mb-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setHighlightedIndex(0);
                        }}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-transparent text-sm text-foreground border-0 p-0 focus:ring-0 focus:outline-none outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                  )}

                  {/* Options List */}
                  <div
                    id={listId}
                    ref={listRef}
                    role="listbox"
                    aria-label={label || placeholder}
                    className="overflow-y-auto max-h-56 custom-scrollbar p-0.5 space-y-0.5"
                  >
                    {filteredOptions.length > 0 ? (
                      filteredOptions.map((option, index) => {
                        const isSelected = option.value === value;
                        const isHighlighted = index === highlightedIndex;

                        return (
                          <div
                            key={option.value}
                            role="option"
                            aria-selected={isSelected}
                            aria-disabled={option.disabled}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelect(option);
                            }}
                            className={cn(
                              'flex items-center justify-between px-2.5 py-2 rounded text-sm cursor-pointer transition-all duration-150 select-none md:py-1.5',
                              option.disabled &&
                                'opacity-40 cursor-not-allowed pointer-events-none',
                              isSelected
                                ? 'bg-primary text-primary-foreground font-medium'
                                : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                              isHighlighted && !isSelected && 'bg-accent text-accent-foreground'
                            )}
                          >
                            <span className="block truncate">{option.label}</span>
                            {isSelected && <Check className="h-4 w-4 shrink-0 ml-2" />}
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-4 text-center text-sm text-muted-foreground">
                        No results found
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )}
      </div>
      {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}
