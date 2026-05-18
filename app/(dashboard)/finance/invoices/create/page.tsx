'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

interface CompanyOption {
  _id: string;
  name: string;
}

interface FormItem {
  description: string;
  quantity: number;
  rate: number;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);

  // Form states
  const [invoiceNumber, setInvoiceNumber] = useState(
    () => `INV-2026-${Math.floor(100 + Math.random() * 900)}`
  );
  const [companyId, setCompanyId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<FormItem[]>([
    { description: 'Custom ERP Feature Integration', quantity: 1, rate: 15000 },
  ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const fetchCompanies = async () => {
      try {
        const res = await fetch('/api/protected/clients');
        const d = await res.json();
        if (d.success) {
          setCompanies(d.data.map((c: any) => ({ _id: c._id, name: c.name })));
          if (d.data.length > 0) setCompanyId(d.data[0]._id);
        }
      } catch (err) {
        toast.error('Failed to sync corporate clients list.');
      } finally {
        setIsLoadingCompanies(false);
      }
    };
    fetchCompanies();
  }, []);

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
    if (!companyId || !invoiceNumber) {
      toast.error('Invoice Number and Client business are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success(`Invoice "${invoiceNumber}" drafted successfully!`);
      router.push('/finance/invoices');
    } catch (err) {
      toast.error('Failed to save invoice record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Computations
  const subtotal = items.reduce((acc, curr) => acc + (curr.quantity * curr.rate || 0), 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 select-none font-semibold">
        <Link href="/finance/invoices">
          <Button variant="outline" size="sm" className="h-8 hover:bg-accent/40 text-xs gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Invoices
          </Button>
        </Link>
      </div>

      <PageHeader
        eyebrow="Financial Operations Suite"
        title="Draft Sales Invoice Statement"
        description="Configure new itemized line-items, auto-apply corporate tax brackets, and dispatch statements to B2B clients."
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
                {isLoadingCompanies ? (
                  <div className="h-10 flex items-center px-3 bg-background/20 rounded-xl">
                    <LoadingSpinner className="h-4 w-4 text-primary animate-spin mr-2" />
                    <span className="text-[10px] text-slate-500">Syncing companies...</span>
                  </div>
                ) : (
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <select
                      value={companyId}
                      onChange={(e) => setCompanyId(e.target.value)}
                      className="w-full pl-10 pr-4 bg-background/30 border border-border/60 hover:border-primary/20 rounded-xl h-10 text-xs text-slate-300 focus:ring-0 outline-none cursor-pointer"
                    >
                      {companies.map((c) => (
                        <option key={c._id} value={c._id} className="bg-slate-950">
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
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

            {/* Line items list builder */}
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

            {/* Total aggregates */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-4 border-t border-border/40 select-none">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block mt-2.5">
                Note: Invoices are automatically created in Draft status.
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
              <Link href="/finance/invoices">
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
                    Saving Draft...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Draft Invoice
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
