'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader, Card, CardContent, Button, Input, LoadingSpinner } from '@/components/ui';
import {
  DollarSign,
  ArrowLeft,
  Calendar,
  Paperclip,
  CheckCircle2,
  Users,
  Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CreateExpensePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [payee, setPayee] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('software');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('Corporate Card');
  const [notes, setNotes] = useState('');
  const [receiptAttached, setReceiptAttached] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payee || !amount) {
      toast.error('Payee Name and Expense Amount are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success(`Expense record for "${payee}" submitted successfully in pending status.`);
      router.push('/finance/expenses');
    } catch (err) {
      toast.error('Failed to submit expense claim.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 select-none font-semibold">
        <Link href="/finance/expenses">
          <Button variant="outline" size="sm" className="h-8 hover:bg-accent/40 text-xs gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Expenses
          </Button>
        </Link>
      </div>

      <PageHeader
        eyebrow="Financial Operations Suite"
        title="Record Operational Expense Claim"
        description="Submit a new business transaction voucher, upload a supporting payment receipt, and dispatch for approval."
      />

      <Card className="bg-card/40 border border-border/60 backdrop-blur-md">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Merchant / Payee Name
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  required
                  value={payee}
                  onChange={(e) => setPayee(e.target.value)}
                  placeholder="Amazon Web Services"
                  className="pl-10 bg-background/30 h-10 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Transaction Amount ($)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    required
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="250.00"
                    className="pl-10 bg-background/30 h-10 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Business Category
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full pl-10 pr-4 bg-background/30 border border-border/60 hover:border-primary/20 rounded-xl h-10 text-xs text-slate-300 focus:ring-0 outline-none cursor-pointer"
                  >
                    <option value="software" className="bg-slate-950">
                      Software / SaaS
                    </option>
                    <option value="marketing" className="bg-slate-950">
                      Marketing Ads
                    </option>
                    <option value="travel" className="bg-slate-950">
                      Travel & Meals
                    </option>
                    <option value="office" className="bg-slate-950">
                      Office Operations
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Transaction Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    required
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="pl-10 bg-background/30 h-10 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 bg-background/30 border border-border/60 hover:border-primary/20 rounded-xl h-10 text-xs text-slate-300 focus:ring-0 outline-none cursor-pointer"
                >
                  <option value="Corporate Card" className="bg-slate-950">
                    Corporate Card
                  </option>
                  <option value="ACH Transfer" className="bg-slate-950">
                    ACH Transfer
                  </option>
                  <option value="Reimbursement" className="bg-slate-950">
                    Personal Reimbursement
                  </option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Expense Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Explain the operational purpose of this transaction..."
                rows={3}
                className="w-full px-3 py-2 bg-background/30 border border-border/60 hover:border-primary/20 rounded-xl text-xs text-white focus:ring-0 outline-none placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-3 bg-background/20 p-4 rounded-xl border border-border/40 select-none mt-2">
              <input
                type="checkbox"
                id="receiptCheck"
                checked={receiptAttached}
                onChange={(e) => setReceiptAttached(e.target.checked)}
                className="rounded border-border/60 text-primary h-4.5 w-4.5 focus:ring-0 cursor-pointer"
              />
              <div className="space-y-0.5">
                <label
                  htmlFor="receiptCheck"
                  className="text-xs font-bold text-white block cursor-pointer flex items-center gap-1.5"
                >
                  <Paperclip className="h-3.5 w-3.5 text-primary" />
                  Attach Supporting Receipt
                </label>
                <span className="text-[9px] text-slate-400 block leading-none">
                  Voucher proof for tax auditing audit trails
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/40 select-none">
              <Link href="/finance/expenses">
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
                    Submitting claim...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Submit Claim
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
