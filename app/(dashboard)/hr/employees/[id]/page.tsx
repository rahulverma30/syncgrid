'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader, Card, CardContent, Button, Input, LoadingSpinner } from '@/components/ui';
import {
  Users,
  ArrowLeft,
  Calendar,
  DollarSign,
  Edit2,
  Briefcase,
  History,
  CheckCircle,
  FileText,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';

interface Payslip {
  _id: string;
  payPeriod: string;
  netPay: number;
  paymentDate: string;
}

export default function EmployeeDetailsPage() {
  const params = useParams();
  const employeeId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : '';
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // States
  const [name, setName] = useState('Harvey Dent');
  const [role, setRole] = useState('Legal Chief Specialist');
  const [department, setDepartment] = useState('Legal');
  const [email, setEmail] = useState('dent@syncgrid.co');
  const [phone, setPhone] = useState('312-555-0105');
  const [salary, setSalary] = useState(145000);
  const [status, setStatus] = useState('active');
  const [startDate, setStartDate] = useState('2025-01-10');
  const [rating, setRating] = useState(4.8);

  const [payslips, setPayslips] = useState<Payslip[]>([
    { _id: 'p1', payPeriod: 'April 2026', netPay: 12083.33, paymentDate: '2026-04-30' },
    { _id: 'p2', payPeriod: 'March 2026', netPay: 12083.33, paymentDate: '2026-03-31' },
  ]);

  const [notes, setNotes] = useState<string[]>([
    'Completed annual corporate audit review with zero contract defects.',
    'Promoted to Lead legal counsel following exceptional Q1 metrics.',
  ]);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (!employeeId) return;
    const fetchEmployeeDetails = async () => {
      setIsLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (employeeId === 'e2') {
          setName('Selina Kyle');
          setRole('Strategic Acquisition Manager');
          setDepartment('Operations');
          setEmail('kyle@syncgrid.co');
          setPhone('212-555-0177');
          setSalary(115000);
          setStartDate('2025-03-15');
          setRating(4.9);
          setPayslips([
            { _id: 'p3', payPeriod: 'April 2026', netPay: 9583.33, paymentDate: '2026-04-30' },
            { _id: 'p4', payPeriod: 'March 2026', netPay: 9583.33, paymentDate: '2026-03-31' },
          ]);
        } else if (employeeId === 'e3') {
          setName('Pamela Isley');
          setRole('Bio-diversity Lead Research');
          setDepartment('Research');
          setEmail('isley@syncgrid.co');
          setPhone('415-555-0190');
          setSalary(125000);
          setStatus('on-leave');
          setStartDate('2025-02-01');
          setRating(4.5);
        }
      } catch (err) {
        toast.error('Failed to load employee details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchEmployeeDetails();
  }, [employeeId]);

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    setNotes([noteText, ...notes]);
    setNoteText('');
    toast.success('Performance review logged to record.');
  };

  const handleSubmitLeave = () => {
    setStatus('on-leave');
    toast.success('Leave request submitted. HR review dispatched.');
  };

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground animate-pulse font-bold tracking-wider uppercase">
          Synthesizing employee contract details...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 select-none">
        <Link href="/hr/employees">
          <Button variant="outline" size="sm" className="h-8 hover:bg-accent/40 text-xs gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Employees
          </Button>
        </Link>
        <Link href={`/hr/employees/${employeeId}/edit`}>
          <Button variant="default" size="sm" className="h-8 text-xs gap-1">
            <Edit2 className="h-3.5 w-3.5" />
            Edit Profile details
          </Button>
        </Link>
      </div>

      {/* Employee Profile Header Card */}
      <Card className="bg-gradient-to-r from-slate-900/40 to-slate-950/40 border border-border/60 p-6 rounded-2xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 text-left">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 text-2xl font-black font-mono shadow-inner select-none">
              {name.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-white">{name}</h1>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider ${
                    status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                  }`}
                >
                  {status}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                {role} • {department} Department
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-semibold select-none">
            <div className="text-right">
              <span className="text-[9px] font-bold text-slate-500 uppercase block leading-none">
                Salary Baseline
              </span>
              <span className="text-emerald-400 text-lg font-black font-mono block mt-0.5">
                ${salary?.toLocaleString()} / yr
              </span>
            </div>

            <div className="text-right">
              <span className="text-[9px] font-bold text-slate-500 uppercase block leading-none">
                Rating Index
              </span>
              <span className="text-white block mt-0.5 flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                {rating} / 5.0
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Main details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Payslips history */}
          <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl text-left backdrop-blur-md">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2 select-none">
              <FileText className="h-4 w-4 text-slate-400" />
              Processed Payroll Payslips
            </h2>

            <div className="space-y-3">
              {payslips.map((p) => (
                <div
                  key={p._id}
                  className="bg-background/20 p-3.5 rounded-xl border border-border/40 text-xs flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-sm">{p.payPeriod} net payslip</h4>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 select-none">
                      <Calendar className="h-3.5 w-3.5" /> Paid: {p.paymentDate}
                    </span>
                  </div>
                  <div className="text-right select-none">
                    <span className="font-mono font-bold text-emerald-400">
                      ${p.netPay.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
              {payslips.length === 0 && (
                <p className="text-slate-500 text-xs text-center py-4 select-none">
                  No payroll distributions recorded for this employee cycle.
                </p>
              )}
            </div>
          </Card>

          {/* Performance reviews logs */}
          <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl text-left backdrop-blur-md space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 select-none">
              <History className="h-4 w-4 text-slate-400" />
              Performance & Work Logs
            </h2>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Record work review notes..."
                  className="bg-background/40 h-9 text-xs"
                />
                <Button
                  onClick={handleAddNote}
                  variant="default"
                  size="sm"
                  className="h-9 text-xs select-none"
                >
                  Log Review
                </Button>
              </div>

              <div className="space-y-3 pt-1">
                {notes.map((n, i) => (
                  <p
                    key={i}
                    className="bg-background/20 p-3.5 rounded-xl border border-border/40 text-xs leading-relaxed text-slate-300"
                  >
                    {n}
                  </p>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Info Panel */}
        <div className="space-y-6">
          <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl text-left backdrop-blur-md space-y-4 select-none">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-border/40 pb-2">
              HR Reference Details
            </h2>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase block leading-none">
                  Email Address
                </span>
                <span className="font-semibold text-slate-200 block truncate">{email}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase block leading-none">
                  Phone Contact
                </span>
                <span className="font-semibold text-slate-200 block">{phone}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase block leading-none">
                  Start Date
                </span>
                <span className="font-semibold text-slate-200 block">{startDate}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase block leading-none">
                  Calculated Monthly Rate
                </span>
                <span className="font-mono font-bold text-slate-300 block">
                  ${Math.round(salary / 12).toLocaleString()} / month
                </span>
              </div>
            </div>
          </Card>

          {/* Quick leave request trigger */}
          {status === 'active' && (
            <Card className="bg-yellow-500/5 border border-yellow-500/25 p-5 rounded-2xl text-left backdrop-blur-md space-y-3 select-none">
              <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
                Leave Authorization
              </h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Click below to submit a structured employee leave authorization cycle.
              </p>
              <Button
                onClick={handleSubmitLeave}
                variant="outline"
                size="sm"
                className="w-full text-xs h-8 hover:bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
              >
                Dispatched Paid Leave
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
