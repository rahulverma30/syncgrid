'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  PageHeader,
  Card,
  CardContent,
  Button,
  Input,
  LoadingSpinner,
  Select,
  DateInput,
} from '@/components/ui';
import {
  Users,
  ArrowLeft,
  Calendar,
  DollarSign,
  Briefcase,
  Mail,
  Phone,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : '';
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('Operations');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [salary, setSalary] = useState(85000);
  const [startDate, setStartDate] = useState('');
  const [status, setStatus] = useState('active');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (!employeeId) return;
    const fetchEmployee = async () => {
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
          setStatus('active');
        } else if (employeeId === 'e3') {
          setName('Pamela Isley');
          setRole('Bio-diversity Lead Research');
          setDepartment('Research');
          setEmail('isley@syncgrid.co');
          setPhone('415-555-0190');
          setSalary(125000);
          setStartDate('2025-02-01');
          setStatus('on-leave');
        } else {
          setName('Harvey Dent');
          setRole('Legal Chief Specialist');
          setDepartment('Legal');
          setEmail('dent@syncgrid.co');
          setPhone('312-555-0105');
          setSalary(145000);
          setStartDate('2025-01-10');
          setStatus('active');
        }
      } catch (err) {
        toast.error('Failed to load employee details for editing.');
      }
      setIsLoading(false);
    };
    fetchEmployee();
  }, [employeeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role) {
      toast.error('Name and Role Title are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success(`Employee details for "${name}" updated successfully.`);
      router.push(`/hr/employees/${employeeId}`);
    } catch (err) {
      toast.error('Failed to save employee profile adjustments.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground animate-pulse font-bold tracking-wider uppercase">
          Synthesizing employee data form...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 select-none font-semibold">
        <Link href={`/hr/employees/${employeeId}`}>
          <Button variant="outline" size="sm" className="h-8 hover:bg-accent/40 text-xs gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Profile
          </Button>
        </Link>
      </div>

      <PageHeader
        eyebrow="Human Resources Infrastructure"
        title="Edit Employee Profile"
        description="Modify role positions, adjust annual salary contracts, and manage leave status triggers."
      />

      <Card className="bg-card/40 border border-border/60 backdrop-blur-md">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Full Name
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Selina Kyle"
                  className="pl-10 bg-background/30 h-10 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Role Title Position
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Chief Acquisition Lead"
                    className="pl-10 bg-background/30 h-10 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select Department
                </label>
                <Select
                  value={department}
                  onChange={(val) => setDepartment(val)}
                  className="w-full px-3 bg-background/30 border border-border/60 hover:border-primary/20 rounded-xl h-10 text-xs text-slate-300 focus:ring-0 outline-none cursor-pointer"
                  options={[
                    { value: 'Operations', label: 'Operations Department' },
                    { value: 'Legal', label: 'Legal Counsel' },
                    { value: 'Research', label: 'Bio-Research' },
                    { value: 'Engineering', label: 'Engineering Suite' },
                    { value: 'Sales', label: 'Commercial Sales' },
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Corporate Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="kyle@syncgrid.co"
                    className="pl-10 bg-background/30 h-10 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="212-555-0177"
                    className="pl-10 bg-background/30 h-10 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Annual Salary Baseline ($)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    required
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(Number(e.target.value))}
                    placeholder="95000"
                    className="pl-10 bg-background/30 h-10 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Starting Contract Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <DateInput
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-10 bg-background/30 h-10 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Employee Status
                </label>
                <Select
                  value={status}
                  onChange={(val) => setStatus(val)}
                  className="w-full px-3 bg-background/30 border border-border/60 hover:border-primary/20 rounded-xl h-10 text-xs text-slate-300 focus:ring-0 outline-none cursor-pointer"
                  options={[
                    { value: 'active', label: 'Active Duty' },
                    { value: 'on-leave', label: 'On Paid Leave' },
                    { value: 'terminated', label: 'Terminated' },
                  ]}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/40 select-none">
              <Link href={`/hr/employees/${employeeId}`}>
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
                    Save Profile
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
