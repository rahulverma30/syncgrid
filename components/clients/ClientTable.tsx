import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Input,
  Badge,
  CenteredModal,
  ConfirmationModal,
  Select,
  EmptyState,
  SkeletonTable,
  SkeletonCard,
  Pagination,
} from '@/components/ui';
import {
  Search,
  Download,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  RefreshCw,
  Archive,
  RotateCcw,
} from 'lucide-react';
import { useClientsStore, ClientAccount } from '@/store/clientsStore';
import { motion, AnimatePresence } from 'framer-motion';
import { TagPill } from './ClientTagSelector';
import { toast } from 'sonner';

interface ClientRowProps {
  acc: ClientAccount;
  isSelected: boolean;
  columnVisibility: Record<string, boolean>;
  setSelectedClient: (client: ClientAccount | null) => void;
  handleRowSelect: (id: string, checked: boolean) => void;
  archiveClient: (id: string, archiveState: boolean) => Promise<void>;
  setClientToDelete: (client: ClientAccount | null) => void;
  setIsDeleteConfirmOpen: (open: boolean) => void;
}

const ClientRow: React.FC<ClientRowProps> = React.memo(
  ({
    acc,
    isSelected,
    columnVisibility,
    setSelectedClient,
    handleRowSelect,
    archiveClient,
    setClientToDelete,
    setIsDeleteConfirmOpen,
  }) => {
    const router = useRouter();
    return (
      <tr
        onClick={() => router.push(`/clients/${acc._id}`)}
        className={`cursor-pointer group ${isSelected ? 'table-row-selected table-row' : 'table-row'}`}
      >
        <td className="table-body-cell" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => handleRowSelect(acc._id, e.target.checked)}
            className="rounded border-border focus:ring-ring accent-primary"
          />
        </td>
        {columnVisibility['Client Company'] && (
          <td className="table-body-cell font-bold text-foreground hover:text-primary transition-colors">
            {acc.name}
          </td>
        )}
        {columnVisibility['Classification'] && (
          <td className="table-body-cell">
            <span
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border select-none"
              style={{
                backgroundColor:
                  acc.clientType === 'VIP'
                    ? 'rgba(234, 179, 8, 0.1)'
                    : acc.clientType === 'Enterprise'
                      ? 'rgba(168, 85, 247, 0.1)'
                      : 'rgba(59, 130, 246, 0.1)',
                color:
                  acc.clientType === 'VIP'
                    ? '#eab308'
                    : acc.clientType === 'Enterprise'
                      ? '#a855f7'
                      : '#3b82f6',
                borderColor:
                  acc.clientType === 'VIP'
                    ? 'rgba(234, 179, 8, 0.2)'
                    : acc.clientType === 'Enterprise'
                      ? 'rgba(168, 85, 247, 0.2)'
                      : 'rgba(59, 130, 246, 0.2)',
              }}
            >
              {acc.clientType}
            </span>
          </td>
        )}
        {columnVisibility['Industry'] && (
          <td className="table-body-cell uppercase text-[10px] font-bold text-muted-foreground font-mono">
            {acc.industry}
          </td>
        )}
        {columnVisibility['Account Owner'] && (
          <td className="table-body-cell font-semibold text-foreground/80">{acc.accountManager}</td>
        )}
        {columnVisibility['Health Index'] && (
          <td className="table-body-cell font-mono font-bold">
            <span
              className={
                acc.healthScore >= 90
                  ? 'text-emerald-500'
                  : acc.healthScore >= 75
                    ? 'text-amber-500'
                    : 'text-rose-500'
              }
            >
              {acc.healthScore}%
            </span>
          </td>
        )}
        {columnVisibility['ARR Yield'] && (
          <td className="table-body-cell font-mono font-bold text-primary">
            ${acc.revenueContribution.toLocaleString()}
          </td>
        )}
        {columnVisibility['Tags'] && (
          <td className="table-body-cell">
            <div className="flex flex-wrap gap-1">
              {acc.tags?.slice(0, 2).map((t) => (
                <TagPill key={t} tag={t} />
              ))}
              {acc.tags?.length > 2 && (
                <span className="text-[10px] text-muted-foreground font-bold px-1 select-none">
                  +{acc.tags.length - 2}
                </span>
              )}
            </div>
          </td>
        )}
        <td className="table-body-cell text-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-end gap-1.5">
            {acc.isArchived ? (
              <Button
                onClick={() => archiveClient(acc._id, false)}
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500 flex items-center gap-1 font-bold text-[10px]"
                aria-label={`Restore Client ${acc.name}`}
              >
                <RotateCcw className="h-3 w-3" /> Restore
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => archiveClient(acc._id, true)}
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                  aria-label={`Archive Client ${acc.name}`}
                >
                  <Archive className="h-3.5 w-3.5" />
                </Button>
                <Button
                  onClick={() => {
                    setClientToDelete(acc);
                    setIsDeleteConfirmOpen(true);
                  }}
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                  aria-label={`Delete Client ${acc.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  }
);
ClientRow.displayName = 'ClientRow';

export const ClientTable: React.FC = () => {
  const {
    clients,
    isLoading,
    setSelectedClient,
    searchQuery,
    typeFilter,
    onboardingFilter,
    retentionFilter,
    managerFilter,
    selectedTags,
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
    archiveClient,
    deleteClient,
    bulkUpdateManager,
    savedFilters,
    activePresetName,
    saveFilterPreset,
    loadFilterPreset,
    deleteFilterPreset,
  } = useClientsStore();

  const router = useRouter();

  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [bulkManager, setBulkManager] = useState('');
  const [visibilityMenuOpen, setVisibilityMenuOpen] = useState(false);

  // Custom Modal States
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [presetName, setPresetName] = useState('');

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientAccount | null>(null);

  // 1. Client-Side Sorting
  const sortedClients = [...clients].sort((a: any, b: any) => {
    if (!sortColumn) return 0;

    let aVal = a[sortColumn];
    let bVal = b[sortColumn];

    // Handle nested dates or fallback values safely
    if (sortColumn === 'createdDate') {
      aVal = new Date(a.createdAt).getTime();
      bVal = new Date(b.createdAt).getTime();
    } else if (sortColumn === 'updatedAt') {
      aVal = new Date(a.updatedAt).getTime();
      bVal = new Date(b.updatedAt).getTime();
    }

    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;

    if (typeof aVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  // 2. Client-Side Pagination
  const totalItems = sortedClients.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedClients = sortedClients.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Toggle all row selections
  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(paginatedClients.map((c) => c._id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleRowSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRows([...selectedRows, id]);
    } else {
      setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
    }
  };

  const handleBulkReassign = () => {
    if (!bulkManager) {
      toast.error('Please choose a manager for bulk reassignment.');
      return;
    }
    bulkUpdateManager(selectedRows, bulkManager);
    setSelectedRows([]);
    setBulkManager('');
  };

  // Excel/CSV Exporter
  const handleExportCSV = () => {
    if (clients.length === 0) {
      toast.error('Ledger is empty. Zero accounts to export.');
      return;
    }

    const headers = [
      'ID',
      'Company Name',
      'Classification',
      'Industry',
      'Account Manager',
      'Onboarding Status',
      'Retention Status',
      'Health Score',
      'ARR Contribution ($)',
      'Tags',
      'Is Archived',
    ];

    const rows = clients.map((c) => [
      c._id,
      `"${c.name.replace(/"/g, '""')}"`,
      c.clientType,
      c.industry,
      c.accountManager,
      c.onboardingStatus,
      c.retentionStatus,
      c.healthScore,
      c.revenueContribution,
      `"${c.tags.join(',')}"`,
      c.isArchived,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `syncgrid_clients_ledger_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Successfully serialized ledger to CSV spreadsheet download!');
  };

  const renderSortIndicator = (col: keyof ClientAccount | 'createdDate') => {
    if (sortColumn !== col) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 text-primary ml-1 inline-block" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-primary ml-1 inline-block" />
    );
  };

  return (
    <motion.div
      key="ledger"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-4 text-left"
    >
      {/* Ledger filters & Export & View Columns */}
      <div className="flex justify-between items-center flex-wrap gap-3 pb-3 border-b border-border/40 select-none">
        <div className="flex gap-2 flex-wrap items-center">
          <div className="w-40">
            <Select
              value={typeFilter}
              onChange={(value) => setFilters({ typeFilter: value })}
              options={[
                { value: '', label: 'All Classifications' },
                { value: 'VIP', label: 'VIP' },
                { value: 'Enterprise', label: 'Enterprise' },
                { value: 'Startup', label: 'Startup' },
                { value: 'Retainer', label: 'Retainer' },
                { value: 'High Value', label: 'High Value' },
                { value: 'Inactive', label: 'Inactive' },
              ]}
              className="h-8 text-xs rounded-lg px-2"
            />
          </div>

          <div className="w-44">
            <Select
              value={onboardingFilter}
              onChange={(value) => setFilters({ onboardingFilter: value })}
              options={[
                { value: '', label: 'All Onboard Progress' },
                { value: 'pending', label: 'Pending Onboarding' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
              ]}
              className="h-8 text-xs rounded-lg px-2"
            />
          </div>

          <div className="w-44">
            <Select
              value={retentionFilter}
              onChange={(value) => setFilters({ retentionFilter: value })}
              options={[
                { value: '', label: 'All Retention status' },
                { value: 'retained', label: 'Retained (Stable)' },
                { value: 'churn-risk', label: 'Churn Risk' },
                { value: 'churned', label: 'Churned' },
              ]}
              className="h-8 text-xs rounded-lg px-2"
            />
          </div>

          <div className="w-40">
            <Select
              value={isArchivedFilter ? 'archived' : 'active'}
              onChange={(value) => setFilters({ isArchivedFilter: value === 'archived' })}
              options={[
                { value: 'active', label: 'Active Accounts' },
                { value: 'archived', label: 'Archived Recoveries' },
              ]}
              className="h-8 text-xs rounded-lg px-2"
            />
          </div>

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
          {/* Column Visibility Checkboxes */}
          <div className="relative">
            <Button
              onClick={() => setVisibilityMenuOpen(!visibilityMenuOpen)}
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1 hover:bg-accent/40"
              aria-label="Toggle Table Columns"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Columns
            </Button>
            <AnimatePresence>
              {visibilityMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setVisibilityMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-xl shadow-xl p-3 space-y-2 z-20 text-xs text-popover-foreground"
                  >
                    <p className="font-bold border-b border-border/30 pb-1.5 mb-1 text-muted-foreground uppercase text-[9px] tracking-wide select-none">
                      Show/Hide Columns
                    </p>
                    {Object.keys(columnVisibility).map((col) => (
                      <label
                        key={col}
                        className="flex items-center gap-2 cursor-pointer py-0.5 hover:text-foreground text-muted-foreground transition-colors select-none"
                      >
                        <input
                          type="checkbox"
                          checked={columnVisibility[col]}
                          onChange={() => toggleColumnVisibility(col)}
                          className="rounded border-border focus:ring-ring"
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
            aria-label="Export Client Ledger to CSV Spreadsheet"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Saved View Presets Quick Select Toolbar */}
      <div className="flex items-center justify-between p-2 px-3 rounded-lg bg-card/35 border border-border/40 select-none text-xs gap-3 flex-wrap animate-fade-in">
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
          + Save current view as Preset
        </button>
      </div>

      {/* Bulk Action Controls */}
      <AnimatePresence>
        {selectedRows.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-3 bg-primary/5 rounded-xl border border-primary/20 flex justify-between items-center flex-wrap gap-2 text-xs"
          >
            <span className="font-bold text-foreground">
              Selected <span className="font-mono text-primary">{selectedRows.length}</span> client
              accounts
            </span>
            <div className="flex gap-2 items-center">
              <div className="w-48">
                <Select
                  value={bulkManager}
                  onChange={(value) => setBulkManager(value)}
                  options={[
                    { value: '', label: 'Reassign Owner...' },
                    { value: 'Pepper Potts', label: 'Pepper Potts' },
                    { value: 'Lucius Fox', label: 'Lucius Fox' },
                    { value: 'Samantha Vance', label: 'Samantha Vance' },
                  ]}
                  className="h-8 text-xs rounded-lg px-2"
                />
              </div>
              <Button onClick={handleBulkReassign} size="sm" className="h-8 text-xs font-bold">
                Apply Reassignment
              </Button>
              <Button
                onClick={() => setSelectedRows([])}
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RENDER MODE 1: DESKTOP TABLE VIEW */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-border/80 bg-card/25 backdrop-blur-md">
        {isLoading ? (
          <div className="p-4">
            <SkeletonTable rows={5} cols={8} />
          </div>
        ) : (
          <table className="table-container">
            <thead>
              <tr className="table-header-row">
                <th className="table-header-cell w-10">
                  <input
                    type="checkbox"
                    checked={
                      paginatedClients.length > 0 &&
                      paginatedClients.every((c) => selectedRows.includes(c._id))
                    }
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="rounded border-border focus:ring-ring accent-primary"
                  />
                </th>
                {columnVisibility['Client Company'] && (
                  <th
                    onClick={() => setSort('name')}
                    className="table-header-cell cursor-pointer hover:text-foreground transition-colors"
                  >
                    Client Company {renderSortIndicator('name')}
                  </th>
                )}
                {columnVisibility['Classification'] && (
                  <th
                    onClick={() => setSort('clientType')}
                    className="table-header-cell cursor-pointer hover:text-foreground transition-colors"
                  >
                    Classification {renderSortIndicator('clientType')}
                  </th>
                )}
                {columnVisibility['Industry'] && (
                  <th
                    onClick={() => setSort('industry')}
                    className="table-header-cell cursor-pointer hover:text-foreground transition-colors"
                  >
                    Industry {renderSortIndicator('industry')}
                  </th>
                )}
                {columnVisibility['Account Owner'] && (
                  <th
                    onClick={() => setSort('accountManager')}
                    className="table-header-cell cursor-pointer hover:text-foreground transition-colors"
                  >
                    Account Owner {renderSortIndicator('accountManager')}
                  </th>
                )}
                {columnVisibility['Health Index'] && (
                  <th
                    onClick={() => setSort('healthScore')}
                    className="table-header-cell cursor-pointer hover:text-foreground transition-colors"
                  >
                    Health Index {renderSortIndicator('healthScore')}
                  </th>
                )}
                {columnVisibility['ARR Yield'] && (
                  <th
                    onClick={() => setSort('revenueContribution')}
                    className="table-header-cell cursor-pointer hover:text-foreground transition-colors"
                  >
                    ARR Yield {renderSortIndicator('revenueContribution')}
                  </th>
                )}
                {columnVisibility['Tags'] && <th className="table-header-cell">Tags</th>}
                <th className="table-header-cell text-right w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {paginatedClients.map((acc) => (
                <ClientRow
                  key={acc._id}
                  acc={acc}
                  isSelected={selectedRows.includes(acc._id)}
                  columnVisibility={columnVisibility}
                  setSelectedClient={setSelectedClient}
                  handleRowSelect={handleRowSelect}
                  archiveClient={archiveClient}
                  setClientToDelete={setClientToDelete}
                  setIsDeleteConfirmOpen={setIsDeleteConfirmOpen}
                />
              ))}
              {paginatedClients.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-0 border-none">
                    <div className="py-12">
                      <EmptyState
                        title="No clients found"
                        description="Zero registered customer accounts match active search filters."
                        variant="search"
                      />
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* RENDER MODE 2: MOBILE STACK CARDS RENDER */}
      <div className="block sm:hidden space-y-3">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            {paginatedClients.map((acc) => (
              <div
                key={acc._id}
                onClick={() => router.push(`/clients/${acc._id}`)}
                className={`p-4 rounded-xl border border-border/80 bg-card/40 backdrop-blur-md space-y-3 hover:border-primary/40 cursor-pointer transition-all ${
                  selectedRows.includes(acc._id) ? 'ring-1 ring-primary bg-primary/5' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-bold text-foreground text-sm">{acc.name}</h4>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      {acc.industry} • Owner: {acc.accountManager}
                    </p>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(acc._id)}
                      onChange={(e) => handleRowSelect(acc._id, e.target.checked)}
                      className="rounded border-border focus:ring-ring"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[10px] bg-muted/20 p-2 rounded-lg">
                  <div>
                    <span className="block text-muted-foreground text-[8px] uppercase font-bold">
                      Class
                    </span>
                    <span className="font-bold text-foreground">{acc.clientType}</span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground text-[8px] uppercase font-bold">
                      ARR Yield
                    </span>
                    <span className="font-bold text-primary">
                      ${acc.revenueContribution.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground text-[8px] uppercase font-bold">
                      Health
                    </span>
                    <span
                      className={`font-bold ${
                        acc.healthScore >= 90
                          ? 'text-emerald-500'
                          : acc.healthScore >= 75
                            ? 'text-amber-500'
                            : 'text-rose-500'
                      }`}
                    >
                      {acc.healthScore}%
                    </span>
                  </div>
                </div>

                {acc.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {acc.tags.map((t) => (
                      <TagPill key={t} tag={t} />
                    ))}
                  </div>
                )}

                <div
                  className="flex justify-end gap-2 border-t border-border/30 pt-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {acc.isArchived ? (
                    <Button
                      onClick={() => archiveClient(acc._id, false)}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10 flex items-center gap-1 font-bold"
                    >
                      <RotateCcw className="h-3 w-3" /> Restore Profile
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={() => archiveClient(acc._id, true)}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs text-amber-500 border-amber-500/20 hover:bg-amber-500/10 flex items-center gap-1 font-bold"
                      >
                        <Archive className="h-3 w-3" /> Archive
                      </Button>
                      <Button
                        onClick={() => {
                          setClientToDelete(acc);
                          setIsDeleteConfirmOpen(true);
                        }}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs text-rose-500 border-rose-500/20 hover:bg-rose-500/10 flex items-center gap-1 font-bold"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {paginatedClients.length === 0 && (
              <div className="py-12">
                <EmptyState
                  title="No clients found"
                  description="Zero registered customer accounts match active search filters."
                  variant="search"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Pagination Controls Footer */}
      <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[5, 10, 20, 50]}
      />

      {/* Save Ledger View Preset Modal */}
      <CenteredModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        title="Save Custom View Preset"
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
              placeholder="e.g., Startup VIP Accounts"
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

      {/* Delete Client Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={async () => {
          if (clientToDelete) {
            await deleteClient(clientToDelete._id);
            setIsDeleteConfirmOpen(false);
          }
        }}
        title="Delete Customer Account"
        message={`Are you absolutely sure you want to delete the corporate profile for "${clientToDelete?.name || ''}"? This action is tracked and cannot be undone.`}
        confirmLabel="Delete Account"
        cancelLabel="Cancel"
        type="danger"
      />
    </motion.div>
  );
};
