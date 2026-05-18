'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader, Card, CardContent, Button, Input, LoadingSpinner } from '@/components/ui';
import { DollarSign, ArrowLeft, Calendar, CheckCircle2, Users, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function RunPayrollPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [payPeriod, setPayPeriod] = useState('June 2026');
  const [grossAmount, setGrossAmount] = useState(32500);
  const [taxWithheld, setTaxWithheld] = useState(3250);
  const [netAmount, setNetAmount] = useState(29250);
  const [paymentDate, setPaymentDate] = useState('2026-06-30');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payPeriod || !paymentDate) {
      toast.error('Pay Period and Payment Date are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success(
        `Payroll period "${payPeriod}" successfully submitted in Draft. Direct deposits ready for release.`
      );
      router.push('/hr/payroll');
    } catch (err) {
      toast.error('Failed to submit payroll period.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 select-none font-semibold">
        <Link href="/hr/payroll">
          <Button variant="outline" size="sm" className="h-8 hover:bg-accent/40 text-xs gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Payroll
          </Button>
        </Link>
      </div>

      <PageHeader
        eyebrow="Onboarding Wizard"
        title="Execute New Payroll Run"
        description="Verify baseline pay liabilities, record estimated withholdings, audit allowances, and draft the upcoming payment cycle."
      />

      <Card className="bg-card/40 border border-border/60 backdrop-blur-md">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Pay Period Name
                </label>
                <Input
                  required
                  value={payPeriod}
                  onChange={(e) => setPayPeriod(e.target.value)}
                  placeholder="June 2026"
                  className="bg-background/30 h-10 text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Payment Distribution Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    required
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="pl-10 bg-background/30 h-10 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 select-none">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Gross Pay Liability ($)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    required
                    type="number"
                    value={grossAmount}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setGrossAmount(val);
                      const computedTax = Math.round(val * 0.1);
                      setTaxWithheld(computedTax);
                      setNetAmount(val - computedTax);
                    }}
                    className="pl-10 bg-background/30 h-10 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Tax Withholding (10.0%)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    required
                    type="number"
                    disabled
                    value={taxWithheld}
                    className="pl-10 bg-background/20 text-slate-500 border-border/40 h-10 text-xs font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Calculated Net Settlement
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    required
                    type="number"
                    disabled
                    value={netAmount}
                    className="pl-10 bg-background/20 text-slate-500 border-border/40 h-10 text-xs font-mono cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <Card className="bg-primary/5 border border-primary/20 p-5 rounded-2xl flex items-start gap-3 select-none mt-2">
              <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  ACH Settlement Safeguard
                </h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Creating the pay period will lock compensation calculations. Ensure employee
                  directory roles and salary baseline contracts are current before saving.
                </p>
              </div>
            </Card>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/40 select-none">
              <Link href="/hr/payroll">
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
                    Drafting Run...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Draft Pay Period
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
