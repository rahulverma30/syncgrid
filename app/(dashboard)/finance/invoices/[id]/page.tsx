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
  Printer,
  Download,
  CheckCircle,
  Building,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export default function InvoiceDetailsPage() {
  const params = useParams();
  const invoiceId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : '';
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // States
  const [invoiceNumber, setInvoiceNumber] = useState('INV-2026-001');
  const [clientName, setClientName] = useState('Acme Corp');
  const [issueDate, setIssueDate] = useState('2026-05-01');
  const [dueDate, setDueDate] = useState('2026-05-31');
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: 'Next.js Custom ERP Build', quantity: 1, rate: 45000, amount: 45000 },
    {
      description: 'Corporate AWS Landing Zone Configuration',
      quantity: 2,
      rate: 10000,
      amount: 20000,
    },
  ]);
  const [subtotal, setSubtotal] = useState(65000);
  const [tax, setTax] = useState(6500);
  const [total, setTotal] = useState(71500);
  const [status, setStatus] = useState('sent');
  const [paymentMethod, setPaymentMethod] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (!invoiceId) return;
    const fetchInvoiceDetails = async () => {
      setIsLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (invoiceId === 'i1') {
          setInvoiceNumber('INV-2026-001');
          setClientName('Acme Corp');
          setItems([
            { description: 'Next.js Custom ERP Build', quantity: 1, rate: 45000, amount: 45000 },
          ]);
          setSubtotal(45000);
          setTax(4500);
          setTotal(49500);
          setStatus('paid');
          setPaymentMethod('ACH Transfer');
        } else if (invoiceId === 'i3') {
          setInvoiceNumber('INV-2026-003');
          setClientName('Umbrella Corp');
          setItems([
            {
              description: 'Security Telemetry Auditing Scope',
              quantity: 1,
              rate: 12000,
              amount: 12000,
            },
          ]);
          setSubtotal(12000);
          setTax(1200);
          setTotal(13200);
          setStatus('overdue');
        }
      } catch (err) {
        toast.error('Failed to sync invoice details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvoiceDetails();
  }, [invoiceId]);

  const handleMarkAsPaid = () => {
    setStatus('paid');
    setPaymentMethod('Manually Settle Card');
    toast.success('Invoice marked as Paid. Auto-syncing corporate balance sheet.');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    toast.success('Generating secured enterprise PDF invoice... Download starting shortly.');
  };

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground animate-pulse font-bold tracking-wider uppercase">
          Synthesizing printable invoice parameters...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto print:bg-white print:text-black">
      <div className="flex items-center justify-between gap-4 select-none print:hidden">
        <Link href="/finance/invoices">
          <Button variant="outline" size="sm" className="h-8 hover:bg-accent/40 text-xs gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Invoices
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          {status !== 'paid' && (
            <Button
              onClick={handleMarkAsPaid}
              variant="default"
              size="sm"
              className="h-8 text-xs gap-1"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Mark Paid
            </Button>
          )}
          <Button
            onClick={handleDownloadPDF}
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1 hover:bg-accent/40"
          >
            <Download className="h-3.5 w-3.5" />
            Download PDF
          </Button>
          <Button
            onClick={handlePrint}
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1 hover:bg-accent/40"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Invoice
          </Button>
        </div>
      </div>

      {/* Main printable invoice body */}
      <Card className="bg-card/40 border border-border/60 p-8 rounded-3xl backdrop-blur-md print:border-none print:p-0 print:bg-transparent">
        <div className="space-y-8 text-left">
          {/* Top Banner Header */}
          <div className="flex justify-between items-start flex-wrap gap-4 border-b border-border/40 pb-6 print:border-slate-300">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Building className="h-6 w-6 text-primary print:text-black" />
                <h1 className="text-xl font-black text-white print:text-black tracking-wider uppercase">
                  SyncGrid Enterprise
                </h1>
              </div>
              <p className="text-[10px] text-slate-400 print:text-slate-600 leading-normal max-w-xs">
                100 Silicon Way, Tech Tower B<br />
                San Francisco, CA 94107
                <br />
                billing@syncgrid.co
              </p>
            </div>

            <div className="text-right space-y-1">
              <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none">
                Invoice Statement
              </h2>
              <span className="text-lg font-black font-mono text-white print:text-black block mt-1">
                {invoiceNumber}
              </span>
              <span
                className={`inline-flex px-2 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider select-none mt-1.5 ${
                  status === 'paid'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                }`}
              >
                {status}
              </span>
            </div>
          </div>

          {/* Addresses info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-2">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                Billed To:
              </span>
              <h4 className="font-bold text-white print:text-black text-sm">{clientName}</h4>
              <p className="text-[10px] text-slate-400 print:text-slate-600 leading-relaxed">
                Corporate Headquarters Address
                <br />
                B2B Client Services Account
              </p>
            </div>

            <div className="sm:text-right space-y-3.5 text-xs select-none">
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  Issue Date
                </span>
                <span className="font-semibold text-slate-300 print:text-black">{issueDate}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  Due Date
                </span>
                <span className="font-semibold text-slate-300 print:text-black">{dueDate}</span>
              </div>
            </div>
          </div>

          {/* Itemized list */}
          <div className="border border-border/40 rounded-2xl overflow-hidden print:border-slate-300">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-background/20 select-none text-[10px] font-bold uppercase tracking-wider text-slate-400 print:bg-slate-100 print:text-slate-700 print:border-slate-300">
                  <th className="py-3 px-4">Line-item Description</th>
                  <th className="py-3 px-4 text-center w-16">Qty</th>
                  <th className="py-3 px-4 text-right w-24">Unit Rate</th>
                  <th className="py-3 px-4 text-right w-28">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 print:divide-slate-200">
                {items.map((item, idx) => (
                  <tr key={idx} className="print:text-black">
                    <td className="py-4 px-4 font-semibold text-white print:text-black">
                      {item.description}
                    </td>
                    <td className="py-4 px-4 text-center text-slate-400 print:text-black font-mono">
                      {item.quantity}
                    </td>
                    <td className="py-4 px-4 text-right text-slate-400 print:text-black font-mono">
                      ${item.rate.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-white print:text-black">
                      ${item.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals computation */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-4 border-t border-border/40 print:border-slate-300">
            <div className="text-xs space-y-1.5 max-w-xs text-slate-400 print:text-slate-600">
              <span className="font-bold uppercase tracking-wider text-[9px] text-slate-500 block">
                Payment Notes:
              </span>
              <p className="leading-relaxed">
                Thank you for your business. Please transmit all ACH transfers within net terms to
                ensure active project support lines remain open.
              </p>
              {paymentMethod && (
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase pt-1">
                  <CreditCard className="h-3.5 w-3.5" />
                  Settle: {paymentMethod}
                </div>
              )}
            </div>

            <div className="w-full sm:max-w-[240px] space-y-2.5 text-xs select-none">
              <div className="flex justify-between items-center text-slate-400 print:text-slate-700">
                <span>Subtotal amount</span>
                <span className="font-mono">${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400 print:text-slate-700">
                <span>Tax liability (10.0%)</span>
                <span className="font-mono">${tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-white print:text-black font-bold border-t border-border/40 pt-2.5 text-sm print:border-slate-300">
                <span>Statement Total</span>
                <span className="font-mono font-black text-emerald-400 print:text-black text-base">
                  ${total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
