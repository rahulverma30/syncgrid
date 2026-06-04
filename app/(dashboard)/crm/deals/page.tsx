'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PageHeader,
  Card,
  CardContent,
  Button,
  Input,
  LoadingSpinner,
  ConfirmationModal,
  Select,
} from '@/components/ui';
import {
  TrendingUp,
  Search,
  Filter,
  Plus,
  DollarSign,
  Calendar,
  Clock,
  Trash2,
  Eye,
  Edit2,
  Download,
  Users,
  CheckCircle,
  Tag,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Deal {
  _id: string;
  name: string;
  accountId?: { name: string };
  contactId?: { firstName: string; lastName: string; email: string };
  value: number;
  stage: string;
  priority: string;
  expectedCloseDate?: string;
  createdAt: string;
}

export default function CRMDealsPage() {
  const [mounted, setMounted] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Delete confirm modal states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [dealToDeleteId, setDealToDeleteId] = useState<string | null>(null);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const fetchDeals = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/protected/crm/deals');
      const d = await res.json();
      if (d.success) {
        setDeals(d.data);
      }
    } catch (err) {
      toast.error('Failed to sync pipeline deals.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    fetchDeals();
  }, []);

  const handleRowSelect = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === filteredDeals.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredDeals.map((d) => d._id));
    }
  };

  const handleDeleteDeal = (id: string) => {
    setDealToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleBulkDelete = () => {
    setIsBulkDeleteConfirmOpen(true);
  };

  const handleExportCSV = () => {
    const headers = [
      'Deal / Company',
      'Contact Person',
      'Budget ($)',
      'Stage',
      'Priority',
      'Expected Close',
    ];
    const rows = filteredDeals.map((d) => [
      d.name,
      d.contactId ? `${d.contactId.firstName} ${d.contactId.lastName}` : 'N/A',
      d.value,
      d.stage,
      d.priority || 'medium',
      d.expectedCloseDate ? new Date(d.expectedCloseDate).toISOString().slice(0, 10) : 'None',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((val) => `"${val}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `syncgrid_crm_deals_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Deals ledger exported successfully.');
  };

  const filteredDeals = deals.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.accountId && d.accountId.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter ? d.stage === statusFilter : true;
    const matchesPriority = priorityFilter ? d.priority === priorityFilter : true;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const totalValue = filteredDeals.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const avgBudget = filteredDeals.length > 0 ? Math.round(totalValue / filteredDeals.length) : 0;

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Business Intelligence System"
        title="CRM Deals & Pipeline Ledger"
        description="Monitor sales opportunity pipelines, track customer expected valuations, review stages, and evaluate sales conversions."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/crm/pipeline">
              <Button
                variant="outline"
                size="sm"
                className="h-9 hover:bg-accent/40 text-xs gap-1.5"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                Kanban Pipeline
              </Button>
            </Link>
            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              className="h-9 hover:bg-accent/40 text-xs gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
            <Link href="/crm/deals/create">
              <Button variant="default" size="sm" className="h-9 text-xs gap-1.5">
                <Plus className="h-4 w-4" />
                Create Deal
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl select-none backdrop-blur-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Total Sales Deals
            </span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-2xl font-black font-mono text-white mt-1.5">{deals.length}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Across all pipeline stages</p>
        </Card>

        <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl select-none backdrop-blur-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Estimated Pipeline Value
            </span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black font-mono text-emerald-400 mt-1.5">
            ${totalValue.toLocaleString()}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Expected closing target values</p>
        </Card>

        <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl select-none backdrop-blur-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Average Deal Budget
            </span>
            <CheckCircle className="w-4 h-4 text-purple-500" />
          </div>
          <h3 className="text-2xl font-black font-mono text-purple-400 mt-1.5">
            ${avgBudget.toLocaleString()}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">High conversion threshold</p>
        </Card>
      </div>

      {/* Filter and Control Bar */}
      <Card className="bg-card/30 border border-border/60 p-4 rounded-2xl backdrop-blur-sm">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deals..."
              className="pl-8 h-9 text-xs bg-background/40"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5 bg-background/30 px-3 py-1.5 rounded-xl border border-border/40">
              <Filter className="h-3 w-3 text-slate-400" />
              <Select
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                className="bg-transparent border-0 text-[10px] font-bold uppercase tracking-wider text-slate-300 focus:ring-0 outline-none cursor-pointer"
                options={[
                  { value: 'new', label: 'New' },
                  { value: 'contacted', label: 'Contacted' },
                  { value: 'proposal', label: 'Proposal Sent' },
                  { value: 'negotiation', label: 'Negotiating' },
                  { value: 'won', label: 'Won' },
                  { value: 'lost', label: 'Lost' },
                ]}
              />
            </div>

            <div className="flex items-center gap-1.5 bg-background/30 px-3 py-1.5 rounded-xl border border-border/40">
              <Tag className="h-3 w-3 text-slate-400" />
              <Select
                value={priorityFilter}
                onChange={(val) => setPriorityFilter(val)}
                className="bg-transparent border-0 text-[10px] font-bold uppercase tracking-wider text-slate-300 focus:ring-0 outline-none cursor-pointer"
                options={[
                  { value: 'high', label: 'High' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'low', label: 'Low' },
                ]}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Main ledger grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <LoadingSpinner className="h-8 w-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground animate-pulse font-bold tracking-wider uppercase">
            Syncing corporate sales ledger...
          </p>
        </div>
      ) : (
        <Card className="bg-card/40 border border-border/60 rounded-2xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-background/20 select-none text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        selectedRows.length === filteredDeals.length && filteredDeals.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-border/60 text-primary focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Deal Opportunity</th>
                  <th className="py-3.5 px-4">Budget Target</th>
                  <th className="py-3.5 px-4">Pipeline Stage</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Expected Close</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                <AnimatePresence mode="popLayout">
                  {filteredDeals.map((d) => (
                    <motion.tr
                      key={d._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`hover:bg-slate-900/10 transition-colors ${
                        selectedRows.includes(d._id) ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(d._id)}
                          onChange={() => handleRowSelect(d._id)}
                          className="rounded border-border/60 text-primary focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-white text-sm flex items-center gap-1.5">
                          {d.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-slate-400 text-[10px]">
                          <span>
                            Opportunity contact:{' '}
                            {d.contactId
                              ? `${d.contactId.firstName} ${d.contactId.lastName}`
                              : 'N/A'}
                          </span>
                          {d.contactId?.email && (
                            <>
                              <span>•</span>
                              <span>{d.contactId.email}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-emerald-400">
                        ${d.value?.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 uppercase font-bold tracking-wider text-[10px]">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full border ${
                            d.stage === 'won'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : d.stage === 'lost'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : 'bg-primary/10 text-primary border-primary/20'
                          }`}
                        >
                          {d.stage}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                            d.priority === 'high'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : d.priority === 'medium'
                                ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {d.priority || 'medium'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock className="h-3 w-3" />
                          {d.expectedCloseDate
                            ? new Date(d.expectedCloseDate).toLocaleDateString()
                            : 'Unscheduled'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/crm/deals/${d._id}`}>
                            <button
                              title="View details"
                              className="p-1.5 rounded-lg border border-border/60 hover:bg-primary/10 text-slate-400 hover:text-primary transition-all"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDeleteDeal(d._id)}
                            title="Delete opportunity"
                            className="p-1.5 rounded-lg border border-border/60 hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Bulk actions */}
      <AnimatePresence>
        {selectedRows.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-slate-900 border border-border p-3.5 rounded-2xl shadow-2xl select-none"
          >
            <span className="text-xs font-bold text-slate-300">
              {selectedRows.length} opportunities selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleBulkDelete}
                variant="destructive"
                size="sm"
                className="h-8 text-xs gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Selected
              </Button>
              <Button
                onClick={() => setSelectedRows([])}
                variant="outline"
                size="sm"
                className="h-8 text-xs"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Single Deal Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={async () => {
          if (dealToDeleteId) {
            try {
              const res = await fetch(`/api/protected/crm/deals/${dealToDeleteId}`, {
                method: 'DELETE',
              });
              const d = await res.json();
              if (d.success) {
                setDeals(deals.filter((d) => d._id !== dealToDeleteId));
                toast.success('Sales opportunity deleted.');
              } else {
                toast.error('Unauthorized deletion attempt.');
              }
            } catch (e) {
              toast.error('Error deleting record.');
            } finally {
              setIsDeleteConfirmOpen(false);
            }
          }
        }}
        title="Delete Opportunity Deal"
        message="Are you absolutely sure you want to permanently delete this corporate sales opportunity deal? This action is irreversible."
        confirmLabel="Delete Deal"
        cancelLabel="Cancel"
        type="danger"
      />

      {/* Bulk Deals Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isBulkDeleteConfirmOpen}
        onClose={() => setIsBulkDeleteConfirmOpen(false)}
        onConfirm={async () => {
          let deletedCount = 0;
          for (const id of selectedRows) {
            try {
              const res = await fetch(`/api/protected/crm/deals/${id}`, { method: 'DELETE' });
              const d = await res.json();
              if (d.success) deletedCount++;
            } catch (e) {}
          }
          setDeals(deals.filter((d) => !selectedRows.includes(d._id)));
          setSelectedRows([]);
          setIsBulkDeleteConfirmOpen(false);
          toast.success(`Successfully deleted ${deletedCount} opportunities.`);
        }}
        title="Delete Selected Opportunities"
        message={`Are you sure you want to permanently delete all ${selectedRows.length} selected opportunity deals?`}
        confirmLabel="Delete Selected"
        cancelLabel="Cancel"
        type="danger"
      />
    </div>
  );
}
