'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader, Card, CardContent, Button, Input, LoadingSpinner } from '@/components/ui';
import {
  Building2,
  Globe,
  DollarSign,
  ArrowLeft,
  Edit2,
  Users,
  Briefcase,
  MapPin,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

interface Contact {
  _id: string;
  name: string;
  role: string;
  email: string;
}

interface Deal {
  _id: string;
  name: string;
  amount: number;
  stage: string;
}

export default function AccountDetailsPage() {
  const params = useParams();
  const accountId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : '';
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // States
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [revenue, setRevenue] = useState(0);
  const [owner, setOwner] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (!accountId) return;
    const fetchAccountDetails = async () => {
      setIsLoading(true);
      try {
        const [res, contactsRes, dealsRes] = await Promise.all([
          fetch(`/api/protected/crm/accounts/${accountId}`),
          fetch(`/api/protected/crm/contacts?accountId=${accountId}`),
          fetch(`/api/protected/crm/deals?accountId=${accountId}`),
        ]);
        const d = await res.json();
        const cd = await contactsRes.json();
        const dd = await dealsRes.json();

        if (cd.success && cd.data) {
          setContacts(
            cd.data.map((c: any) => ({
              _id: c._id,
              name: `${c.firstName} ${c.lastName}`,
              role: c.role || 'Stakeholder',
              email: c.email || '',
            }))
          );
        }

        if (dd.success && dd.data) {
          setDeals(dd.data);
        }

        if (d.success && d.data) {
          const a = d.data;
          setName(a.name);
          setIndustry(a.industry || 'Unknown');
          setWebsite(a.website || 'No website');
          setRevenue(a.revenue || 0);
          setOwner(a.ownerId?.name || 'Unassigned');
          setAddress(a.address || 'No address provided');
          setNotes(a.notes || 'No general notes available for this account.');
        }
      } catch (err) {
        toast.error('Failed to sync details from server.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAccountDetails();
  }, [accountId]);

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground animate-pulse font-bold tracking-wider uppercase">
          Synthesizing account telemetry...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 select-none">
        <Link href="/crm/accounts">
          <Button variant="outline" size="sm" className="h-8 hover:bg-accent/40 text-xs gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Accounts
          </Button>
        </Link>
        <Link href={`/crm/accounts/${accountId}/edit`}>
          <Button variant="default" size="sm" className="h-8 text-xs gap-1">
            <Edit2 className="h-3.5 w-3.5" />
            Edit Details
          </Button>
        </Link>
      </div>

      {/* Account Profile Header Card */}
      <Card className="bg-gradient-to-r from-slate-900/40 to-slate-950/40 border border-border/60 p-6 rounded-2xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 text-2xl font-black font-mono shadow-inner select-none">
              {name.charAt(0)}
            </div>
            <div className="space-y-1 text-left">
              <h1 className="text-2xl font-black text-white">{name}</h1>
              <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-slate-500" />
                {industry} Sector
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold select-none">
            <div className="text-right">
              <span className="text-[9px] font-bold text-slate-500 uppercase block leading-none">
                Annual Revenue
              </span>
              <span className="text-emerald-400 text-lg font-black font-mono block mt-0.5">
                ${revenue.toLocaleString()}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[9px] font-bold text-slate-500 uppercase block leading-none">
                Account Owner
              </span>
              <span className="text-white block mt-0.5">{owner}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Grid content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Active Deals Grid */}
          <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl text-left backdrop-blur-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 select-none">
                <Briefcase className="h-4 w-4 text-blue-400" />
                Active Deals ({deals.length})
              </h2>
            </div>
            {deals.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                No deals tracked for this account yet.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {deals.map((d) => (
                  <div
                    key={d._id}
                    className="bg-background/20 p-3.5 rounded-xl border border-border/40 text-xs space-y-1"
                  >
                    <h4 className="font-bold text-white text-sm">{d.name}</h4>
                    <span className="inline-flex bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-[8px] font-bold">
                      {d.stage}
                    </span>
                    <p className="font-mono text-emerald-400 font-bold mt-1">
                      ${d.amount.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Stakeholders */}
          <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl text-left backdrop-blur-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 select-none">
                <Users className="h-4 w-4 text-slate-400" />
                Stakeholder directory ({contacts.length})
              </h2>
              <Link href={`/crm/contacts/create?accountId=${accountId}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] uppercase font-bold tracking-wider gap-1"
                >
                  Add Contact
                </Button>
              </Link>
            </div>
            {contacts.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No contacts attached to this account.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {contacts.map((c) => (
                  <Link key={c._id} href={`/crm/contacts/${c._id}`}>
                    <div className="bg-background/20 hover:bg-background/40 transition p-3.5 rounded-xl border border-border/40 text-xs flex justify-between items-start cursor-pointer">
                      <div className="space-y-1">
                        <h4 className="font-bold text-white text-sm">{c.name}</h4>
                        <span className="inline-flex bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[8px] font-bold">
                          {c.role}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">{c.email}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar Info Panel */}
        <div className="space-y-6">
          <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl text-left backdrop-blur-md space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-border/40 pb-2 select-none">
              Account Overview
            </h2>
            <div className="space-y-4">
              <div className="bg-background/20 p-3.5 rounded-xl border border-border/40 text-xs space-y-1 select-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase block flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" /> Address
                </span>
                <span className="text-slate-200 block mb-3">{address}</span>

                <span className="text-[10px] font-bold text-slate-400 uppercase block flex items-center gap-1.5">
                  <Globe className="h-3 w-3" /> Website URL
                </span>
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline block truncate"
                >
                  {website}
                </a>
              </div>
            </div>
          </Card>

          <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl text-left backdrop-blur-md space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-border/40 pb-2 select-none flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              General Notes
            </h2>
            <p className="text-[11px] leading-relaxed text-slate-300">{notes}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
