import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  CreditCard,
  Send,
  Copy,
  Archive,
  Trash2,
  Calendar,
  FileText,
  ChevronDown,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Button, Input, Select, Modal, EmptyState } from '@/components/ui';

interface InvoiceManagerProps {
  invoices: any[];
  onOpenCreate: () => void;
  onSend: (id: string) => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onRecordPayment: (id: string, payload: any) => void;
  role: string;
}

export const InvoiceManager: React.FC<InvoiceManagerProps> = ({
  invoices,
  onOpenCreate,
  onSend,
  onDuplicate,
  onArchive,
  onDelete,
  onRecordPayment,
  role,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // Record Payment Dialog state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<any>('bank_transfer');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const filteredInvoices = invoices.filter((inv) => {
    const clientName = inv.clientId?.name?.toLowerCase() || '';
    const clientComp = inv.clientId?.company?.toLowerCase() || '';
    const invNum = inv.invoiceNumber?.toLowerCase() || '';
    const matchesSearch =
      clientName.includes(search.toLowerCase()) ||
      clientComp.includes(search.toLowerCase()) ||
      invNum.includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-muted/40 text-muted-foreground border-muted-foreground/30',
      sent: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      partially_paid: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      overdue: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      void: 'bg-border/30 text-muted-foreground border-border/40',
    };
    return (
      <span
        className={`px-2 py-0.5 text-[9px] uppercase font-extrabold tracking-wider border rounded-full ${styles[status] || styles.draft}`}
      >
        {status.replace('_', ' ')}
      </span>
    );
  };

  const handleOpenPay = (inv: any) => {
    setSelectedInvoice(inv);
    setPayAmount(inv.outstandingAmount.toString());
    setPaymentModalOpen(true);
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    onRecordPayment(selectedInvoice._id, {
      amount: Number(payAmount),
      paymentMethod: payMethod,
      referenceNumber: payRef,
      paymentDate: new Date(),
      description: payNotes || `Clearing balance for ${selectedInvoice.invoiceNumber}`,
    });
    setPaymentModalOpen(false);
    setPayRef('');
    setPayNotes('');
  };

  const isFinance = ['super-admin', 'admin', 'finance'].includes(role);

  return (
    <div className="space-y-6 select-none">
      {/* Filtering Search Bar */}
      <div className="flex justify-between items-center gap-4 flex-wrap select-none">
        <div className="flex gap-2 items-center flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices by number or client..."
              className="pl-8 h-9 text-xs bg-background/30"
            />
          </div>
          <div className="w-48">
            <Select
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              className="h-9"
              placeholder="All statuses"
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'draft', label: 'Draft' },
                { value: 'sent', label: 'Sent' },
                { value: 'partially_paid', label: 'Partially paid' },
                { value: 'paid', label: 'Paid' },
                { value: 'overdue', label: 'Overdue' },
              ]}
            />
          </div>
        </div>

        {isFinance && (
          <Button onClick={onOpenCreate} size="sm" className="h-9 text-xs gap-1.5 cursor-pointer">
            <Plus className="h-4 w-4" />
            Build Invoice
          </Button>
        )}
      </div>

      {/* Invoice Grid Table */}
      <div className="border border-border/80 rounded-xl overflow-hidden backdrop-blur-md">
        <table className="table-container">
          <thead>
            <tr className="table-header-row">
              <th className="table-header-cell">Invoice #</th>
              <th className="table-header-cell">Customer Client</th>
              <th className="table-header-cell">Due Date</th>
              <th className="table-header-cell">Grand Total</th>
              <th className="table-header-cell">Paid Total</th>
              <th className="table-header-cell">Outstanding</th>
              <th className="table-header-cell">Status</th>
              {isFinance && <th className="table-header-cell text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-0 border-none">
                  <div className="py-12">
                    <EmptyState
                      title="No invoices found"
                      description="There are no invoices matching your current filter criteria."
                      action={
                        isFinance
                          ? {
                              label: 'Create Invoice',
                              onClick: onOpenCreate,
                              icon: <Plus className="w-4 h-4" />,
                            }
                          : undefined
                      }
                      variant="search"
                    />
                  </div>
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => (
                <tr key={inv._id} className="table-row">
                  <td className="table-body-cell font-bold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground/60" />
                      {inv.invoiceNumber}
                    </span>
                  </td>
                  <td className="table-body-cell font-semibold">
                    <div className="flex flex-col">
                      <span>{inv.clientId?.name}</span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        {inv.clientId?.company}
                      </span>
                    </div>
                  </td>
                  <td className="table-body-cell text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 opacity-60" />
                      {new Date(inv.dueDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </td>
                  <td className="table-body-cell font-bold text-foreground">
                    {inv.currency}{' '}
                    {inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="table-body-cell font-medium text-emerald-400">
                    {inv.currency}{' '}
                    {inv.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="table-body-cell font-medium text-amber-500">
                    {inv.currency}{' '}
                    {inv.outstandingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="table-body-cell">{getStatusBadge(inv.status)}</td>
                  {isFinance && (
                    <td className="table-body-cell text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.status === 'draft' && (
                          <button
                            onClick={() => onSend(inv._id)}
                            title="Transmit invoice to client"
                            className="p-1.5 hover:bg-accent/40 rounded text-sky-400 cursor-pointer"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {['sent', 'partially_paid', 'overdue'].includes(inv.status) && (
                          <button
                            onClick={() => handleOpenPay(inv)}
                            title="Record manual client receipt"
                            className="p-1.5 hover:bg-accent/40 rounded text-emerald-400 cursor-pointer"
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onDuplicate(inv._id)}
                          title="Duplicate invoice"
                          className="p-1.5 hover:bg-accent/40 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onArchive(inv._id)}
                          title="Toggle Archive Status"
                          className={`p-1.5 hover:bg-accent/40 rounded cursor-pointer ${inv.isArchived ? 'text-amber-500' : 'text-muted-foreground'}`}
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(inv._id)}
                          title="Void / Delete invoice"
                          className="p-1.5 hover:bg-rose-500/20 rounded text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Payment overlays Dialog */}
      <Modal
        isOpen={paymentModalOpen && !!selectedInvoice}
        onClose={() => setPaymentModalOpen(false)}
        title="Record Manual Payment"
        description={selectedInvoice ? `Invoice ${selectedInvoice.invoiceNumber}` : ''}
        size="md"
      >
        {selectedInvoice && (
          <form onSubmit={handleSubmitPayment} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Total Amount Due ({selectedInvoice.currency}){' '}
                <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                required
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                max={selectedInvoice.outstandingAmount}
                min={0.01}
                step="0.01"
              />
              <p className="text-[11px] text-muted-foreground font-medium mt-1">
                Outstanding balance limit: {selectedInvoice.currency}{' '}
                {selectedInvoice.outstandingAmount.toLocaleString()}
              </p>
            </div>

            <div className="space-y-1.5">
              <Select
                label="Payment Gateway / Method"
                value={payMethod}
                onChange={(val) => setPayMethod(val)}
                options={[
                  { value: 'bank_transfer', label: 'Direct Bank Payout' },
                  { value: 'stripe', label: 'Stripe Gateway' },
                  { value: 'razorpay', label: 'Razorpay UPI' },
                  { value: 'upi', label: 'UPI/QR Code' },
                  { value: 'cash', label: 'Cash Ledger' },
                  { value: 'manual', label: 'Manual Ledger Balance' },
                ]}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Clearing Ref Number</label>
              <Input
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                placeholder="e.g. wire ref or check serial"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Notes</label>
              <Input
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder="Transaction clearing notes"
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setPaymentModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Clear Receipt</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
