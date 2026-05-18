'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader, Card, CardContent, Button, Input, LoadingSpinner } from '@/components/ui';
import {
  Building2,
  Globe,
  DollarSign,
  Briefcase,
  Users,
  Compass,
  MapPin,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CreateAccountPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [clientType, setClientType] = useState('Startup');
  const [industry, setIndustry] = useState('SaaS');
  const [website, setWebsite] = useState('');
  const [revenueContribution, setRevenueContribution] = useState(25000);
  const [companySize, setCompanySize] = useState('11-50');
  const [accountManager, setAccountManager] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [address, setAddress] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !accountManager) {
      toast.error('Company Name and designated Account Manager are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/protected/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          clientType,
          industry,
          website,
          revenueContribution,
          companySize,
          accountManager,
          timezone,
          address,
          emails: [],
          phones: [],
          socialLinks: {},
          customFields: {},
          tags: [industry.toLowerCase()],
        }),
      });

      const d = await res.json();
      if (d.success) {
        toast.success(`Enterprise Account "${name}" onboarded successfully!`);
        router.push('/crm/accounts');
      } else {
        toast.error(d.message || 'Validation error saving company.');
      }
    } catch (err) {
      toast.error('Connection failure onboarding company.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 select-none">
        <Link href="/crm/accounts">
          <Button variant="outline" size="sm" className="h-8 hover:bg-accent/40 text-xs gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Accounts
          </Button>
        </Link>
      </div>

      <PageHeader
        eyebrow="Onboarding Wizard"
        title="Onboard Enterprise Account"
        description="Register a new corporate entity, segment their target profile, and define strategic customer support hierarchies."
      />

      <Card className="bg-card/40 border border-border/60 backdrop-blur-md">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Company Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Acme Corp"
                  className="pl-10 bg-background/30 h-10 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Client Type Segment
                </label>
                <div className="relative">
                  <Compass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <select
                    value={clientType}
                    onChange={(e) => setClientType(e.target.value)}
                    className="w-full pl-10 pr-4 bg-background/30 border border-border/60 hover:border-primary/20 rounded-xl h-10 text-xs text-slate-300 focus:ring-0 outline-none cursor-pointer"
                  >
                    <option value="Startup" className="bg-slate-950">
                      Startup Profile
                    </option>
                    <option value="Enterprise" className="bg-slate-950">
                      Enterprise Level
                    </option>
                    <option value="VIP" className="bg-slate-950">
                      VIP Corporate
                    </option>
                    <option value="High Value" className="bg-slate-950">
                      High Value Client
                    </option>
                    <option value="Retainer" className="bg-slate-950">
                      Retainer Period
                    </option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Business Industry
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full pl-10 pr-4 bg-background/30 border border-border/60 hover:border-primary/20 rounded-xl h-10 text-xs text-slate-300 focus:ring-0 outline-none cursor-pointer"
                  >
                    <option value="SaaS" className="bg-slate-950">
                      SaaS Products
                    </option>
                    <option value="Biotech" className="bg-slate-950">
                      Biotech Medical
                    </option>
                    <option value="Retail" className="bg-slate-950">
                      Retail / Logistics
                    </option>
                    <option value="E-Commerce" className="bg-slate-950">
                      Digital E-Commerce
                    </option>
                    <option value="Finance" className="bg-slate-950">
                      Financial Tech
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Website URL
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://acme.com"
                    className="pl-10 bg-background/30 h-10 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Annual Expected Revenue Contribution
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    required
                    type="number"
                    value={revenueContribution}
                    onChange={(e) => setRevenueContribution(Number(e.target.value))}
                    placeholder="50000"
                    className="pl-10 bg-background/30 h-10 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Designated Account Manager
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    required
                    value={accountManager}
                    onChange={(e) => setAccountManager(e.target.value)}
                    placeholder="Jane Doe (Sales Chief)"
                    className="pl-10 bg-background/30 h-10 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Company Scale (Employees)
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <select
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    className="w-full pl-10 pr-4 bg-background/30 border border-border/60 hover:border-primary/20 rounded-xl h-10 text-xs text-slate-300 focus:ring-0 outline-none cursor-pointer"
                  >
                    <option value="1-10" className="bg-slate-950">
                      1 - 10 employees
                    </option>
                    <option value="11-50" className="bg-slate-950">
                      11 - 50 employees
                    </option>
                    <option value="51-200" className="bg-slate-950">
                      51 - 200 employees
                    </option>
                    <option value="201+" className="bg-slate-950">
                      201+ employees
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Timezone context
                </label>
                <Input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="UTC / America/New_York"
                  className="bg-background/30 h-10 text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Physical Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="100 Silicon Way, SF CA"
                    className="pl-10 bg-background/30 h-10 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/40 select-none">
              <Link href="/crm/accounts">
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
                    Register Account
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
