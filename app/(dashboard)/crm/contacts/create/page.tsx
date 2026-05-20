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
} from '@/components/ui';
import {
  Users,
  Building2,
  Mail,
  Phone,
  Tag,
  MessageSquare,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface CompanyOption {
  _id: string;
  name: string;
}

export default function CreateContactPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('Director');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [communicationPref, setCommunicationPref] = useState('email');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const fetchCompanies = async () => {
      try {
        const res = await fetch('/api/protected/clients');
        const d = await res.json();
        if (d.success) {
          setCompanies(d.data.map((c: any) => ({ _id: c._id, name: c.name })));
          if (d.data.length > 0) {
            setCompanyId(d.data[0]._id);
          }
        }
      } catch (err) {
        toast.error('Failed to load corporate accounts list.');
      } finally {
        setIsLoadingCompanies(false);
      }
    };
    fetchCompanies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !companyId) {
      toast.error('Stakeholder name, email, and corporate company are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate adding contact to target client subdocument
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success(`Contact for "${name}" registered successfully!`);
      router.push('/crm/contacts');
    } catch (err) {
      toast.error('Could not save contact record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 select-none">
        <Link href="/crm/contacts">
          <Button variant="outline" size="sm" className="h-8 hover:bg-accent/40 text-xs gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Directory
          </Button>
        </Link>
      </div>

      <PageHeader
        eyebrow="Onboarding Wizard"
        title="Add Stakeholder Profile"
        description="Register a new individual stakeholder, define their role, and link them to an active client account."
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
                  placeholder="John Doe"
                  className="pl-10 bg-background/30 h-10 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Role / Position
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Chief Operating Officer"
                    className="pl-10 bg-background/30 h-10 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Linked Corporate Account
                </label>
                {isLoadingCompanies ? (
                  <div className="h-10 flex items-center px-3 bg-background/20 rounded-xl">
                    <LoadingSpinner className="h-4 w-4 text-primary animate-spin mr-2" />
                    <span className="text-[10px] text-slate-500">Syncing companies...</span>
                  </div>
                ) : (
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Select
                      value={companyId}
                      onChange={(val) => setCompanyId(val)}
                      className="w-full pl-10 pr-4 bg-background/30 border border-border/60 hover:border-primary/20 rounded-xl h-10 text-xs text-slate-300 focus:ring-0 outline-none cursor-pointer"
                      options={[{ value: 'c._id', label: '{c.name}' }]}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doe@corporate.com"
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
                    placeholder="415-555-0199"
                    className="pl-10 bg-background/30 h-10 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Prefer Channel
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Select
                    value={communicationPref}
                    onChange={(val) => setCommunicationPref(val)}
                    className="w-full pl-10 pr-4 bg-background/30 border border-border/60 hover:border-primary/20 rounded-xl h-10 text-xs text-slate-300 focus:ring-0 outline-none cursor-pointer"
                    options={[
                      { value: 'email', label: 'Email Only' },
                      { value: 'phone', label: 'Phone Call' },
                      { value: 'slack', label: 'Corporate Slack' },
                      { value: 'zoom', label: 'Zoom Meeting' },
                    ]}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 bg-background/20 p-4 rounded-xl border border-border/40 select-none mt-5">
                <input
                  type="checkbox"
                  id="primaryContact"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded border-border/60 text-primary h-4.5 w-4.5 focus:ring-0 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <label
                    htmlFor="primaryContact"
                    className="text-xs font-bold text-white block cursor-pointer"
                  >
                    Primary Key Contact
                  </label>
                  <span className="text-[9px] text-slate-400 block leading-none">
                    Target account decision-maker
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/40 select-none">
              <Link href="/crm/contacts">
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
                    Register Contact
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
