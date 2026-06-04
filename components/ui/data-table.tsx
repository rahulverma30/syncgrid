/**
 * DataTable component — enhanced with:
 * - Proper table header styling (text-muted-foreground, uppercase)
 * - Row count display ("Showing X–Y of Z results")
 * - Animated dropdown for column visibility (replaces <details>)
 * - aria-sort on sortable headers
 * - Taller row cells (py-3.5) for breathing room
 * - Selected row left-border accent
 * - Cleaner pagination with active page display
 */

'use client';

import { ReactNode, useMemo, useRef, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
} from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  Search,
  X,
} from 'lucide-react';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { EmptyState } from './empty-state';
import { Input } from './input';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/cn';

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  pageSize?: number;
  onRowClick?: (row: TData) => void;
  isLoading?: boolean;
  className?: string;
  showPagination?: boolean;
  enableRowSelection?: boolean;
  filterPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  actions?: ReactNode;
}

export function DataTable<TData>({
  columns,
  data,
  pageSize = 10,
  onRowClick,
  isLoading = false,
  className,
  showPagination = true,
  enableRowSelection = true,
  filterPlaceholder = 'Search...',
  emptyTitle = 'No results found',
  emptyDescription = 'Try adjusting your filters or search query.',
  actions,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [showColMenu, setShowColMenu] = useState(false);
  const colMenuRef = useRef<HTMLDivElement>(null);

  const tableColumns = useMemo<ColumnDef<TData>[]>(() => {
    if (!enableRowSelection) return columns;
    return [
      {
        id: 'select',
        enableSorting: false,
        enableHiding: false,
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all rows"
            checked={table.getIsAllPageRowsSelected()}
            onChange={(checked) => table.toggleAllPageRowsSelected(checked)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select row ${row.index + 1}`}
            checked={row.getIsSelected()}
            onChange={(checked) => row.toggleSelected(checked)}
          />
        ),
      },
      ...columns,
    ];
  }, [columns, enableRowSelection]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, columnFilters, columnVisibility, rowSelection, globalFilter },
    enableRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows.length;
  const totalRows = table.getFilteredRowModel().rows.length;
  const { pageIndex, pageSize: currentPageSize } = table.getState().pagination;
  const startRow = pageIndex * currentPageSize + 1;
  const endRow = Math.min((pageIndex + 1) * currentPageSize, totalRows);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={filterPlaceholder}
            className="flex h-9 w-full rounded-lg border border-input bg-background pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-shadow"
            aria-label="Search table"
          />
          {globalFilter && (
            <button
              onClick={() => setGlobalFilter('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Selection count */}
          {selectedRows > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
              {selectedRows} selected
              <button
                onClick={() => table.resetRowSelection()}
                className="hover:text-primary/70 transition-colors"
                aria-label="Clear selection"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Column visibility toggle */}
          <div className="relative" ref={colMenuRef}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColMenu((p) => !p)}
              aria-expanded={showColMenu}
              aria-haspopup="listbox"
              className="h-9 gap-1.5 text-xs"
            >
              <Columns3 className="h-3.5 w-3.5" />
              Columns
            </Button>
            {showColMenu && (
              <div
                className="absolute right-0 z-30 mt-1.5 w-52 rounded-xl border border-border bg-popover p-2 shadow-lg animate-fade-in"
                role="listbox"
                aria-label="Toggle columns"
              >
                {table
                  .getAllLeafColumns()
                  .filter((col) => col.getCanHide())
                  .map((column) => (
                    <label
                      key={column.id}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <Checkbox
                        checked={column.getIsVisible()}
                        onChange={(checked) => column.toggleVisibility(checked)}
                      />
                      <span className="capitalize text-foreground">
                        {column.id.replace(/_/g, ' ')}
                      </span>
                    </label>
                  ))}
              </div>
            )}
          </div>

          {actions}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="w-full overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border bg-muted/40">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const isSorted = header.column.getIsSorted();
                    const canSort = header.column.getCanSort();
                    return (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left"
                        aria-sort={
                          isSorted === 'asc'
                            ? 'ascending'
                            : isSorted === 'desc'
                              ? 'descending'
                              : canSort
                                ? 'none'
                                : undefined
                        }
                      >
                        {header.isPlaceholder ? null : (
                          <button
                            onClick={header.column.getToggleSortingHandler()}
                            disabled={!canSort}
                            className={cn(
                              'inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors',
                              canSort && 'hover:text-foreground cursor-pointer',
                              !canSort && 'cursor-default',
                              isSorted && 'text-foreground'
                            )}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {canSort && (
                              <span className="opacity-50">
                                {isSorted === 'asc' ? (
                                  <ArrowUp className="h-3 w-3" />
                                ) : isSorted === 'desc' ? (
                                  <ArrowDown className="h-3 w-3" />
                                ) : (
                                  <ArrowUpDown className="h-3 w-3" />
                                )}
                              </span>
                            )}
                          </button>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: pageSize }).map((_, index) => (
                  <tr key={index} className="border-b border-border last:border-0">
                    {table.getVisibleLeafColumns().map((column) => (
                      <td key={column.id} className="px-4 py-3.5">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={table.getVisibleLeafColumns().length} className="h-64">
                    <EmptyState
                      variant={globalFilter ? 'search' : 'default'}
                      title={globalFilter ? 'No matching results' : emptyTitle}
                      description={
                        globalFilter ? `No results found for "${globalFilter}"` : emptyDescription
                      }
                    />
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'border-b border-border transition-colors last:border-0 hover:bg-muted/40',
                      onRowClick && 'cursor-pointer',
                      row.getIsSelected() && 'bg-primary/5 border-l-2 border-l-primary'
                    )}
                    onClick={() => onRowClick?.(row.original)}
                    aria-selected={row.getIsSelected()}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {totalRows > 0 ? `Showing ${startRow}–${endRow} of ${totalRows} results` : 'No results'}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              aria-label="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-xs font-medium text-muted-foreground min-w-[80px] text-center">
              Page {pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              aria-label="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
