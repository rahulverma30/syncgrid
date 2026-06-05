import React, { useState, useMemo } from 'react';
import { useTasksStore, TaskType } from '@/store/tasksStore';
import { toast } from 'sonner';
import {
  ArrowUpDown,
  Download,
  Trash2,
  Archive,
  User,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Pagination } from '@/components/ui';

interface TaskTableProps {
  onSelectTask: (code: string) => void;
}

type SortField =
  | 'code'
  | 'title'
  | 'priority'
  | 'storyPoints'
  | 'actualHours'
  | 'dueDate'
  | 'healthScore';
type SortOrder = 'asc' | 'desc';

export function TaskTable({ onSelectTask }: TaskTableProps) {
  const { tasks, updateTask, deleteTask } = useTasksStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50); // Increased to showcase high-scale virtualization performance

  // Virtualization Scroll States
  const [scrollTop, setScrollTop] = useState(0);
  const rowHeight = 65; // exact row height in px
  const viewportHeight = 350; // max visible height of viewport container

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Toggle selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(tasks.map((t) => t._id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Bulk Actions
  const handleBulkArchive = async () => {
    if (selectedIds.size === 0) return;

    let successCount = 0;
    for (const id of Array.from(selectedIds)) {
      const ok = await updateTask(id, { isArchived: true });
      if (ok) successCount++;
    }

    toast.success(`Archived ${successCount} tasks successfully.`);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    let successCount = 0;
    for (const id of Array.from(selectedIds)) {
      const ok = await deleteTask(id);
      if (ok) successCount++;
    }

    toast.success(`Deleted ${successCount} tasks successfully.`);
    setSelectedIds(new Set());
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (tasks.length === 0) return;

    const headers = [
      'Task Code',
      'Title',
      'Project',
      'Priority',
      'Story Points',
      'Estimated Hours',
      'Actual Hours',
      'Due Date',
      'Health Score',
    ];
    const rows = tasks.map((t) => [
      t.code,
      `"${t.title.replace(/"/g, '""')}"`,
      t.projectId?.name || 'None',
      t.priority,
      t.storyPoints,
      t.estimatedHours,
      t.actualHours,
      t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'Not Set',
      t.healthScore,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `SyncGrid_Tasks_Export_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Tasks data grid exported to CSV successfully');
  };

  // Sort logic
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedTasks = useMemo(() => {
    const data = [...tasks];
    return data.sort((a, b) => {
      let valA: any = a[sortField as keyof TaskType] || '';
      let valB: any = b[sortField as keyof TaskType] || '';

      if (sortField === 'dueDate') {
        valA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        valB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tasks, sortField, sortOrder]);

  // Paginated tasks
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedTasks.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedTasks, currentPage]);

  // Virtualization Window Calculations
  const virtualRows = useMemo(() => {
    const totalItems = paginatedTasks.length;
    const startIdx = Math.max(0, Math.floor(scrollTop / rowHeight) - 2); // 2 rows buffer top
    const endIdx = Math.min(
      totalItems - 1,
      Math.ceil((scrollTop + viewportHeight) / rowHeight) + 2
    ); // 2 rows buffer bottom

    const sliced = paginatedTasks.slice(startIdx, endIdx + 1);
    const paddingTop = startIdx * rowHeight;
    const paddingBottom = Math.max(0, (totalItems - 1 - endIdx) * rowHeight);

    return {
      rows: sliced,
      paddingTop,
      paddingBottom,
    };
  }, [paginatedTasks, scrollTop, rowHeight, viewportHeight]);

  const totalPages = Math.ceil(sortedTasks.length / itemsPerPage) || 1;

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
      case 'high':
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case 'medium':
        return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border border-gray-500/20';
    }
  };

  const getHealthTextClass = (score: number) => {
    if (score >= 80) return 'text-emerald-500 font-bold';
    if (score >= 50) return 'text-amber-500 font-bold';
    return 'text-rose-500 font-bold';
  };

  return (
    <div className="space-y-4">
      {/* Table Actions Menu bar */}
      <div className="flex justify-between items-center bg-muted/5 border border-border/30 px-4 py-3 rounded-xl">
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 ? (
            <>
              <span className="text-xs font-bold text-muted-foreground select-none">
                {selectedIds.size} tasks selected
              </span>
              <button
                onClick={handleBulkArchive}
                className="flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 text-xs px-3 py-1.5 rounded-lg hover:bg-primary/20 transition duration-150"
              >
                <Archive className="w-3.5 h-3.5" /> Archive Selected
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1 bg-rose-500/10 text-rose-500 border border-rose-500/25 text-xs px-3 py-1.5 rounded-lg hover:bg-rose-500/20 transition duration-150"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Selected
              </button>
            </>
          ) : (
            <span className="text-xs font-bold text-muted-foreground italic select-none">
              Check task rows for bulk operations
            </span>
          )}
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1 text-xs border border-border bg-background hover:bg-muted/10 px-3 py-1.5 rounded-lg transition"
        >
          <Download className="w-3.5 h-3.5" /> Export Grid
        </button>
      </div>

      {/* Grid container */}
      <div
        className="border border-border/30 rounded-xl overflow-auto shadow-sm bg-background"
        style={{ maxHeight: `${viewportHeight}px` }}
        onScroll={handleScroll}
      >
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/10 border-b border-border/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider select-none">
              <th className="py-3.5 px-4 w-12 text-center">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={tasks.length > 0 && selectedIds.size === tasks.length}
                  className="rounded border-border focus:ring-0 cursor-pointer"
                />
              </th>

              {/* Code */}
              <th
                className="py-3.5 px-3 cursor-pointer hover:text-foreground"
                onClick={() => handleSort('code')}
              >
                <span className="flex items-center gap-1">
                  Code <ArrowUpDown className="w-3 h-3" />
                </span>
              </th>

              {/* Title */}
              <th
                className="py-3.5 px-3 cursor-pointer hover:text-foreground"
                onClick={() => handleSort('title')}
              >
                <span className="flex items-center gap-1">
                  Title <ArrowUpDown className="w-3 h-3" />
                </span>
              </th>

              {/* Status */}
              <th className="py-3.5 px-3">Status</th>

              {/* Priority */}
              <th
                className="py-3.5 px-3 cursor-pointer hover:text-foreground"
                onClick={() => handleSort('priority')}
              >
                <span className="flex items-center gap-1">
                  Priority <ArrowUpDown className="w-3 h-3" />
                </span>
              </th>

              {/* Points */}
              <th
                className="py-3.5 px-3 cursor-pointer hover:text-foreground"
                onClick={() => handleSort('storyPoints')}
              >
                <span className="flex items-center gap-1">
                  Points <ArrowUpDown className="w-3 h-3" />
                </span>
              </th>

              {/* Hours */}
              <th
                className="py-3.5 px-3 cursor-pointer hover:text-foreground"
                onClick={() => handleSort('actualHours')}
              >
                <span className="flex items-center gap-1">
                  Actual/Est. <ArrowUpDown className="w-3 h-3" />
                </span>
              </th>

              {/* Due Date */}
              <th
                className="py-3.5 px-3 cursor-pointer hover:text-foreground"
                onClick={() => handleSort('dueDate')}
              >
                <span className="flex items-center gap-1">
                  Due Date <ArrowUpDown className="w-3 h-3" />
                </span>
              </th>

              {/* Health Score */}
              <th
                className="py-3.5 px-3 cursor-pointer hover:text-foreground"
                onClick={() => handleSort('healthScore')}
              >
                <span className="flex items-center gap-1">
                  Health <ArrowUpDown className="w-3 h-3" />
                </span>
              </th>

              <th className="py-3.5 px-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/20">
            {paginatedTasks.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="py-12 text-center text-xs text-muted-foreground/60 italic"
                >
                  No tasks matches the filter criteria. Seed workspace datasets or build your first
                  task.
                </td>
              </tr>
            ) : (
              <>
                {virtualRows.paddingTop > 0 && (
                  <tr style={{ height: `${virtualRows.paddingTop}px` }}>
                    <td colSpan={10} className="p-0 border-0" />
                  </tr>
                )}
                {virtualRows.rows.map((t) => (
                  <tr
                    key={t._id}
                    className={`hover:bg-muted/5 transition duration-100 ${
                      selectedIds.has(t._id) ? 'bg-primary/5 hover:bg-primary/5' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(t._id)}
                        onChange={() => handleSelectRow(t._id)}
                        className="rounded border-border focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* Code */}
                    <td className="py-3.5 px-3 font-mono text-[11px] font-bold text-muted-foreground select-all">
                      {t.code}
                    </td>

                    {/* Title */}
                    <td className="py-3.5 px-3">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-foreground line-clamp-1">
                          {t.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {t.projectId?.name}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: t.statusId?.color || '#94a3b8' }}
                        />
                        <span className="text-xs font-semibold text-foreground">
                          {t.statusId?.name}
                        </span>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-3">
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-sans font-bold capitalize ${getPriorityBadgeClass(t.priority)}`}
                      >
                        {t.priority}
                      </span>
                    </td>

                    {/* Points */}
                    <td className="py-3.5 px-3 text-xs font-mono font-bold text-foreground">
                      {t.storyPoints}
                    </td>

                    {/* Hours */}
                    <td className="py-3.5 px-3 text-xs font-mono text-muted-foreground">
                      <strong className="text-foreground">{t.actualHours.toFixed(1)}h</strong> /{' '}
                      {t.estimatedHours}h
                    </td>

                    {/* Due Date */}
                    <td className="py-3.5 px-3 text-xs text-foreground font-medium">
                      {t.dueDate ? (
                        new Date(t.dueDate).toLocaleDateString()
                      ) : (
                        <em className="text-muted-foreground/60 text-[10px]">Not Set</em>
                      )}
                    </td>

                    {/* Health */}
                    <td className="py-3.5 px-3 text-xs font-mono">
                      <span className={getHealthTextClass(t.healthScore)}>{t.healthScore}%</span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onSelectTask(t.code)}
                        className="p-1 hover:bg-muted/10 rounded-md text-muted-foreground hover:text-primary transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {virtualRows.paddingBottom > 0 && (
                  <tr style={{ height: `${virtualRows.paddingBottom}px` }}>
                    <td colSpan={10} className="p-0 border-0" />
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <Pagination
        currentPage={currentPage}
        totalItems={sortedTasks.length}
        pageSize={itemsPerPage}
        onPageChange={setCurrentPage}
        onPageSizeChange={setItemsPerPage}
        pageSizeOptions={[20, 50, 100]}
      />
    </div>
  );
}
