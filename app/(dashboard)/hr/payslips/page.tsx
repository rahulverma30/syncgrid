'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader, Card, CardContent, Button, Input, LoadingSpinner } from '@/components/ui';
import { FileText, Search, ArrowLeft, Download, Calendar, Users, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface PayslipItem {
  _id: string;
  employeeName: string;
  role: string;
  payPeriod: string;
  grossAmount: number;
  taxWithheld: number;
  netPay: number;
  paymentDate: string;
}

export default function HRPayslipsPage() {
  const [mounted, setMounted] = useState(false);
  const [payslips, setPayslips] = useState<PayslipItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const fetchPayslips = async () => {
      setIsLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setPayslips([
          {
            _id: 'ps1',
            employeeName: 'Harvey Dent',
            role: 'Legal Chief Specialist',
            payPeriod: 'April 2026',
            grossAmount: 12083.33,
            taxWithheld: 1208.33,
            netPay: 11375.0,
            paymentDate: '2026-04-30',
          },
          {
            _id: 'ps2',
            employeeName: 'Selina Kyle',
            role: 'Strategic Acquisition Manager',
            payPeriod: 'April 2026',
            grossAmount: 9583.33,
            taxWithheld: 958.33,
            netPay: 8925.0,
            paymentDate: '2026-04-30',
          },
          {
            _id: 'ps3',
            employeeName: 'Harvey Dent',
            role: 'Legal Chief Specialist',
            payPeriod: 'March 2026',
            grossAmount: 12083.33,
            taxWithheld: 1208.33,
            netPay: 11375.0,
            paymentDate: '2026-03-31',
          },
        ]);
      } catch (err) {
        toast.error('Failed to sync payslips registry.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPayslips();
  }, []);

  const handleDownloadPayslip = (id: string, name: string) => {
    toast.success(`Exporting payslip document for "${name}"... Download scheduled.`);
  };

  const filteredPayslips = payslips.filter((ps) => {
    return (
      ps.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ps.payPeriod.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 select-none font-semibold">
        <Link href="/hr/payroll">
          <Button variant="outline" size="sm" className="h-8 hover:bg-accent/40 text-xs gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Payroll Control
          </Button>
        </Link>
      </div>

      <PageHeader
        eyebrow="Human Resources Infrastructure"
        title="HR Payslips Registry"
        description="Review historical employee net payout summaries, tax deductions, and download legal payment vouchers."
      />

      {/* Control bar */}
      <Card className="bg-card/30 border border-border/60 p-4 rounded-2xl backdrop-blur-sm">
        <div className="relative w-full md:max-w-xs text-left">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee name or pay period..."
            className="pl-8 h-9 text-xs bg-background/40"
          />
        </div>
      </Card>

      {/* Payslips List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <LoadingSpinner className="h-8 w-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground animate-pulse font-bold tracking-wider uppercase">
            Syncing payslips ledger...
          </p>
        </div>
      ) : (
        <Card className="bg-card/40 border border-border/60 rounded-3xl overflow-hidden backdrop-blur-md text-left">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/60 bg-background/20 select-none text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-5">Specialist</th>
                  <th className="py-3.5 px-4">Pay Period</th>
                  <th className="py-3.5 px-4 text-right">Gross Period Pay</th>
                  <th className="py-3.5 px-4 text-right">Withholding Tax</th>
                  <th className="py-3.5 px-4 text-right">Net Settled Cash</th>
                  <th className="py-3.5 px-4">Release Date</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-slate-300">
                {filteredPayslips.map((ps) => (
                  <tr key={ps._id} className="hover:bg-slate-900/10 transition-colors">
                    <td className="py-4 px-5">
                      <h4 className="font-bold text-white text-sm">{ps.employeeName}</h4>
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                        {ps.role}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-300">{ps.payPeriod}</td>
                    <td className="py-4 px-4 text-right font-mono text-slate-400">
                      ${ps.grossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-red-400/90">
                      -${ps.taxWithheld.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-emerald-400">
                      ${ps.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-slate-400">{ps.paymentDate}</td>
                    <td className="py-4 px-5 text-right select-none">
                      <Button
                        onClick={() => handleDownloadPayslip(ps._id, ps.employeeName)}
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1 hover:bg-accent/40"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </Button>
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
