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
} from '@/components/ui';
import {
  Building2,
  Globe,
  DollarSign,
  Briefcase,
  Users,
  MapPin,
  ArrowLeft,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

export default function EditAccountPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : '';
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [revenue, setRevenue] = useState(0);
  const [ownerId, setOwnerId] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (!accountId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [usersRes, accRes] = await Promise.all([
          fetch('/api/protected/team/members'),
          fetch(`/api/protected/crm/accounts/${accountId}`),
        ]);

        const ud = await usersRes.json();
        if (ud.success) setUsers(ud.data);

        const ad = await accRes.json();
        if (ad.success && ad.data) {
          const a = ad.data;
          setName(a.name);
          setIndustry(a.industry || '');
          setWebsite(a.website || '');
          setRevenue(a.revenue || 0);
          setOwnerId(a.ownerId?._id || a.ownerId || '');
          setAddress(a.address || '');
          setNotes(a.notes || '');
        }
      } catch (err) {
        toast.error('Failed to load account details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [accountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !ownerId) {
      toast.error('Company Name and designated Account Manager are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/protected/crm/accounts/${accountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          industry,
          website,
          revenue,
          ownerId,
          address,
          notes,
        }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success(`Account details saved successfully.`);
        router.push(`/crm/accounts/${accountId}`);
      } else {
        toast.error('Failed to save account details.');
      }
    } catch (err) {
      toast.error('Failed to save account details.');
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
          Synthesizing account data form...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 select-none">
        <Link href={`/crm/accounts/${accountId}`}>
          <Button variant="outline" size="sm" className="h-8 hover:bg-accent/40 text-xs gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Profile
          </Button>
        </Link>
      </div>

      <PageHeader
        eyebrow="Relationship Governance"
        title="Edit Corporate Account"
        description="Update corporate settings, annual contract valuations, and dedicated team account managers."
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
                  Business Industry
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. SaaS, Fintech..."
                    className="pl-10 bg-background/30 h-10 text-xs"
                  />
                </div>
              </div>

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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Annual Expected Revenue
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    required
                    type="number"
                    value={revenue}
                    onChange={(e) => setRevenue(Number(e.target.value))}
                    className="pl-10 bg-background/30 h-10 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Designated Account Manager
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 z-10" />
                  <Select
                    value={ownerId}
                    onChange={(val) => setOwnerId(val)}
                    className="w-full pl-10 pr-4 bg-background/30 border border-border/60 hover:border-primary/20 rounded-xl h-10 text-xs text-slate-300 focus:ring-0 outline-none cursor-pointer"
                    options={[
                      { value: '', label: 'Select Manager...' },
                      ...users.map((u) => ({ value: u._id, label: `${u.name}` })),
                    ]}
                  />
                </div>
              </div>
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

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                General Notes
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter context, background, or goals..."
                  className="w-full pl-10 pr-4 py-2 bg-background/30 border border-border/60 hover:border-primary/20 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary min-h-[100px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/40 select-none">
              <Link href={`/crm/accounts/${accountId}`}>
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
                    Save Details
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
