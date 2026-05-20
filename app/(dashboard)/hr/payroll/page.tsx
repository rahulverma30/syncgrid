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
  FileText,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface PayrollRun {
  _id: string;
  payPeriod: string;
  grossAmount: number;
  taxWithheld: number;
  netAmount: number;
  employeeCount: number;
  paymentDate: string;
  status: string;
  createdAt: string;
}

export default function HRPayrollPage() {
  const [mounted, setMounted] = useState(false);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('');

  // Delete confirm modal states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [runToDeleteId, setRunToDeleteId] = useState<string | null>(null);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  const fetchPayrollRuns = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setPayrollRuns([
        {
          _id: 'pr1',
          payPeriod: 'May 2026',
          grossAmount: 32500,
          taxWithheld: 3250,
          netAmount: 29250,
          employeeCount: 3,
          paymentDate: '2026-05-31',
          status: 'draft',
          createdAt: new Date().toISOString(),
        },
        {
          _id: 'pr2',
          payPeriod: 'April 2026',
          grossAmount: 32500,
          taxWithheld: 3250,
          netAmount: 29250,
          employeeCount: 3,
          paymentDate: '2026-04-30',
          status: 'paid',
          createdAt: new Date().toISOString(),
        },
        {
          _id: 'pr3',
          payPeriod: 'March 2026',
          grossAmount: 28000,
          taxWithheld: 2800,
          netAmount: 25200,
          employeeCount: 2,
          paymentDate: '2026-03-31',
          status: 'paid',
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      toast.error('Failed to load payroll logs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    fetchPayrollRuns();
  }, []);

  const handleRowSelect = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === filteredRuns.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredRuns.map((p) => p._id));
    }
  };

  const handleDeleteRun = (id: string) => {
    setRunToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleBulkDelete = () => {
    setIsBulkDeleteConfirmOpen(true);
  };

  const handleExportCSV = () => {
    const headers = [
      'Pay Period',
      'Gross Amount ($)',
      'Tax Withheld ($)',
      'Net Amount ($)',
      'Employees Count',
      'Date',
      'Status',
    ];
    const rows = filteredRuns.map((p) => [
      p.payPeriod,
      p.grossAmount,
      p.taxWithheld,
      p.netAmount,
      p.employeeCount,
      p.paymentDate,
      p.status,
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
      `syncgrid_hr_payroll_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Payroll distributions exported successfully.');
  };

  const filteredRuns = payrollRuns.filter((p) => {
    const matchesSearch = p.payPeriod.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? p.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const grossSpend = filteredRuns.reduce((acc, curr) => acc + (curr.grossAmount || 0), 0);
  const netSpend = filteredRuns.reduce((acc, curr) => acc + (curr.netAmount || 0), 0);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Human Resources Infrastructure"
        title="HR Payroll Control Center"
        description="Oversee gross compensation accounts, track monthly tax withholdings, authorize payroll distributions, and audit processed employee payslips."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/hr/payslips">
              <Button
                variant="outline"
                size="sm"
                className="h-9 hover:bg-accent/40 text-xs gap-1.5"
              >
                <FileText className="h-3.5 w-3.5" />
                Payslips ledger
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
            <Link href="/hr/payroll/run">
              <Button variant="default" size="sm" className="h-9 text-xs gap-1.5">
                <Plus className="h-4 w-4" />
                Run Payroll
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI stats */}
      <div className="grid gap-4 sm:grid-cols-3 select-none">
        <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl backdrop-blur-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Gross Outlay Liability
            </span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black font-mono text-white mt-1.5">
            ${grossSpend.toLocaleString()}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Pre-tax annual baseline exposure</p>
        </Card>

        <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl backdrop-blur-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Net Settled Cash</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black font-mono text-emerald-400 mt-1.5">
            ${netSpend.toLocaleString()}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Directly distributed specialists pay</p>
        </Card>

        <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl backdrop-blur-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Active Pay Period
            </span>
            <Calendar className="w-4 h-4 text-yellow-500" />
          </div>
          <h3 className="text-2xl font-black font-mono text-yellow-400 mt-1.5">May 2026</h3>
          <p className="text-[10px] text-slate-400 mt-1">Draft distribution period</p>
        </Card>
      </div>

      {/* Filters and Control bar */}
      <Card className="bg-card/30 border border-border/60 p-4 rounded-2xl backdrop-blur-sm">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pay period..."
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
                  { value: 'paid', label: 'Paid' },
                  { value: 'draft', label: 'Draft' },
                ]}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Payroll runs table grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <LoadingSpinner className="h-8 w-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground animate-pulse font-bold tracking-wider uppercase">
            Syncing payroll logs...
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
                        selectedRows.length === filteredRuns.length && filteredRuns.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-border/60 text-primary focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Pay Period Name</th>
                  <th className="py-3.5 px-4">Active Specialists</th>
                  <th className="py-3.5 px-4">Gross Compensation</th>
                  <th className="py-3.5 px-4">Tax Withholdings</th>
                  <th className="py-3.5 px-4">Net settled amount</th>
                  <th className="py-3.5 px-4">Payment Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                <AnimatePresence mode="popLayout">
                  {filteredRuns.map((p) => (
                    <motion.tr
                      key={p._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`hover:bg-slate-900/10 transition-colors ${
                        selectedRows.includes(p._id) ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(p._id)}
                          onChange={() => handleRowSelect(p._id)}
                          className="rounded border-border/60 text-primary focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-4 font-bold text-white tracking-wider">
                        {p.payPeriod}
                      </td>
                      <td className="py-4 px-4 text-slate-300 font-semibold">
                        {p.employeeCount} specialists
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-400">
                        ${p.grossAmount?.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-400">
                        ${p.taxWithheld?.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-emerald-400">
                        ${p.netAmount?.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-slate-400">{p.paymentDate}</td>
                      <td className="py-4 px-4 uppercase font-bold tracking-wider text-[10px]">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full border ${
                            p.status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/hr/payroll/${p._id}`}>
                            <button
                              title="View Run Details"
                              className="p-1.5 rounded-lg border border-border/60 hover:bg-primary/10 text-slate-400 hover:text-primary transition-all"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDeleteRun(p._id)}
                            title="Delete payroll record"
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
              {selectedRows.length} payroll periods selected
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

      {/* Single Run Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          if (runToDeleteId) {
            setPayrollRuns(payrollRuns.filter((p) => p._id !== runToDeleteId));
            toast.success('Payroll run record deleted.');
          }
          setIsDeleteConfirmOpen(false);
        }}
        title="Delete Payroll Record"
        message="Are you absolutely sure you want to permanently delete this payroll period log? This action is permanent."
        confirmLabel="Delete Record"
        cancelLabel="Cancel"
        type="danger"
      />

      {/* Bulk Runs Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isBulkDeleteConfirmOpen}
        onClose={() => setIsBulkDeleteConfirmOpen(false)}
        onConfirm={() => {
          setPayrollRuns(payrollRuns.filter((p) => !selectedRows.includes(p._id)));
          setSelectedRows([]);
          setIsBulkDeleteConfirmOpen(false);
          toast.success('Selected payroll records deleted.');
        }}
        title="Delete Selected Periods"
        message={`Are you sure you want to permanently delete all ${selectedRows.length} selected payroll run periods?`}
        confirmLabel="Delete Selected"
        cancelLabel="Cancel"
        type="danger"
      />
    </div>
  );
}
