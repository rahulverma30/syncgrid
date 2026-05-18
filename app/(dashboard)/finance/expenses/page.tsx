'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader, Card, CardContent, Button, Input, LoadingSpinner } from '@/components/ui';
import {
  DollarSign,
  Search,
  Filter,
  Plus,
  Calendar,
  Clock,
  Trash2,
  Eye,
  Download,
  Users,
  CheckCircle,
  AlertCircle,
  Paperclip,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Expense {
  _id: string;
  category: string;
  amount: number;
  paymentMethod: string;
  payee: string;
  expenseDate: string;
  status: string;
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
}

export default function FinanceExpensesPage() {
  const [mounted, setMounted] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setExpenses([
        {
          _id: 'e1',
          category: 'software',
          amount: 2450,
          paymentMethod: 'Corporate Card',
          payee: 'Amazon Web Services',
          expenseDate: '2026-05-15',
          status: 'approved',
          receiptUrl: 'https://syncgrid.co/receipts/aws_389.pdf',
          notes: 'Production hosting services for enterprise tenants.',
          createdAt: new Date().toISOString(),
        },
        {
          _id: 'e2',
          category: 'marketing',
          amount: 4500,
          paymentMethod: 'ACH Transfer',
          payee: 'Google Ads Platform',
          expenseDate: '2026-05-12',
          status: 'pending',
          receiptUrl: 'https://syncgrid.co/receipts/gads_99.pdf',
          notes: 'Customer acquisition campaign module.',
          createdAt: new Date().toISOString(),
        },
        {
          _id: 'e3',
          category: 'travel',
          amount: 850,
          paymentMethod: 'Reimbursement',
          payee: 'Lucius Fox',
          expenseDate: '2026-05-08',
          status: 'rejected',
          notes: 'Tactical equipment shipping surcharge.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      toast.error('Failed to load expenses list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    fetchExpenses();
  }, []);

  const handleRowSelect = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === filteredExpenses.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredExpenses.map((e) => e._id));
    }
  };

  const handleDeleteExpense = (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this expense item?')) return;
    setExpenses(expenses.filter((e) => e._id !== id));
    toast.success('Expense item permanently deleted.');
  };

  const handleBulkDelete = () => {
    if (!confirm(`Delete ${selectedRows.length} selected expenses permanently?`)) return;
    setExpenses(expenses.filter((e) => !selectedRows.includes(e._id)));
    setSelectedRows([]);
    toast.success('Successfully deleted selected expenses.');
  };

  const handleApproveExpense = (id: string) => {
    setExpenses(expenses.map((e) => (e._id === id ? { ...e, status: 'approved' } : e)));
    toast.success('Expense item approved successfully.');
  };

  const handleExportCSV = () => {
    const headers = ['Category', 'Amount', 'Payee', 'Date', 'Method', 'Status'];
    const rows = filteredExpenses.map((e) => [
      e.category,
      e.amount,
      e.payee,
      e.expenseDate,
      e.paymentMethod,
      e.status,
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
      `syncgrid_finance_expenses_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Expenses ledger exported successfully.');
  };

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.payee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter ? e.category === categoryFilter : true;
    const matchesStatus = statusFilter ? e.status === statusFilter : true;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalValue = filteredExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const pendingCount = filteredExpenses.filter((e) => e.status === 'pending').length;

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Financial Operations Suite"
        title="Expense Tracker Ledger"
        description="Monitor corporate burn rates, organize operational expense claims, review files uploads, and authorize payment approvals."
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
            <Link href="/finance/expenses/create">
              <Button variant="default" size="sm" className="h-9 text-xs gap-1.5">
                <Plus className="h-4 w-4" />
                Record Expense
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI metrics */}
      <div className="grid gap-4 sm:grid-cols-3 select-none">
        <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl backdrop-blur-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Total Expense Ledger
            </span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black font-mono text-emerald-400 mt-1.5">
            ${totalValue.toLocaleString()}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Across all matching parameters</p>
        </Card>

        <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl backdrop-blur-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Pending Approvals
            </span>
            <Clock className="w-4 h-4 text-yellow-500" />
          </div>
          <h3 className="text-2xl font-black font-mono text-white mt-1.5">{pendingCount}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Awaiting multi-tier authorization</p>
        </Card>

        <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl backdrop-blur-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Approved Claims</span>
            <CheckCircle className="w-4 h-4 text-purple-500" />
          </div>
          <h3 className="text-2xl font-black font-mono text-purple-400 mt-1.5">
            {filteredExpenses.filter((e) => e.status === 'approved').length}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Processed and settled payouts</p>
        </Card>
      </div>

      {/* Control filters bar */}
      <Card className="bg-card/30 border border-border/60 p-4 rounded-2xl backdrop-blur-sm">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search payee or notes..."
              className="pl-8 h-9 text-xs bg-background/40"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5 bg-background/30 px-3 py-1.5 rounded-xl border border-border/40">
              <Filter className="h-3 w-3 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent border-0 text-[10px] font-bold uppercase tracking-wider text-slate-300 focus:ring-0 outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900">
                  All Categories
                </option>
                <option value="software" className="bg-slate-900">
                  Software / SaaS
                </option>
                <option value="marketing" className="bg-slate-900">
                  Marketing
                </option>
                <option value="travel" className="bg-slate-900">
                  Travel
                </option>
                <option value="office" className="bg-slate-900">
                  Office Ops
                </option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-background/30 px-3 py-1.5 rounded-xl border border-border/40">
              <Clock className="h-3 w-3 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-0 text-[10px] font-bold uppercase tracking-wider text-slate-300 focus:ring-0 outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900">
                  All Statuses
                </option>
                <option value="pending" className="bg-slate-900">
                  Pending
                </option>
                <option value="approved" className="bg-slate-900">
                  Approved
                </option>
                <option value="rejected" className="bg-slate-900">
                  Rejected
                </option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Ledger table grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <LoadingSpinner className="h-8 w-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground animate-pulse font-bold tracking-wider uppercase">
            Syncing expenses...
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
                        selectedRows.length === filteredExpenses.length &&
                        filteredExpenses.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-border/60 text-primary focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Payee / Notes</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4">Approval</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                <AnimatePresence mode="popLayout">
                  {filteredExpenses.map((e) => (
                    <motion.tr
                      key={e._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`hover:bg-slate-900/10 transition-colors ${
                        selectedRows.includes(e._id) ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(e._id)}
                          onChange={() => handleRowSelect(e._id)}
                          className="rounded border-border/60 text-primary focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-white text-sm flex items-center gap-1.5">
                          {e.payee}
                          {e.receiptUrl && (
                            <a
                              href={e.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Receipt file attached"
                              className="text-primary hover:text-primary-light"
                            >
                              <Paperclip className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed max-w-xs">
                          {e.notes}
                        </p>
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-emerald-400">
                        ${e.amount?.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 uppercase font-bold text-[9px] tracking-wider text-purple-400">
                        {e.category}
                      </td>
                      <td className="py-4 px-4 text-slate-400">{e.expenseDate}</td>
                      <td className="py-4 px-4 text-slate-300">{e.paymentMethod}</td>
                      <td className="py-4 px-4 uppercase font-bold tracking-wider text-[10px]">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full border ${
                            e.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : e.status === 'rejected'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          }`}
                        >
                          {e.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/finance/expenses/${e._id}`}>
                            <button
                              title="View details"
                              className="p-1.5 rounded-lg border border-border/60 hover:bg-primary/10 text-slate-400 hover:text-primary transition-all"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                          {e.status === 'pending' && (
                            <button
                              onClick={() => handleApproveExpense(e._id)}
                              title="Approve expense claim"
                              className="p-1.5 rounded-lg border border-border/60 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-500 transition-all"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteExpense(e._id)}
                            title="Delete expense item"
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
              {selectedRows.length} expenses selected
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
    </div>
  );
}
