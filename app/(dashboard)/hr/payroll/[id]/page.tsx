'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader, Card, CardContent, Button, LoadingSpinner } from '@/components/ui';
import {
  DollarSign,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  Download,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

interface PayrollEmployeeItem {
  _id: string;
  name: string;
  role: string;
  grossPay: number;
  tax: number;
  allowances: number;
  netPay: number;
}

export default function PayrollRunDetailsPage() {
  const params = useParams();
  const payRunId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : '';
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // States
  const [payPeriod, setPayPeriod] = useState('May 2026');
  const [grossAmount, setGrossAmount] = useState(32500);
  const [taxWithheld, setTaxWithheld] = useState(3250);
  const [netAmount, setNetAmount] = useState(29250);
  const [status, setStatus] = useState('draft');
  const [paymentDate, setPaymentDate] = useState('2026-05-31');

  const [employeesPay, setEmployeesPay] = useState<PayrollEmployeeItem[]>([
    {
      _id: 'e1',
      name: 'Harvey Dent',
      role: 'Legal Chief Specialist',
      grossPay: 12083.33,
      tax: 1208.33,
      allowances: 500,
      netPay: 11375.0,
    },
    {
      _id: 'e2',
      name: 'Selina Kyle',
      role: 'Strategic Acquisition Manager',
      grossPay: 9583.33,
      tax: 958.33,
      allowances: 300,
      netPay: 8925.0,
    },
    {
      _id: 'e3',
      name: 'Pamela Isley',
      role: 'Bio-diversity Lead Research',
      grossPay: 10833.33,
      tax: 1083.33,
      allowances: 400,
      netPay: 10150.0,
    },
  ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (!payRunId) return;
    const fetchRunDetails = async () => {
      setIsLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (payRunId === 'pr2') {
          setPayPeriod('April 2026');
          setStatus('paid');
          setPaymentDate('2026-04-30');
        } else if (payRunId === 'pr3') {
          setPayPeriod('March 2026');
          setGrossAmount(28000);
          setTaxWithheld(2800);
          setNetAmount(25200);
          setStatus('paid');
          setPaymentDate('2026-03-31');
          setEmployeesPay([
            {
              _id: 'e1',
              name: 'Harvey Dent',
              role: 'Legal Chief Specialist',
              grossPay: 12083.33,
              tax: 1208.33,
              allowances: 500,
              netPay: 11375.0,
            },
            {
              _id: 'e2',
              name: 'Selina Kyle',
              role: 'Strategic Acquisition Manager',
              grossPay: 9583.33,
              tax: 958.33,
              allowances: 300,
              netPay: 8925.0,
            },
          ]);
        }
      } catch (err) {
        toast.error('Failed to load payroll details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRunDetails();
  }, [payRunId]);

  const handleProcessPayroll = () => {
    setStatus('paid');
    toast.success(
      `PAYROLL DISTRIBUTED: ACH direct deposits dispatched to ${employeesPay.length} specialists! General ledgers balanced.`
    );
  };

  const handleDownloadReport = () => {
    toast.success('Generating secure B2B payroll ledger export...');
  };

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground animate-pulse font-bold tracking-wider uppercase">
          Synthesizing payroll distribution details...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 select-none">
        <Link href="/hr/payroll">
          <Button variant="outline" size="sm" className="h-8 hover:bg-accent/40 text-xs gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Payroll
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          {status !== 'paid' && (
            <Button
              onClick={handleProcessPayroll}
              variant="default"
              size="sm"
              className="h-8 text-xs gap-1"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Process & Release Pay
            </Button>
          )}
          <Button
            onClick={handleDownloadReport}
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1 hover:bg-accent/40"
          >
            <Download className="h-3.5 w-3.5" />
            Export Ledger
          </Button>
        </div>
      </div>

      {/* Overview Head Banner */}
      <Card className="bg-gradient-to-r from-slate-900/40 to-slate-950/40 border border-border/60 p-6 rounded-2xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 text-left">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 text-2xl font-black font-mono shadow-inner select-none">
              $
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-white">{payPeriod} Pay Run</h1>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider ${
                    status === 'paid'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                  }`}
                >
                  {status}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-slate-500" />
                {employeesPay.length} active specialists compensated
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-semibold select-none">
            <div className="text-right">
              <span className="text-[9px] font-bold text-slate-500 uppercase block leading-none">
                Net Dispatched
              </span>
              <span className="text-emerald-400 text-lg font-black font-mono block mt-0.5">
                ${netAmount?.toLocaleString()}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[9px] font-bold text-slate-500 uppercase block leading-none">
                Release Date
              </span>
              <span className="text-white block mt-0.5">{paymentDate}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Itemized employee pay sheets */}
      <Card className="bg-card/40 border border-border/60 rounded-3xl overflow-hidden backdrop-blur-md text-left">
        <div className="p-5 border-b border-border/40 select-none">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Itemized Employee Compensation Ledgers
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-background/20 select-none text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-5">Specialist Full Name</th>
                <th className="py-3.5 px-4 text-right">Gross Period Pay</th>
                <th className="py-3.5 px-4 text-right">Withholding Tax (10%)</th>
                <th className="py-3.5 px-4 text-right">Allowances / Bonuses</th>
                <th className="py-3.5 px-5 text-right">Net Compensation settled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-slate-300">
              {employeesPay.map((item) => (
                <tr key={item._id} className="hover:bg-slate-900/10 transition-colors">
                  <td className="py-4 px-5">
                    <h4 className="font-bold text-white text-sm">{item.name}</h4>
                    <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                      {item.role}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right font-mono">
                    ${item.grossPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-red-400/90">
                    -${item.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-emerald-400/90">
                    +${item.allowances.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 px-5 text-right font-mono font-bold text-emerald-400 text-sm">
                    ${item.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Reminder alerts */}
      {status === 'draft' && (
        <Card className="bg-yellow-500/5 border border-yellow-500/25 p-5 rounded-2xl text-left backdrop-blur-md flex items-start gap-3 select-none">
          <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
              Payroll Awaiting Authorization
            </h4>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Verify line items and click &quot;Process &amp; Release Pay&quot; above to initiate
              automated direct deposit disbursements and settle accounts.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
