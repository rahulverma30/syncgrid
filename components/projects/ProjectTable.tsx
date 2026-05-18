'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Button, CenteredModal, ConfirmationModal } from '@/components/ui';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Archive,
  RotateCcw,
  Trash2,
  MoreHorizontal,
  Copy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectsStore, ProjectAccount } from '@/store/projectsStore';
import { ProjectTagPill } from './ProjectTagSelector';

// ── Status helpers ──────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  design: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
  development: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  testing: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  deployment: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  completed: 'bg-green-500/10 text-green-500 border-green-500/20',
  'on-hold': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  cancelled: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  medium: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  high: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  urgent: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
};

export const ProjectTable: React.FC = () => {
  const {
    projects,
    setSelectedProject,
    statusFilter,
    priorityFilter,
    managerFilter,
    riskFilter,
    billingFilter,
    isArchivedFilter,
    setFilters,
    resetFilters,
    sortColumn,
    sortDirection,
    setSort,
    currentPage,
    pageSize,
    setPage,
    setPageSize,
    columnVisibility,
    toggleColumnVisibility,
    archiveProject,
    deleteProject,
    savedFilters,
    activePresetName,
    saveFilterPreset,
    loadFilterPreset,
    deleteFilterPreset,
    executeBulkAction,
    duplicateProject,
  } = useProjectsStore();

  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [visibilityMenuOpen, setVisibilityMenuOpen] = useState(false);
  const [rowMenuOpenId, setRowMenuOpenId] = useState<string | null>(null);

  // Custom modal states
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [presetName, setPresetName] = useState('');

  const [isBulkArchiveConfirmOpen, setIsBulkArchiveConfirmOpen] = useState(false);

  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [duplicateName, setDuplicateName] = useState('');
  const [projectToDuplicate, setProjectToDuplicate] = useState<ProjectAccount | null>(null);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectAccount | null>(null);

  // ── Sorting ───────────────────────────────────────────────────────────────
  const sortedProjects = useMemo(() => {
    if (!sortColumn) return projects;
    return [...projects].sort((a, b) => {
      const aVal = (a as any)[sortColumn === 'createdDate' ? 'createdAt' : sortColumn];
      const bVal = (b as any)[sortColumn === 'createdDate' ? 'createdAt' : sortColumn];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [projects, sortColumn, sortDirection]);

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sortedProjects.length / pageSize));
  const paginatedProjects = sortedProjects.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // ── Bulk Actions ──────────────────────────────────────────────────────────
  const allSelected =
    paginatedProjects.length > 0 && paginatedProjects.every((p) => selectedRows.includes(p._id));
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginatedProjects.map((p) => p._id));
    }
  };

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const headers = [
      'Name',
      'Code',
      'Status',
      'Priority',
      'Manager',
      'Budget',
      'Health',
      'Deadline',
    ];
    const rows = sortedProjects.map((p) => [
      p.name,
      p.code,
      p.status,
      p.priority,
      p.projectManager,
      p.budget,
      p.healthScore,
      p.deadline ? new Date(p.deadline).toLocaleDateString() : '',
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'projects_export.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const colNames = Object.keys(columnVisibility);

  // ── Column header helper ──────────────────────────────────────────────────
  const renderSortHeader = (label: string, column: keyof ProjectAccount | 'createdDate') => (
    <th
      onClick={() => setSort(column)}
      className="px-3 py-2.5 text-left text-[9px] font-black text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap"
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-2.5 w-2.5 opacity-40" />
      </span>
    </th>
  );

  return (
    <motion.div
      key="ledger"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-3 text-left"
    >
      {/* Filters & Export Row */}
      <div className="flex justify-between items-center flex-wrap gap-3 pb-3 border-b border-border/40 select-none">
        <div className="flex gap-2 flex-wrap items-center">
          <select
            value={statusFilter}
            onChange={(e) => setFilters({ statusFilter: e.target.value })}
            className="h-8 rounded-lg border border-border/80 bg-background/50 px-2 text-xs text-foreground focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="planning">Planning</option>
            <option value="design">Design</option>
            <option value="development">Development</option>
            <option value="testing">Testing</option>
            <option value="deployment">Deployment</option>
            <option value="completed">Completed</option>
            <option value="on-hold">On Hold</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setFilters({ priorityFilter: e.target.value })}
            className="h-8 rounded-lg border border-border/80 bg-background/50 px-2 text-xs text-foreground focus:outline-none"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <select
            value={billingFilter}
            onChange={(e) => setFilters({ billingFilter: e.target.value })}
            className="h-8 rounded-lg border border-border/80 bg-background/50 px-2 text-xs text-foreground focus:outline-none"
          >
            <option value="">All Billing</option>
            <option value="fixed">Fixed</option>
            <option value="hourly">Hourly</option>
            <option value="retainer">Retainer</option>
            <option value="milestone-based">Milestone</option>
          </select>

          <select
            value={isArchivedFilter ? 'archived' : 'active'}
            onChange={(e) => setFilters({ isArchivedFilter: e.target.value === 'archived' })}
            className="h-8 rounded-lg border border-border/80 bg-background/50 px-2 text-xs text-foreground focus:outline-none"
          >
            <option value="active">Active Projects</option>
            <option value="archived">Archived Projects</option>
          </select>

          <Button
            onClick={resetFilters}
            variant="ghost"
            size="sm"
            className="h-8 text-xs hover:bg-accent/40 font-bold"
          >
            Reset
          </Button>
        </div>

        <div className="flex gap-2 items-center relative">
          {/* Column visibility */}
          <div className="relative">
            <Button
              onClick={() => setVisibilityMenuOpen(!visibilityMenuOpen)}
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1 hover:bg-accent/40"
              aria-label="Toggle Table Columns"
            >
              <Eye className="h-3.5 w-3.5" /> Columns
            </Button>
            <AnimatePresence>
              {visibilityMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setVisibilityMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute right-0 top-10 z-40 w-48 bg-popover border border-border rounded-lg shadow-lg p-2 space-y-0.5"
                  >
                    {colNames.map((col) => (
                      <label
                        key={col}
                        className="flex items-center gap-2 text-xs cursor-pointer p-1 hover:bg-accent/20 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={columnVisibility[col]}
                          onChange={() => toggleColumnVisibility(col)}
                          className="accent-primary"
                        />
                        {col}
                      </label>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1 hover:bg-accent/40"
            aria-label="Export Projects CSV"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Saved Views Presets */}
      <div className="flex items-center justify-between p-2 px-3 rounded-lg bg-card/35 border border-border/40 select-none text-xs gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[9px] font-mono font-black uppercase text-muted-foreground/80 tracking-wide select-none">
            Saved Views:
          </span>
          {savedFilters.length === 0 ? (
            <span className="text-muted-foreground text-[10px] font-semibold italic">
              No custom views saved.
            </span>
          ) : (
            savedFilters.map((preset) => (
              <div
                key={preset.name}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all ${
                  activePresetName === preset.name
                    ? 'bg-primary/10 text-primary border-primary/30 shadow-xs'
                    : 'bg-muted/10 text-muted-foreground border-border hover:bg-muted/20'
                }`}
              >
                <button
                  type="button"
                  onClick={() => loadFilterPreset(preset.name)}
                  className="cursor-pointer font-bold leading-none hover:text-foreground"
                >
                  {preset.name}
                </button>
                <button
                  type="button"
                  onClick={() => deleteFilterPreset(preset.name)}
                  className="cursor-pointer text-muted-foreground/60 hover:text-rose-500 font-extrabold text-[10px] ml-0.5 leading-none transition-colors"
                  aria-label={`Delete filter preset ${preset.name}`}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setPresetName('');
            setIsPresetModalOpen(true);
          }}
          className="text-[10px] font-extrabold uppercase text-primary hover:underline transition-colors tracking-wider flex items-center gap-1 cursor-pointer"
        >
          + Save current view
        </button>
      </div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedRows.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -10 }}
            className="flex items-center justify-between gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20 overflow-hidden select-none flex-wrap"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <span className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center font-black text-[10px]">
                  {selectedRows.length}
                </span>
                selected projects
              </span>
              <Button
                onClick={() => setSelectedRows([])}
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] uppercase font-black tracking-wider text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Status bulk update */}
              <select
                onChange={async (e) => {
                  if (e.target.value) {
                    await executeBulkAction('status', e.target.value, selectedRows);
                    setSelectedRows([]);
                    e.target.value = '';
                  }
                }}
                className="h-7 rounded border border-primary/20 bg-background/80 px-2 text-[10px] text-foreground focus:outline-none cursor-pointer hover:border-primary/50 transition-colors font-bold"
              >
                <option value="">Bulk Status...</option>
                <option value="planning">Planning</option>
                <option value="design">Design</option>
                <option value="development">Development</option>
                <option value="testing">Testing</option>
                <option value="deployment">Deployment</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
              </select>

              {/* Priority bulk update */}
              <select
                onChange={async (e) => {
                  if (e.target.value) {
                    await executeBulkAction('priority', e.target.value, selectedRows);
                    setSelectedRows([]);
                    e.target.value = '';
                  }
                }}
                className="h-7 rounded border border-primary/20 bg-background/80 px-2 text-[10px] text-foreground focus:outline-none cursor-pointer hover:border-primary/50 transition-colors font-bold"
              >
                <option value="">Bulk Priority...</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>

              {/* Tag bulk update */}
              <select
                onChange={async (e) => {
                  if (e.target.value) {
                    await executeBulkAction('tag_add', e.target.value, selectedRows);
                    setSelectedRows([]);
                    e.target.value = '';
                  }
                }}
                className="h-7 rounded border border-primary/20 bg-background/80 px-2 text-[10px] text-foreground focus:outline-none cursor-pointer hover:border-primary/50 transition-colors font-bold"
              >
                <option value="">Bulk Add Tag...</option>
                <option value="Web">Web</option>
                <option value="Mobile">Mobile</option>
                <option value="SaaS">SaaS</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="React">React</option>
              </select>

              {/* Manager bulk update */}
              <select
                onChange={async (e) => {
                  if (e.target.value) {
                    await executeBulkAction('manager', e.target.value, selectedRows);
                    setSelectedRows([]);
                    e.target.value = '';
                  }
                }}
                className="h-7 rounded border border-primary/20 bg-background/80 px-2 text-[10px] text-foreground focus:outline-none cursor-pointer hover:border-primary/50 transition-colors font-bold"
              >
                <option value="">Bulk Reassign PM...</option>
                <option value="John Doe">John Doe</option>
                <option value="Sarah Connor">Sarah Connor</option>
                <option value="Alex Mercer">Alex Mercer</option>
                <option value="Unassigned">Unassigned</option>
              </select>

              {/* Archive bulk update */}
              <Button
                onClick={() => {
                  setIsBulkArchiveConfirmOpen(true);
                }}
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-white transition-colors uppercase font-black tracking-wider"
              >
                Archive Selected
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-border/60">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border/60 bg-card/30">
              <th className="px-3 py-2.5 w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="accent-primary"
                  aria-label="Select all projects"
                />
              </th>
              {columnVisibility['Project Name'] && renderSortHeader('Project', 'name')}
              {columnVisibility['Status'] && renderSortHeader('Status', 'status')}
              {columnVisibility['Priority'] && renderSortHeader('Priority', 'priority')}
              {columnVisibility['Project Manager'] && renderSortHeader('PM', 'projectManager')}
              {columnVisibility['Health Score'] && renderSortHeader('Health', 'healthScore')}
              {columnVisibility['Budget'] && renderSortHeader('Budget', 'budget')}
              {columnVisibility['Deadline'] && renderSortHeader('Deadline', 'deadline')}
              {columnVisibility['Tags'] && (
                <th className="px-3 py-2.5 text-left text-[9px] font-black text-muted-foreground uppercase tracking-wider">
                  Tags
                </th>
              )}
              <th className="px-3 py-2.5 text-right text-[9px] font-black text-muted-foreground uppercase tracking-wider w-16">
                Acts
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {paginatedProjects.length === 0 && (
              <tr>
                <td colSpan={10} className="px-6 py-20 text-center text-xs text-muted-foreground">
                  No projects match the current filters.
                </td>
              </tr>
            )}
            {paginatedProjects.map((project) => (
              <tr
                key={project._id}
                className="hover:bg-card/40 transition-colors cursor-pointer group"
                onClick={() => setSelectedProject(project)}
              >
                <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(project._id)}
                    onChange={() => {
                      setSelectedRows((prev) =>
                        prev.includes(project._id)
                          ? prev.filter((id) => id !== project._id)
                          : [...prev, project._id]
                      );
                    }}
                    className="accent-primary"
                    aria-label={`Select ${project.name}`}
                  />
                </td>
                {columnVisibility['Project Name'] && (
                  <td className="px-3 py-2.5">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-foreground truncate max-w-[200px]">
                        {project.name}
                      </p>
                      <p className="text-[9px] font-mono text-muted-foreground">{project.code}</p>
                    </div>
                  </td>
                )}
                {columnVisibility['Status'] && (
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border select-none ${STATUS_COLORS[project.status] || ''}`}
                    >
                      {project.status}
                    </span>
                  </td>
                )}
                {columnVisibility['Priority'] && (
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border select-none ${PRIORITY_COLORS[project.priority] || ''}`}
                    >
                      {project.priority}
                    </span>
                  </td>
                )}
                {columnVisibility['Project Manager'] && (
                  <td className="px-3 py-2.5 text-xs text-foreground/80 truncate max-w-[120px]">
                    {project.projectManager || 'Unassigned'}
                  </td>
                )}
                {columnVisibility['Health Score'] && (
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            project.healthScore >= 80
                              ? 'bg-emerald-500'
                              : project.healthScore >= 60
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                          }`}
                          style={{ width: `${project.healthScore}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono font-bold">{project.healthScore}%</span>
                    </div>
                  </td>
                )}
                {columnVisibility['Budget'] && (
                  <td className="px-3 py-2.5 text-xs font-mono text-foreground/80">
                    ${(project.budget || 0).toLocaleString()}
                  </td>
                )}
                {columnVisibility['Deadline'] && (
                  <td className="px-3 py-2.5 text-[10px] text-muted-foreground">
                    {project.deadline ? new Date(project.deadline).toLocaleDateString() : '—'}
                  </td>
                )}
                {columnVisibility['Tags'] && (
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1 flex-wrap">
                      {project.tags.slice(0, 2).map((tag) => (
                        <ProjectTagPill key={tag} tag={tag} />
                      ))}
                      {project.tags.length > 2 && (
                        <span className="text-[8px] text-muted-foreground font-bold">
                          +{project.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                )}
                <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="relative inline-block">
                    <button
                      type="button"
                      onClick={() =>
                        setRowMenuOpenId(rowMenuOpenId === project._id ? null : project._id)
                      }
                      className="p-1 rounded hover:bg-accent/40 transition-colors cursor-pointer"
                      aria-label="Project actions"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <AnimatePresence>
                      {rowMenuOpenId === project._id && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setRowMenuOpenId(null)}
                          />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 top-7 z-40 w-40 bg-popover border border-border rounded-lg shadow-lg p-1 space-y-0.5 text-left"
                          >
                            <button
                              onClick={() => {
                                archiveProject(project._id, !project.isArchived);
                                setRowMenuOpenId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2 py-1.5 text-[10px] font-semibold text-foreground hover:bg-accent/30 rounded cursor-pointer"
                            >
                              {project.isArchived ? (
                                <>
                                  <RotateCcw className="h-3 w-3" /> Restore
                                </>
                              ) : (
                                <>
                                  <Archive className="h-3 w-3" /> Archive
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setProjectToDuplicate(project);
                                setDuplicateName(`${project.name} (Copy)`);
                                setIsDuplicateModalOpen(true);
                                setRowMenuOpenId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2 py-1.5 text-[10px] font-semibold text-foreground hover:bg-accent/30 rounded cursor-pointer"
                            >
                              <Copy className="h-3.5 w-3.5" /> Duplicate
                            </button>
                            <button
                              onClick={() => {
                                setProjectToDelete(project);
                                setIsDeleteConfirmOpen(true);
                                setRowMenuOpenId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2 py-1.5 text-[10px] font-semibold text-rose-500 hover:bg-rose-500/10 rounded cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" /> Delete
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-2">
        {paginatedProjects.length === 0 && (
          <div className="py-16 text-center text-xs text-muted-foreground">
            No projects match the current filters.
          </div>
        )}
        {paginatedProjects.map((project) => (
          <div
            key={project._id}
            onClick={() => setSelectedProject(project)}
            className="p-3.5 rounded-lg border border-border/60 bg-card/30 hover:bg-card hover:border-border transition-all cursor-pointer space-y-2"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <h5 className="text-xs font-bold text-foreground">{project.name}</h5>
                <p className="text-[9px] font-mono text-muted-foreground">{project.code}</p>
              </div>
              <span
                className={`inline-flex px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border select-none ${STATUS_COLORS[project.status] || ''}`}
              >
                {project.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
              <span>
                PM:{' '}
                <strong className="text-foreground/80">{project.projectManager || 'N/A'}</strong>
              </span>
              <span>•</span>
              <span>
                Health:{' '}
                <strong
                  className={project.healthScore >= 80 ? 'text-emerald-500' : 'text-amber-500'}
                >
                  {project.healthScore}%
                </strong>
              </span>
              <span>•</span>
              <span>${(project.budget || 0).toLocaleString()}</span>
            </div>
            {project.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {project.tags.slice(0, 3).map((tag) => (
                  <ProjectTagPill key={tag} tag={tag} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-2 select-none">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>
            Showing {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, sortedProjects.length)} of {sortedProjects.length}
          </span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="h-7 rounded border border-border bg-background/50 px-1 text-[10px] focus:outline-none"
          >
            <option value={5}>5/pg</option>
            <option value={10}>10/pg</option>
            <option value={20}>20/pg</option>
            <option value={50}>50/pg</option>
          </select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            onClick={() => setPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((pg) => (
            <Button
              key={pg}
              onClick={() => setPage(pg)}
              variant={currentPage === pg ? 'default' : 'outline'}
              size="sm"
              className="h-7 w-7 p-0 text-[10px]"
            >
              {pg}
            </Button>
          ))}
          <Button
            onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            aria-label="Next page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Save View Preset Modal */}
      <CenteredModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        title="Save View Preset"
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Preset View Name
            </label>
            <input
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="e.g., Active Frontend Sprint"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-border/40 pt-4">
            <Button variant="outline" size="sm" onClick={() => setIsPresetModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                if (presetName.trim()) {
                  saveFilterPreset(presetName.trim());
                  setIsPresetModalOpen(false);
                }
              }}
              disabled={!presetName.trim()}
            >
              Save Preset
            </Button>
          </div>
        </div>
      </CenteredModal>

      {/* Duplicate Project Modal */}
      <CenteredModal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        title="Duplicate Project"
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              New Project Name
            </label>
            <input
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-border/40 pt-4">
            <Button variant="outline" size="sm" onClick={() => setIsDuplicateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={async () => {
                if (projectToDuplicate && duplicateName.trim()) {
                  await duplicateProject(projectToDuplicate._id, duplicateName.trim(), {
                    duplicateMilestones: true,
                    duplicateSprints: true,
                    duplicateTeam: true,
                    duplicateDocuments: true,
                    duplicateRisks: true,
                  });
                  setIsDuplicateModalOpen(false);
                }
              }}
              disabled={!duplicateName.trim()}
            >
              Duplicate
            </Button>
          </div>
        </div>
      </CenteredModal>

      {/* Bulk Archive Confirmation Modal */}
      <ConfirmationModal
        isOpen={isBulkArchiveConfirmOpen}
        onClose={() => setIsBulkArchiveConfirmOpen(false)}
        onConfirm={async () => {
          await executeBulkAction('archive', true, selectedRows);
          setSelectedRows([]);
          setIsBulkArchiveConfirmOpen(false);
        }}
        title="Archive Selected Projects"
        message={`Are you absolutely sure you want to archive the ${selectedRows.length} selected projects?`}
        confirmLabel="Archive"
        cancelLabel="Cancel"
        type="warning"
      />

      {/* Single Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={async () => {
          if (projectToDelete) {
            await deleteProject(projectToDelete._id);
            setIsDeleteConfirmOpen(false);
          }
        }}
        title="Permanently Delete Project"
        message={`Are you absolutely sure you want to delete "${projectToDelete?.name || ''}"? This action is tracked and cannot be undone.`}
        confirmLabel="Delete Project"
        cancelLabel="Cancel"
        type="danger"
      />
    </motion.div>
  );
};
