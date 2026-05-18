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
  Edit2,
  Download,
  Users,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  clientName: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  paymentMethod?: string;
  createdAt: string;
}

export default function FinanceInvoicesPage() {
  const [mounted, setMounted] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      // Simulate real-time dashboard data seeding
      await new Promise((resolve) => setTimeout(resolve, 600));
      setInvoices([
        {
          _id: 'i1',
          invoiceNumber: 'INV-2026-001',
          clientName: 'Acme Corp',
          clientId: 'acme123',
          issueDate: '2026-05-01',
          dueDate: '2026-05-31',
          items: [
            { description: 'Next.js Custom ERP Build', quantity: 1, rate: 45000, amount: 45000 },
          ],
          subtotal: 45000,
          tax: 4500,
          total: 49500,
          status: 'paid',
          paymentMethod: 'ACH Transfer',
          createdAt: new Date().toISOString(),
        },
        {
          _id: 'i2',
          invoiceNumber: 'INV-2026-002',
          clientName: 'Globex Inc',
          clientId: 'globex123',
          issueDate: '2026-05-10',
          dueDate: '2026-06-10',
          items: [
            {
              description: 'Corporate Cloud Infrastructure Config',
              quantity: 1,
              rate: 25000,
              amount: 25000,
            },
          ],
          subtotal: 25000,
          tax: 2500,
          total: 27500,
          status: 'sent',
          createdAt: new Date().toISOString(),
        },
        {
          _id: 'i3',
          invoiceNumber: 'INV-2026-003',
          clientName: 'Umbrella Corp',
          clientId: 'umbrella123',
          issueDate: '2026-04-15',
          dueDate: '2026-05-15',
          items: [
            {
              description: 'Security Telemetry Auditing Scope',
              quantity: 1,
              rate: 12000,
              amount: 12000,
            },
          ],
          subtotal: 12000,
          tax: 1200,
          total: 13200,
          status: 'overdue',
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      toast.error('Could not load invoices.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    fetchInvoices();
  }, []);

  const handleRowSelect = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === filteredInvoices.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredInvoices.map((i) => i._id));
    }
  };

  const handleDeleteInvoice = (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this invoice record?')) return;
    setInvoices(invoices.filter((i) => i._id !== id));
    toast.success('Invoice record permanently deleted.');
  };

  const handleBulkDelete = () => {
    if (!confirm(`Delete ${selectedRows.length} selected invoices permanently?`)) return;
    setInvoices(invoices.filter((i) => !selectedRows.includes(i._id)));
    setSelectedRows([]);
    toast.success('Selected invoice records deleted.');
  };

  const handleExportCSV = () => {
    const headers = [
      'Invoice Number',
      'Client Name',
      'Issue Date',
      'Due Date',
      'Subtotal',
      'Tax',
      'Total',
      'Status',
    ];
    const rows = filteredInvoices.map((i) => [
      i.invoiceNumber,
      i.clientName,
      i.issueDate,
      i.dueDate,
      i.subtotal,
      i.tax,
      i.total,
      i.status,
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
      `syncgrid_finance_invoices_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Invoices exported successfully.');
  };

  const filteredInvoices = invoices.filter((i) => {
    const matchesSearch =
      i.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.clientName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter ? i.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  const outstandingVal = filteredInvoices
    .filter((i) => i.status !== 'paid')
    .reduce((acc, curr) => acc + (curr.total || 0), 0);

  const collectionsVal = filteredInvoices
    .filter((i) => i.status === 'paid')
    .reduce((acc, curr) => acc + (curr.total || 0), 0);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Financial Operations Suite"
        title="Finance Invoices Ledger"
        description="Verify sales billing accounts, monitor accounts receivable, track tax parameters, and output legal payment demands."
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
            <Link href="/finance/invoices/create">
              <Button variant="default" size="sm" className="h-9 text-xs gap-1.5">
                <Plus className="h-4 w-4" />
                Create Invoice
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
              Accounts Receivable
            </span>
            <Clock className="w-4 h-4 text-yellow-500" />
          </div>
          <h3 className="text-2xl font-black font-mono text-white mt-1.5">
            ${outstandingVal.toLocaleString()}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Pending and overdue contract values</p>
        </Card>

        <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl backdrop-blur-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Collected Revenues
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black font-mono text-emerald-400 mt-1.5">
            ${collectionsVal.toLocaleString()}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">ACH, credit card settle channels</p>
        </Card>

        <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl backdrop-blur-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Overdue Alerts</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <h3 className="text-2xl font-black font-mono text-red-400 mt-1.5">
            {filteredInvoices.filter((i) => i.status === 'overdue').length}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Requiring active payment reminders</p>
        </Card>
      </div>

      {/* Control bar */}
      <Card className="bg-card/30 border border-border/60 p-4 rounded-2xl backdrop-blur-sm">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoice number or client..."
              className="pl-8 h-9 text-xs bg-background/40"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5 bg-background/30 px-3 py-1.5 rounded-xl border border-border/40">
              <Filter className="h-3 w-3 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-0 text-[10px] font-bold uppercase tracking-wider text-slate-300 focus:ring-0 outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900">
                  All Statuses
                </option>
                <option value="paid" className="bg-slate-900">
                  Paid
                </option>
                <option value="sent" className="bg-slate-900">
                  Sent
                </option>
                <option value="draft" className="bg-slate-900">
                  Draft
                </option>
                <option value="overdue" className="bg-slate-900">
                  Overdue
                </option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Invoices grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <LoadingSpinner className="h-8 w-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground animate-pulse font-bold tracking-wider uppercase">
            Syncing corporate invoices...
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
                        selectedRows.length === filteredInvoices.length &&
                        filteredInvoices.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-border/60 text-primary focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Invoice ID</th>
                  <th className="py-3.5 px-4">Client Business</th>
                  <th className="py-3.5 px-4">Issue Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                <AnimatePresence mode="popLayout">
                  {filteredInvoices.map((i) => (
                    <motion.tr
                      key={i._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`hover:bg-slate-900/10 transition-colors ${
                        selectedRows.includes(i._id) ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(i._id)}
                          onChange={() => handleRowSelect(i._id)}
                          className="rounded border-border/60 text-primary focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-4 font-bold text-white tracking-wider">
                        {i.invoiceNumber}
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-300">{i.clientName}</td>
                      <td className="py-4 px-4 text-slate-400">{i.issueDate}</td>
                      <td className="py-4 px-4 text-slate-400">{i.dueDate}</td>
                      <td className="py-4 px-4 font-mono font-bold text-emerald-400">
                        ${i.total?.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 uppercase font-bold tracking-wider text-[10px]">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full border ${
                            i.status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : i.status === 'overdue'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          }`}
                        >
                          {i.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/finance/invoices/${i._id}`}>
                            <button
                              title="View Invoice Details"
                              className="p-1.5 rounded-lg border border-border/60 hover:bg-primary/10 text-slate-400 hover:text-primary transition-all"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                          <Link href={`/finance/invoices/${i._id}/edit`}>
                            <button
                              title="Edit invoice"
                              className="p-1.5 rounded-lg border border-border/60 hover:bg-blue-500/10 text-slate-400 hover:text-blue-400 transition-all"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDeleteInvoice(i._id)}
                            title="Delete invoice record"
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

      {/* Floating actions */}
      <AnimatePresence>
        {selectedRows.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-slate-900 border border-border p-3.5 rounded-2xl shadow-2xl select-none"
          >
            <span className="text-xs font-bold text-slate-300">
              {selectedRows.length} invoices selected
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
