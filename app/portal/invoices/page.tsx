'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui';
import { FileText, Download, DollarSign, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function PortalInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await fetch('/api/portal/invoices');
        const body = await res.json();
        if (body.success) {
          setInvoices(body.data);
        }
      } catch (err) {
        toast.error('Failed to load invoices.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      partially_paid: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      sent: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      overdue: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    };
    const cls = statusMap[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    return (
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cls}`}
      >
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 rounded-2xl bg-slate-900" />
        <Skeleton className="h-64 rounded-2xl bg-slate-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <DollarSign className="w-5 h-5 text-amber-500" />
          <span>Billing & Invoices</span>
        </h1>
        <p className="text-xs text-slate-500">
          View your billing history and download outstanding invoices
        </p>
      </div>

      {invoices.length === 0 ? (
        <Card className="bg-slate-900/40 border-slate-850 p-12 rounded-3xl text-center">
          <EmptyState
            title="No Invoices Found"
            description="You don't have any invoices generated for your account yet."
            icon={<FileText className="w-12 h-12 text-slate-500" />}
          />
        </Card>
      ) : (
        <Card className="bg-slate-900/40 border-slate-850 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/60 bg-slate-950/50">
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Issue Date
                  </th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-800/50 rounded-lg text-slate-400">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-white font-mono text-sm">
                          {inv.invoiceNumber}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-300">
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-sm text-slate-300">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-white">
                        ${inv.totalAmount?.toLocaleString()}
                      </span>
                      {inv.outstandingAmount > 0 && inv.outstandingAmount !== inv.totalAmount && (
                        <span className="block text-[10px] text-rose-400">
                          ${inv.outstandingAmount.toLocaleString()} due
                        </span>
                      )}
                    </td>
                    <td className="p-4">{getStatusBadge(inv.status)}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors inline-flex"
                        title="View Details"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors inline-flex"
                        title="Download PDF"
                        onClick={() => toast.success('PDF download initiated')}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
