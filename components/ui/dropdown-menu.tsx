/**
 * Dropdown menu component
 * Reusable dropdown menu
 */

'use client';

import { ReactNode, useRef, useState } from 'react';
import { useOutsideClick } from '@/hooks';
import { cn } from '@/lib/cn';
import { ChevronDown } from 'lucide-react';

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
  const ref = useOutsideClick(() => setIsOpen(false));

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn('flex items-center gap-2 transition-colors', className)}
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-2 min-w-[200px] rounded-md border border-border bg-popover text-popover-foreground shadow-md animate-fade-in',
            align === 'right' && 'right-0',
            align === 'left' && 'left-0'
          )}
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
                'w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                index === 0 && 'rounded-t-md',
                index === items.length - 1 && 'rounded-b-md',
                item.destructive && 'text-destructive hover:bg-destructive/10'
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
