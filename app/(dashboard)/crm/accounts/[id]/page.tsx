'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader, Card, CardContent, Button, Input, LoadingSpinner } from '@/components/ui';
import {
  Building2,
  Globe,
  DollarSign,
  Heart,
  TrendingUp,
  ArrowLeft,
  Edit2,
  Users,
  Calendar,
  FileText,
  Clock,
  History,
  CheckCircle,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

interface Contact {
  _id: string;
  name: string;
  role: string;
  email: string;
}

interface Meeting {
  _id: string;
  title: string;
  dueDate: string;
  isCompleted: boolean;
}

interface Document {
  _id: string;
  name: string;
  category: string;
  createdAt: string;
}

export default function AccountDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // States
  const [name, setName] = useState('Acme Corp');
  const [clientType, setClientType] = useState('Enterprise');
  const [industry, setIndustry] = useState('SaaS');
  const [website, setWebsite] = useState('https://acme.com');
  const [companySize, setCompanySize] = useState('201+');
  const [revenueContribution, setRevenueContribution] = useState(125000);
  const [healthScore, setHealthScore] = useState(90);
  const [onboardingStatus, setOnboardingStatus] = useState('in-progress');
  const [accountManager, setAccountManager] = useState('Jane Doe');
  const [address, setAddress] = useState('123 Silicon Tower, SF CA');

  const [contacts, setContacts] = useState<Contact[]>([
    { _id: 'co1', name: 'John Carter', role: 'CTO', email: 'carter@acme.com' },
    { _id: 'co2', name: 'Alice Smith', role: 'Product Manager', email: 'alice@acme.com' },
  ]);

  const [meetings, setMeetings] = useState<Meeting[]>([
    {
      _id: 'm1',
      title: 'Onboarding Alignment Call',
      dueDate: 'Tomorrow at 10 AM',
      isCompleted: false,
    },
    { _id: 'm2', title: 'Technical Scoping Meeting', dueDate: 'May 20, 2026', isCompleted: true },
  ]);

  const [documents, setDocuments] = useState<Document[]>([
    {
      _id: 'd1',
      name: 'Master Services Agreement.pdf',
      category: 'contract',
      createdAt: 'May 10, 2026',
    },
    {
      _id: 'd2',
      name: 'Technical Architecture Proposal.pdf',
      category: 'proposal',
      createdAt: 'Yesterday',
    },
  ]);

  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState<string[]>([
    'Looking to double their engineering team size and upgrade to SyncGrid Premium Enterprise.',
    'Exhibited very positive feedback during initial technical alignment call.',
  ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const fetchAccountDetails = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/protected/clients/${params.id}`);
        const d = await res.json();
        if (d.success && d.data) {
          const a = d.data;
          setName(a.name);
          setClientType(a.clientType);
          setIndustry(a.industry);
          setWebsite(a.website || 'No website');
          setCompanySize(a.companySize);
          setRevenueContribution(a.revenueContribution);
          setHealthScore(a.healthScore);
          setOnboardingStatus(a.onboardingStatus);
          setAccountManager(a.accountManager);
          setAddress(a.address || 'No address');

          if (a.contacts && a.contacts.length > 0) setContacts(a.contacts);
        }
      } catch (err) {
        toast.error('Failed to sync details from server. Rendering fallback data sandbox.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAccountDetails();
  }, [params.id]);

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    setNotes([noteText, ...notes]);
    setNoteText('');
    toast.success('Note logged to account feed.');
  };

  const handleToggleMeeting = (id: string) => {
    setMeetings(meetings.map((m) => (m._id === id ? { ...m, isCompleted: !m.isCompleted } : m)));
    toast.success('Meeting status updated successfully.');
  };

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground animate-pulse font-bold tracking-wider uppercase">
          Synthesizing corporate account telemetry...
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
        <Link href={`/crm/accounts/${params.id}/edit`}>
          <Button variant="default" size="sm" className="h-8 text-xs gap-1">
            <Edit2 className="h-3.5 w-3.5" />
            Edit Corporate Details
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
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-white">{name}</h1>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider ${
                    onboardingStatus === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                  }`}
                >
                  {onboardingStatus}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-slate-500" />
                {clientType} • {industry} Sector • {companySize} scale
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold select-none">
            <div className="text-right">
              <span className="text-[9px] font-bold text-slate-500 uppercase block leading-none">
                Annual Value Contribution
              </span>
              <span className="text-emerald-400 text-lg font-black font-mono block mt-0.5">
                ${revenueContribution?.toLocaleString()}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[9px] font-bold text-slate-500 uppercase block leading-none">
                Account Manager
              </span>
              <span className="text-white block mt-0.5">{accountManager}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Grid content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Sub-grid of Stakeholders */}
          <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl text-left backdrop-blur-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 select-none">
                <Users className="h-4 w-4 text-slate-400" />
                Stakeholder directory ({contacts.length})
              </h2>
              <Link href="/crm/contacts/create">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] uppercase font-bold tracking-wider gap-1"
                >
                  <Plus className="h-3 w-3" /> Add Contact
                </Button>
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {contacts.map((c) => (
                <div
                  key={c._id}
                  className="bg-background/20 p-3.5 rounded-xl border border-border/40 text-xs flex justify-between items-start"
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-sm">{c.name}</h4>
                    <span className="inline-flex bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[8px] font-bold">
                      {c.role}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">{c.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Calendar Meetings Schedule */}
          <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl text-left backdrop-blur-md">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2 select-none">
              <Calendar className="h-4 w-4 text-slate-400" />
              Calendar Meetings schedule
            </h2>

            <div className="space-y-3">
              {meetings.map((m) => (
                <div
                  key={m._id}
                  className="bg-background/20 p-3.5 rounded-xl border border-border/40 text-xs flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <h4
                      className={`font-bold ${m.isCompleted ? 'text-slate-500 line-through' : 'text-white'}`}
                    >
                      {m.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {m.dueDate}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={m.isCompleted}
                    onChange={() => handleToggleMeeting(m._id)}
                    className="rounded border-border/60 text-primary h-4.5 w-4.5 focus:ring-0 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Documents Folder */}
          <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl text-left backdrop-blur-md">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2 select-none">
              <FileText className="h-4 w-4 text-slate-400" />
              Shared Enterprise Documents folder
            </h2>

            <div className="space-y-3">
              {documents.map((d) => (
                <div
                  key={d._id}
                  className="bg-background/20 p-3.5 rounded-xl border border-border/40 text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <h4 className="font-bold text-white">{d.name}</h4>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">
                        {d.category}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">{d.createdAt}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar Health and Notes Panel */}
        <div className="space-y-6">
          <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl text-left backdrop-blur-md space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-border/40 pb-2 select-none">
              Onboarding & Health index
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300">Satisfaction Score</span>
                  <span className="font-bold text-slate-200">{healthScore}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden select-none">
                  <div
                    style={{ width: `${healthScore}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                  />
                </div>
              </div>

              <div className="bg-background/20 p-3.5 rounded-xl border border-border/40 text-xs space-y-1 select-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Account Owner Address
                </span>
                <span className="text-slate-200 block">{address}</span>
                <span className="text-[9px] font-bold text-slate-500 block uppercase mt-1">
                  Website URL
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

          {/* Quick Notes feed */}
          <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl text-left backdrop-blur-md space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-border/40 pb-2 select-none">
              Account notes log
            </h2>

            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Record corporate insight..."
                  className="bg-background/40 h-8 text-xs"
                />
                <Button onClick={handleAddNote} variant="default" size="sm" className="h-8 text-xs">
                  Log
                </Button>
              </div>

              <div className="space-y-2.5 pt-1">
                {notes.map((n, i) => (
                  <p
                    key={i}
                    className="bg-background/20 p-3 rounded-xl border border-border/40 text-[11px] leading-relaxed text-slate-300"
                  >
                    {n}
                  </p>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
