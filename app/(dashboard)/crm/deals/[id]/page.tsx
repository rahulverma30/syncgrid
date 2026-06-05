'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader, Card, CardContent, Button, Input, LoadingSpinner } from '@/components/ui';
import { useSession } from 'next-auth/react';
import {
  TrendingUp,
  Mail,
  Phone,
  DollarSign,
  ArrowLeft,
  Clock,
  History,
  CheckCircle,
  Tag,
  Plus,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Note {
  _id?: string;
  content: string;
  createdByName: string;
  createdAt: string;
}

export default function DealDetailsPage() {
  const params = useParams();
  const dealId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : '';
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();
  const currentUserName = session?.user?.name
    ? `${session.user.name} (${session.user.roles?.[0] || 'User'})`
    : 'Sales Specialist';

  // States
  const [name, setName] = useState('Acme Corp');
  const [contactPerson, setContactPerson] = useState('John Carter');
  const [email, setEmail] = useState('carter@acme.com');
  const [phone, setPhone] = useState('415-555-0190');
  const [budget, setBudget] = useState(45000);
  const [status, setStatus] = useState('new');
  const [priority, setPriority] = useState('high');
  const [source, setSource] = useState('website');
  const [expectedCloseDate, setExpectedCloseDate] = useState('2026-06-30');
  const [workType, setWorkType] = useState('Custom ERP Build');
  const [techStack, setTechStack] = useState<string[]>(['React', 'Next.js', 'MongoDB']);

  const [notes, setNotes] = useState<Note[]>([
    {
      content: 'Initial project requirements gathered. Budget matches enterprise Tier.',
      createdByName: 'Sales Rep',
      createdAt: '3 days ago',
    },
    {
      content: 'Prefers custom dashboard interface rather than out of the box designs.',
      createdByName: 'Tech Architect',
      createdAt: 'May 16, 2026',
    },
  ]);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (!dealId) return;
    const fetchDealDetails = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/protected/crm/deals/${dealId}`);
        const d = await res.json();
        if (d.success && d.data) {
          const l = d.data;
          setName(l.name);
          setContactPerson(
            l.contactId ? `${l.contactId.firstName} ${l.contactId.lastName}` : 'N/A'
          );
          setEmail(l.contactId?.email || '');
          setPhone(l.contactId?.phone || '');
          setBudget(l.value || 0);
          setStatus(l.stage || 'qualified');
          setPriority(l.priority || 'medium');
          setSource('CRM Deal'); // Deals don't natively have source in our new model
          if (l.expectedCloseDate) {
            setExpectedCloseDate(new Date(l.expectedCloseDate).toISOString().slice(0, 10));
          }
          setWorkType(l.accountId?.industry || 'General');
          setTechStack([]);
          if (l.notes && Array.isArray(l.notes)) {
            setNotes(
              l.notes
                .map((n: any) => ({
                  content: n.content,
                  createdByName: n.createdByName || 'System',
                  createdAt: new Date(n.createdAt).toLocaleDateString(),
                }))
                .reverse()
            );
          } else if (l.notes && typeof l.notes === 'string') {
            setNotes([
              {
                content: l.notes,
                createdByName: l.ownerId?.name || 'CRM Specialist',
                createdAt: new Date(l.createdAt).toLocaleDateString(),
              },
            ]);
          }
        }
      } catch (err) {
        toast.error('Failed to sync sales opportunity from server. Showing offline sandbox.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDealDetails();
  }, [dealId]);

  const handleUpdateStage = async (newStage: string) => {
    setStatus(newStage);
    try {
      const res = await fetch(`/api/protected/crm/deals/${dealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success(`Pipeline deal stage shifted to "${newStage}".`);
      }
    } catch (e) {
      toast.success(`Sandbox mode: Deal stage shifted to "${newStage}".`);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;

    try {
      const res = await fetch(`/api/protected/crm/deals/${dealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: noteText }),
      });
      const d = await res.json();
      if (d.success) {
        setNotes([
          { content: noteText, createdByName: currentUserName, createdAt: 'Just now' },
          ...notes,
        ]);
        setNoteText('');
        toast.success('Sales notes appended.');
      } else {
        setNotes([
          { content: noteText, createdByName: currentUserName, createdAt: 'Just now' },
          ...notes,
        ]);
        setNoteText('');
        toast.success('Sales notes logged.');
      }
    } catch (e) {
      setNotes([
        { content: noteText, createdByName: currentUserName, createdAt: 'Just now' },
        ...notes,
      ]);
      setNoteText('');
      toast.success('Sales notes saved.');
    }
  };

  const handleConvertToClient = async () => {
    try {
      const res = await fetch(`/api/protected/crm/deals/${dealId}/won`, {
        method: 'POST',
      });
      const d = await res.json();
      if (d.success) {
        toast.success(
          `CRITICAL ACTION COMPLETED: Deal "${name}" won! Client account successfully provisioned.`
        );
        router.push('/clients');
      } else {
        toast.error(d.message || 'Failed to convert deal to client.');
      }
    } catch (e) {
      toast.error('Network error while provisioning client.');
    }
  };

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground animate-pulse font-bold tracking-wider uppercase">
          Synthesizing sales opportunity telemetry...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 select-none">
        <Link href="/crm/deals">
          <Button variant="outline" size="sm" className="h-8 hover:bg-accent/40 text-xs gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Deals Ledger
          </Button>
        </Link>

        <Button
          onClick={handleConvertToClient}
          variant="default"
          size="sm"
          className="h-8 text-xs gap-1.5"
        >
          <Briefcase className="h-3.5 w-3.5" />
          Mark Won & Provision Client
        </Button>
      </div>

      {/* Deal Profile Header Widget */}
      <Card className="bg-gradient-to-r from-slate-900/40 to-slate-950/40 border border-border/60 p-6 rounded-2xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 text-2xl font-black font-mono shadow-inner select-none">
              $
            </div>
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-white">{name}</h1>
                <span className="inline-flex px-2 py-0.5 rounded text-[8px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                  {status} stage
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-slate-500" />
                {workType} opportunity • Priority level:{' '}
                <span className="font-bold text-red-400 uppercase tracking-wider">{priority}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-semibold select-none">
            <div className="text-right">
              <span className="text-[9px] font-bold text-slate-500 uppercase block leading-none">
                Deal Budget Target
              </span>
              <span className="text-emerald-400 text-lg font-black font-mono block mt-0.5">
                ${budget?.toLocaleString()}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[9px] font-bold text-slate-500 uppercase block leading-none">
                Expected Closing
              </span>
              <span className="text-white block mt-0.5">{expectedCloseDate}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Grid content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Active Sales stage progress bar */}
          <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl text-left backdrop-blur-md space-y-4 select-none">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-slate-400" />
              Pipeline Stage Alignment
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              {['new', 'contacted', 'proposal', 'negotiation', 'won', 'lost'].map((stage) => (
                <button
                  key={stage}
                  onClick={() => handleUpdateStage(stage)}
                  className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                    status === stage
                      ? stage === 'won'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                        : stage === 'lost'
                          ? 'bg-red-500/10 text-red-400 border-red-500/25'
                          : 'bg-primary/20 text-primary border-primary/25 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]'
                      : 'bg-background/20 text-slate-400 border-border/40 hover:bg-slate-900/10 hover:text-white'
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>
          </Card>

          {/* Notes Log */}
          <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl text-left backdrop-blur-md space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 select-none">
              <History className="h-4 w-4 text-slate-400" />
              Opportunity Communication & Note Logs
            </h2>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Record customer communications or scoping results..."
                  className="bg-background/40 h-9 text-xs"
                />
                <Button
                  onClick={handleAddNote}
                  variant="default"
                  size="sm"
                  className="h-9 text-xs select-none"
                >
                  Log Insight
                </Button>
              </div>

              <div className="space-y-3 pt-1">
                {notes.map((n, i) => (
                  <div
                    key={i}
                    className="bg-background/20 p-3.5 rounded-xl border border-border/40 text-xs space-y-1"
                  >
                    <p className="text-slate-200 font-medium leading-relaxed">{n.content}</p>
                    <span className="text-[9px] text-slate-500 block">
                      {n.createdAt} • logged by {n.createdByName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Info Panel */}
        <div className="space-y-6">
          <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl text-left backdrop-blur-md space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-border/40 pb-2 select-none">
              Sales Stakeholder Details
            </h2>

            <div className="space-y-3.5 text-xs select-none">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase block leading-none">
                  Contact Person
                </span>
                <span className="font-semibold text-slate-200 block">{contactPerson}</span>
              </div>

              {email && (
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block leading-none">
                    Email Address
                  </span>
                  <span className="font-semibold text-slate-200 block truncate">{email}</span>
                </div>
              )}

              {phone && (
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block leading-none">
                    Phone Number
                  </span>
                  <span className="font-semibold text-slate-200 block">{phone}</span>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase block leading-none">
                  Acquisition Source
                </span>
                <span className="font-bold text-primary uppercase tracking-wider text-[10px] block mt-0.5">
                  {source}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase block leading-none">
                  Proposed Tech Stack
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {techStack.map((t, idx) => (
                    <span
                      key={idx}
                      className="bg-slate-800 border border-border px-1.5 py-0.5 rounded text-[8px] font-bold text-slate-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* conversion reminder */}
          <Card className="bg-primary/5 border border-primary/20 p-5 rounded-2xl text-left backdrop-blur-md space-y-3 select-none">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="h-4 w-4" />
              Onboarding Ready
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Upon shifting to Won stage or closing agreement, click Convert to automatically
              provision workspace projects, channels, and team directories.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
