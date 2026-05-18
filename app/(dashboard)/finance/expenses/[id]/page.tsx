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
  Paperclip,
  CheckCircle,
  XCircle,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ExpenseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // States
  const [category, setCategory] = useState('software');
  const [amount, setAmount] = useState(2450);
  const [paymentMethod, setPaymentMethod] = useState('Corporate Card');
  const [payee, setPayee] = useState('Amazon Web Services');
  const [expenseDate, setExpenseDate] = useState('2026-05-15');
  const [status, setStatus] = useState('pending');
  const [notes, setNotes] = useState('Production hosting services for enterprise tenants.');
  const [receiptUrl, setReceiptUrl] = useState('https://syncgrid.co/receipts/aws_389.pdf');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const fetchExpenseDetails = async () => {
      setIsLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (params.id === 'e1') {
          setCategory('software');
          setAmount(2450);
          setPaymentMethod('Corporate Card');
          setPayee('Amazon Web Services');
          setExpenseDate('2026-05-15');
          setStatus('approved');
          setNotes('Production hosting services for enterprise tenants.');
          setReceiptUrl('https://syncgrid.co/receipts/aws_389.pdf');
        } else if (params.id === 'e3') {
          setCategory('travel');
          setAmount(850);
          setPaymentMethod('Reimbursement');
          setPayee('Lucius Fox');
          setExpenseDate('2026-05-08');
          setStatus('rejected');
          setNotes('Tactical equipment shipping surcharge.');
          setReceiptUrl('');
        }
      } catch (err) {
        toast.error('Failed to sync expense details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchExpenseDetails();
  }, [params.id]);

  const handleApprove = () => {
    setStatus('approved');
    toast.success('Expense transaction successfully approved.');
  };

  const handleReject = () => {
    setStatus('rejected');
    toast.error('Expense claim rejected.');
  };

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground animate-pulse font-bold tracking-wider uppercase">
          Synthesizing expense transaction details...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 select-none">
        <Link href="/finance/expenses">
          <Button variant="outline" size="sm" className="h-8 hover:bg-accent/40 text-xs gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Expenses
          </Button>
        </Link>

        {status === 'pending' && (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleReject}
              variant="destructive"
              size="sm"
              className="h-8 text-xs gap-1"
            >
              <XCircle className="h-3.5 w-3.5" />
              Reject Claim
            </Button>
            <Button
              onClick={handleApprove}
              variant="default"
              size="sm"
              className="h-8 text-xs gap-1"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Approve Claim
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details and Receipt preview */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/40 border border-border/60 p-6 rounded-2xl text-left backdrop-blur-md space-y-6">
            <div className="flex justify-between items-start border-b border-border/40 pb-4">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  Expense Payee
                </span>
                <h2 className="text-xl font-black text-white">{payee}</h2>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  Transaction Amount
                </span>
                <span className="text-emerald-400 font-mono font-black text-xl block mt-0.5">
                  ${amount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs select-none">
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">
                  Category Tag
                </span>
                <span className="font-bold text-purple-400 uppercase tracking-wider">
                  {category}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">
                  Payment Method
                </span>
                <span className="font-semibold text-slate-200">{paymentMethod}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">
                  Expense Date
                </span>
                <span className="font-semibold text-slate-200">{expenseDate}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">
                  Onboarding Stage
                </span>
                <span className="font-bold text-slate-200 uppercase tracking-wider">{status}</span>
              </div>
            </div>

            <div className="border-t border-border/40 pt-4 space-y-1.5">
              <span className="text-[9px] font-bold text-slate-500 uppercase block select-none">
                Expense Description Notes
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">{notes}</p>
            </div>
          </Card>

          {/* Receipt Preview */}
          {receiptUrl ? (
            <Card className="bg-card/40 border border-border/60 p-6 rounded-2xl text-left backdrop-blur-md space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 select-none">
                <Paperclip className="h-4 w-4 text-slate-400" />
                Attached Payment Receipt
              </h3>
              <div className="bg-background/40 border border-dashed border-border/80 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-3 select-none">
                <FileText className="h-10 w-10 text-primary" />
                <div>
                  <h4 className="font-bold text-white text-xs">aws_receipt_statement_389.pdf</h4>
                  <span className="text-[9px] text-slate-500 block">PDF Document • 1.2 MB</span>
                </div>
                <a href={receiptUrl} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1 hover:bg-accent/40"
                  >
                    View Receipt File
                  </Button>
                </a>
              </div>
            </Card>
          ) : (
            <Card className="bg-card/40 border border-border/60 p-6 rounded-2xl text-left backdrop-blur-md select-none">
              <div className="text-slate-500 text-xs text-center py-4">
                No receipt file was uploaded for this expense claim.
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar logs */}
        <div className="space-y-6 select-none">
          <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl text-left backdrop-blur-md space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-border/40 pb-2">
              Approval Lifecycle
            </h3>
            <div className="space-y-4 relative pl-4 border-l border-border/60 text-xs">
              <div className="relative">
                <div
                  className={`absolute -left-[21px] top-1 h-2 w-2 rounded-full ring-4 ring-slate-900 ${
                    status === 'approved'
                      ? 'bg-emerald-500'
                      : status === 'rejected'
                        ? 'bg-red-500'
                        : 'bg-yellow-500'
                  }`}
                />
                <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">
                  {status} stage
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Approval process status updated.
                </p>
              </div>

              <div className="relative">
                <div className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-primary ring-4 ring-slate-900" />
                <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">
                  Claim Filed
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Recorded in database by system admin.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
