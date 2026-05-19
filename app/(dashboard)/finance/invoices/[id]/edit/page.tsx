'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader, Card, CardContent, Button, Input, LoadingSpinner } from '@/components/ui';
import {
  DollarSign,
  ArrowLeft,
  Calendar,
  Building,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface FormItem {
  description: string;
  quantity: number;
  rate: number;
}

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : '';
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [companyId, setCompanyId] = useState('acme123');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<FormItem[]>([{ description: '', quantity: 1, rate: 1000 }]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (!invoiceId) return;
    const fetchInvoice = async () => {
      setIsLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (invoiceId === 'i1') {
          setInvoiceNumber('INV-2026-001');
          setIssueDate('2026-05-01');
          setDueDate('2026-05-31');
          setItems([{ description: 'Next.js Custom ERP Build', quantity: 1, rate: 45000 }]);
        } else if (invoiceId === 'i3') {
          setInvoiceNumber('INV-2026-003');
          setIssueDate('2026-04-15');
          setDueDate('2026-05-15');
          setItems([
            { description: 'Security Telemetry Auditing Scope', quantity: 1, rate: 12000 },
          ]);
        } else {
          setInvoiceNumber('INV-2026-002');
          setIssueDate('2026-05-10');
          setDueDate('2026-06-10');
          setItems([
            { description: 'Corporate Cloud Infrastructure Config', quantity: 1, rate: 25000 },
          ]);
        }
      } catch (err) {
        toast.error('Failed to load invoice details for editing.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvoice();
  }, [invoiceId]);

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, rate: 1000 }]);
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: keyof FormItem, val: string | number) => {
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: val } : item)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber) {
      toast.error('Invoice Number is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success(`Invoice "${invoiceNumber}" saved successfully.`);
      router.push(`/finance/invoices/${invoiceId}`);
    } catch (err) {
      toast.error('Failed to save invoice corrections.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Computations
  const subtotal = items.reduce((acc, curr) => acc + (curr.quantity * curr.rate || 0), 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground animate-pulse font-bold tracking-wider uppercase">
          Synthesizing invoice correction details...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 select-none font-semibold">
        <Link href={`/finance/invoices/${invoiceId}`}>
          <Button variant="outline" size="sm" className="h-8 hover:bg-accent/40 text-xs gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Details
          </Button>
        </Link>
      </div>

      <PageHeader
        eyebrow="Financial Operations Suite"
        title="Edit Sales Invoice Statement"
        description="Modify itemized line-items, update contract rates, and save active billing corrections."
      />

      <Card className="bg-card/40 border border-border/60 backdrop-blur-md">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Invoice Number / Statement ID
                </label>
                <Input
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="INV-2026-042"
                  className="bg-background/30 h-10 text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select Target Client Account
                </label>
                <div className="relative select-none">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <select
                    value={companyId}
                    disabled
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="w-full pl-10 pr-4 bg-background/20 border border-border/40 rounded-xl h-10 text-xs text-slate-500 cursor-not-allowed outline-none"
                  >
                    <option value="acme123" className="bg-slate-950">
                      Acme Corp
                    </option>
                    <option value="globex123" className="bg-slate-950">
                      Globex Inc
                    </option>
                    <option value="umbrella123" className="bg-slate-950">
                      Umbrella Corp
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Issue Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    required
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="pl-10 bg-background/30 h-10 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Due Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    required
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="pl-10 bg-background/30 h-10 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Line items builder */}
            <div className="space-y-3.5 pt-2 select-none">
              <div className="flex justify-between items-center border-b border-border/40 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Itemized Line Items
                </span>
                <Button
                  onClick={handleAddItem}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] uppercase font-bold tracking-wider gap-1"
                >
                  <Plus className="h-3 w-3" /> Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-end">
                    <div className="flex-1 space-y-1.5">
                      {idx === 0 && (
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                          Service Description
                        </label>
                      )}
                      <Input
                        required
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        placeholder="Consulting Services / Dev Sprint"
                        className="bg-background/30 h-9 text-xs"
                      />
                    </div>

                    <div className="w-16 space-y-1.5">
                      {idx === 0 && (
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block text-center">
                          Qty
                        </label>
                      )}
                      <Input
                        required
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                        className="bg-background/30 h-9 text-xs text-center font-mono"
                      />
                    </div>

                    <div className="w-28 space-y-1.5">
                      {idx === 0 && (
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block text-right">
                          Rate ($)
                        </label>
                      )}
                      <Input
                        required
                        type="number"
                        min="0"
                        value={item.rate}
                        onChange={(e) => handleItemChange(idx, 'rate', Number(e.target.value))}
                        className="bg-background/30 h-9 text-xs text-right font-mono"
                      />
                    </div>

                    <Button
                      onClick={() => handleRemoveItem(idx)}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 hover:bg-red-500/10 hover:text-red-500 border-border/60"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Total calculation */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-4 border-t border-border/40 select-none">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block mt-2.5">
                Note: Saving will preserve the invoice number.
              </span>

              <div className="w-full sm:max-w-[240px] space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Subtotal amount</span>
                  <span className="font-mono">${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Estimated Tax (10.0%)</span>
                  <span className="font-mono">${tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-white font-bold border-t border-border/40 pt-2 text-sm">
                  <span>Statement Total</span>
                  <span className="font-mono font-black text-emerald-400 text-base">
                    ${total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/40 select-none">
              <Link href={`/finance/invoices/${invoiceId}`}>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="h-9 hover:bg-accent/40 text-xs"
                >
                  Cancel
                </Button>
              </Link>

              <Button
                disabled={isSubmitting}
                type="submit"
                variant="default"
                size="sm"
                className="h-9 text-xs"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner className="h-4 w-4 text-white animate-spin mr-2" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Save Invoice
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
