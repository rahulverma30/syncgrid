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
  Building2,
  Search,
  Filter,
  Plus,
  Globe,
  DollarSign,
  Heart,
  TrendingUp,
  Trash2,
  Eye,
  Edit2,
  Download,
  Users,
  Briefcase,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Account {
  _id: string;
  name: string;
  revenue: number;
  ownerId?: { _id: string; name: string; email: string };
  createdAt: string;
  industry?: string;
  healthScore?: number;
  website?: string;
}

export default function CRMAccountsPage() {
  const [mounted, setMounted] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Delete confirm modal states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [accountToDeleteId, setAccountToDeleteId] = useState<string | null>(null);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [industryFilter, setIndustryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/protected/crm/accounts');
      const d = await res.json();
      if (d.success) {
        setAccounts(d.data);
      }
    } catch (err) {
      toast.error('Failed to sync accounts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    fetchAccounts();
  }, []);

  const handleRowSelect = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === filteredAccounts.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredAccounts.map((a) => a._id));
    }
  };

  const handleDeleteAccount = (id: string) => {
    setAccountToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleBulkDelete = () => {
    setIsBulkDeleteConfirmOpen(true);
  };

  const handleExportCSV = () => {
    const headers = ['Account Name', 'Industry', 'Revenue ($)', 'Owner'];
    const rows = filteredAccounts.map((a) => [
      a.name,
      a.industry || '',
      a.revenue,
      a.ownerId?.name || '',
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
      `syncgrid_crm_accounts_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Accounts list exported successfully.');
  };

  const filteredAccounts = accounts.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.industry && a.industry.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.ownerId?.name && a.ownerId.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesIndustry = industryFilter
      ? a.industry?.toLowerCase() === industryFilter.toLowerCase()
      : true;

    return matchesSearch && matchesIndustry;
  });

  const totalValue = filteredAccounts.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
  const avgHealth =
    filteredAccounts.length > 0
      ? Math.round(
          filteredAccounts.reduce((acc, curr) => acc + (curr.healthScore || 0), 0) /
            filteredAccounts.length
        )
      : 0;

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Relationship Intelligence System"
        title="CRM Accounts / Companies"
        description="Monitor corporate client profiles, track company segments, review onboarding progress, and evaluate client health indicators."
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              className="h-9 hover:bg-accent/40 text-xs gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
            <Link href="/crm/accounts/create">
              <Button variant="default" size="sm" className="h-9 text-xs gap-1.5">
                <Plus className="h-4 w-4" />
                Add Account
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
              Active Corporate Clients
            </span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-2xl font-black font-mono text-white mt-1.5">{accounts.length}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Enterprise & Startup organizations</p>
        </Card>

        <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl select-none backdrop-blur-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Combined Value Contribution
            </span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black font-mono text-emerald-400 mt-1.5">
            ${totalValue.toLocaleString()}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Annual recurring revenue metrics</p>
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
              placeholder="Search companies..."
              className="pl-8 h-9 text-xs bg-background/40"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5 bg-background/30 px-3 py-1.5 rounded-xl border border-border/40">
              <Filter className="h-3 w-3 text-slate-400" />
              <Select
                value={industryFilter}
                onChange={(val) => setIndustryFilter(val)}
                className="bg-transparent border-0 text-[10px] font-bold uppercase tracking-wider text-slate-300 focus:ring-0 outline-none cursor-pointer"
                options={[
                  { value: 'saas', label: 'SaaS' },
                  { value: 'biotech', label: 'Biotech' },
                  { value: 'retail', label: 'Retail' },
                  { value: 'ecommerce', label: 'E-Commerce' },
                ]}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Main Table grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <LoadingSpinner className="h-8 w-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground animate-pulse font-bold tracking-wider uppercase">
            Syncing client company list...
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
                        selectedRows.length === filteredAccounts.length &&
                        filteredAccounts.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-border/60 text-primary focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Company</th>
                  <th className="py-3.5 px-4">Industry</th>
                  <th className="py-3.5 px-4">Revenue</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                <AnimatePresence mode="popLayout">
                  {filteredAccounts.map((a) => (
                    <motion.tr
                      key={a._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`hover:bg-slate-900/10 transition-colors ${
                        selectedRows.includes(a._id) ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(a._id)}
                          onChange={() => handleRowSelect(a._id)}
                          className="rounded border-border/60 text-primary focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-white text-sm flex items-center gap-1.5">
                          {a.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-slate-400 text-[10px]">
                          <span className="flex items-center gap-0.5">
                            <Globe className="h-3 w-3" />
                            {a.website || 'No website'}
                          </span>
                          <span>•</span>
                          <span>Managed by {a.ownerId?.name || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-300">
                          {a.industry || 'Unknown'}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-emerald-400">
                        ${a.revenue?.toLocaleString() || 0} / yr
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/crm/accounts/${a._id}`}>
                            <button
                              title="View Account"
                              className="p-1.5 rounded-lg border border-border/60 hover:bg-primary/10 text-slate-400 hover:text-primary transition-all"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                          <Link href={`/crm/accounts/${a._id}/edit`}>
                            <button
                              title="Edit Details"
                              className="p-1.5 rounded-lg border border-border/60 hover:bg-blue-500/10 text-slate-400 hover:text-blue-400 transition-all"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDeleteAccount(a._id)}
                            title="Delete Account"
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

      {/* Floating Bulk Actions */}
      <AnimatePresence>
        {selectedRows.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-slate-900 border border-border p-3.5 rounded-2xl shadow-2xl select-none"
          >
            <span className="text-xs font-bold text-slate-300">
              {selectedRows.length} accounts selected
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

      {/* Single Account Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={async () => {
          if (accountToDeleteId) {
            try {
              const res = await fetch(`/api/protected/crm/accounts/${accountToDeleteId}`, {
                method: 'DELETE',
              });
              const d = await res.json();
              if (d.success) {
                setAccounts(accounts.filter((a) => a._id !== accountToDeleteId));
                toast.success('Account permanently deleted.');
              } else {
                toast.error('Unauthorized deletion attempt.');
              }
            } catch (e) {
              toast.error('Error deleting account record.');
            } finally {
              setIsDeleteConfirmOpen(false);
            }
          }
        }}
        title="Delete Corporate Account"
        message="Are you absolutely sure you want to permanently delete this corporate client account? This will clear organization segments, manager assignments, and annual revenue metrics."
        confirmLabel="Delete Account"
        cancelLabel="Cancel"
        type="danger"
      />

      {/* Bulk Accounts Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isBulkDeleteConfirmOpen}
        onClose={() => setIsBulkDeleteConfirmOpen(false)}
        onConfirm={async () => {
          let deletedCount = 0;
          for (const id of selectedRows) {
            try {
              const res = await fetch(`/api/protected/crm/accounts/${id}`, { method: 'DELETE' });
              const d = await res.json();
              if (d.success) deletedCount++;
            } catch (e) {}
          }
          setAccounts(accounts.filter((a) => !selectedRows.includes(a._id)));
          setSelectedRows([]);
          setIsBulkDeleteConfirmOpen(false);
          toast.success(`Successfully deleted ${deletedCount} accounts.`);
        }}
        title="Delete Selected Accounts"
        message={`Are you sure you want to permanently delete all ${selectedRows.length} selected corporate accounts?`}
        confirmLabel="Delete Selected"
        cancelLabel="Cancel"
        type="danger"
      />
    </div>
  );
}
