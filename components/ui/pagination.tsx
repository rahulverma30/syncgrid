import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from './button';
import { Select } from './select';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50, 100],
  className = '',
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Calculate window of pages to show
  const getVisiblePages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  if (totalItems === 0) return null;

  return (
    <div
      className={`flex justify-between items-center flex-wrap gap-4 pt-4 text-xs select-none ${className}`}
    >
      <div className="flex items-center gap-3">
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-medium">Rows per page:</span>
            <div className="w-16">
              <Select
                value={String(pageSize)}
                onChange={(value) => onPageSizeChange(parseInt(value) || 10)}
                options={pageSizeOptions.map((opt) => ({ value: String(opt), label: String(opt) }))}
                className="h-8 text-xs rounded-lg px-2 bg-background/50 border-border/60 hover:border-primary/40 transition-colors"
              />
            </div>
          </div>
        )}
        <span className="text-muted-foreground">
          Showing{' '}
          <span className="font-bold text-foreground">{(currentPage - 1) * pageSize + 1}</span> to{' '}
          <span className="font-bold text-foreground">
            {Math.min(currentPage * pageSize, totalItems)}
          </span>{' '}
          of <span className="font-bold text-foreground">{totalItems}</span>
        </span>
      </div>

      <div className="flex gap-1.5 items-center">
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg bg-background/30 hover:bg-muted border-border/60"
          aria-label="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getVisiblePages().map((p, idx) => {
          if (p === '...') {
            return (
              <div
                key={`ellipsis-${idx}`}
                className="flex items-center justify-center w-8 h-8 text-muted-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </div>
            );
          }

          return (
            <Button
              key={p}
              onClick={() => onPageChange(p as number)}
              variant={currentPage === p ? 'default' : 'outline'}
              className={`h-8 w-8 p-0 text-xs font-bold rounded-lg ${
                currentPage === p
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'bg-background/30 hover:bg-muted border-border/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              {p}
            </Button>
          );
        })}

        <Button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg bg-background/30 hover:bg-muted border-border/60"
          aria-label="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
