'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  TrendingUp,
  Mail,
  Phone,
  DollarSign,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Tag,
  Users,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CreateDealPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [budget, setBudget] = useState(15000);
  const [status, setStatus] = useState('qualified');
  const [priority, setPriority] = useState('medium');
  const [source, setSource] = useState('website');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [workType, setWorkType] = useState('Custom Portal Dev');
  const [techStack, setTechStack] = useState('');

  const [accountId, setAccountId] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const fetchAccounts = async () => {
      try {
        const res = await fetch('/api/protected/crm/accounts');
        const d = await res.json();
        if (d.success) setAccounts(d.data || []);
      } catch (err) {
        toast.error('Failed to load accounts.');
      }
    };
    fetchAccounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contactPerson) {
      toast.error('Deal Name and Lead Contact Person are required.');
      return;
    }
    if (!accountId) {
      toast.error('You must link this deal to an existing Corporate Account.');
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (phone && phone.replace(/\D/g, '').length < 10) {
      toast.error('Please enter a valid phone number with at least 10 digits.');
      return;
    }

    if (budget < 0) {
      toast.error('Budget cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/protected/crm/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          accountId,
          value: budget,
          stage: status,
          expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : new Date(),
          probability: 50,
          notes: [
            {
              content: `${workType} - ${priority} priority - Source: ${source}`,
            },
          ],
        }),
      });

      const d = await res.json();
      if (d.success) {
        toast.success(`Sales Opportunity "${name}" created successfully!`);
        router.push('/crm/deals');
      } else {
        toast.error(d.message || 'Validation error registering deal.');
      }
    } catch (err) {
      toast.error('Network failure recording sales deal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 select-none">
        <Link href="/crm/deals">
          <Button variant="outline" size="sm" className="h-8 hover:bg-accent/40 text-xs gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Deals
          </Button>
        </Link>
      </div>

      <PageHeader
        eyebrow="Onboarding Wizard"
        title="Add Sales Deal Opportunity"
        description="Register a new commercial deal, forecast budgets, prioritize accounts, and sync stages with the Kanban pipeline."
      />

      <Card className="bg-card/40 border border-border/60 backdrop-blur-md">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Corporate Account
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Select
                    value={accountId}
                    onChange={(val) => setAccountId(val)}
                    className="w-full pl-10 pr-4 bg-background/30 border border-border/60 hover:border-primary/20 rounded-xl h-10 text-xs text-slate-300 focus:ring-0 outline-none cursor-pointer"
                    options={[
                      { value: '', label: 'Select Corporate Account...' },
                      ...accounts.map((a) => ({ value: a._id, label: a.name })),
                    ]}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Opportunity Name
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Q3 Enterprise Renewal"
                    className="pl-10 bg-background/30 h-10 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Lead Contact Person
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Samantha Vance"
                    className="pl-10 bg-background/30 h-10 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Target Deal Budget ($)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    required
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    placeholder="45000"
                    className="pl-10 bg-background/30 h-10 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Stakeholder Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vance@globex.co"
                    className="pl-10 bg-background/30 h-10 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Stakeholder Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="650-555-0143"
                    className="pl-10 bg-background/30 h-10 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Pipeline Stage
                </label>
                <Select
                  value={status}
                  onChange={(val) => setStatus(val)}
                  className="w-full px-3 bg-background/30 border border-border/60 hover:border-primary/20 rounded-xl h-10 text-xs text-slate-300 focus:ring-0 outline-none cursor-pointer"
                  options={[
                    { value: 'qualified', label: 'Qualified Lead' },
                    { value: 'proposal', label: 'Proposal Sent' },
                    { value: 'negotiation', label: 'Negotiating' },
                  ]}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Priority Rating
                </label>
                <Select
                  value={priority}
                  onChange={(val) => setPriority(val)}
                  className="w-full px-3 bg-background/30 border border-border/60 hover:border-primary/20 rounded-xl h-10 text-xs text-slate-300 focus:ring-0 outline-none cursor-pointer"
                  options={[
                    { value: 'low', label: 'Low Priority' },
                    { value: 'medium', label: 'Medium Priority' },
                    { value: 'high', label: 'High Priority' },
                  ]}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Expected Close
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <DateInput
                    value={expectedCloseDate}
                    onChange={(e) => setExpectedCloseDate(e.target.value)}
                    className="pl-10 bg-background/30 h-10 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Work Type Description
                </label>
                <Input
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value)}
                  placeholder="Custom Mobile App Development"
                  className="bg-background/30 h-10 text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Proposed Tech Stack
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    value={techStack}
                    onChange={(e) => setTechStack(e.target.value)}
                    placeholder="React, AWS, Node.js"
                    className="pl-10 bg-background/30 h-10 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/40 select-none">
              <Link href="/crm/deals">
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
                    Registering...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Create Deal
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
