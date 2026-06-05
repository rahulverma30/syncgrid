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

interface Note {
  content: string;
  createdByName: string;
  createdAt: string;
}

export default function AccountDetailsPage() {
  const params = useParams();
  const accountId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : '';
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

  const [contacts, setContacts] = useState<Contact[]>([]);

  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const [documents, setDocuments] = useState<Document[]>([]);

  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);

  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');

  const [docName, setDocName] = useState('');
  const [docCat, setDocCat] = useState('contract');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (!accountId) return;
    const fetchAccountDetails = async () => {
      setIsLoading(true);
      try {
        const [res, contactsRes] = await Promise.all([
          fetch(`/api/protected/clients/${accountId}`),
          fetch(`/api/protected/crm/contacts?accountId=${accountId}`),
        ]);
        const d = await res.json();
        const cd = await contactsRes.json();

        const extraContacts =
          cd.success && cd.data
            ? cd.data.map((c: any) => ({
                _id: c._id,
                name: `${c.firstName} ${c.lastName}`,
                role: c.title || 'Stakeholder',
                email: c.email || '',
              }))
            : [];

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

          const mergedContacts = [...(a.contacts || []), ...extraContacts];
          setContacts(mergedContacts);

          setMeetings(a.meetings || []);
          setDocuments(a.documents || []);

          const formattedNotes = (a.notes || [])
            .map((n: any) => ({
              content: n.content || n,
              createdByName: n.createdByName || 'System',
              createdAt: new Date(n.createdAt || Date.now()).toLocaleDateString(),
            }))
            .reverse();
          setNotes(formattedNotes);
        }
      } catch (err) {
        toast.error('Failed to sync details from server. Rendering fallback data sandbox.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAccountDetails();
  }, [accountId]);

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      const res = await fetch(`/api/protected/clients/${accountId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteText, isPinned: false, isPrivate: false }),
      });
      const d = await res.json();
      if (d.success) {
        setNotes([
          { content: noteText, createdByName: 'Current User', createdAt: 'Just now' },
          ...notes,
        ]);
        setNoteText('');
        toast.success('Note logged to account feed.');
      } else {
        toast.error(d.message || 'Failed to log note');
      }
    } catch (e) {
      toast.error('Network error.');
    }
  };

  const handleToggleMeeting = (id: string) => {
    setMeetings(meetings.map((m) => (m._id === id ? { ...m, isCompleted: !m.isCompleted } : m)));
    toast.success('Meeting status updated successfully.');
  };

  const handleAddMeeting = async () => {
    if (!meetingTitle.trim() || !meetingDate) return;
    try {
      const res = await fetch(`/api/protected/clients/${accountId}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: meetingTitle, dueDate: meetingDate }),
      });
      const d = await res.json();
      if (d.success) {
        setMeetings([
          ...meetings,
          {
            _id: Date.now().toString(),
            title: meetingTitle,
            dueDate: meetingDate,
            isCompleted: false,
          },
        ]);
        setMeetingTitle('');
        setMeetingDate('');
        toast.success('Meeting scheduled.');
      } else {
        toast.error(d.message);
      }
    } catch {
      toast.error('Error scheduling meeting.');
    }
  };

  const handleAddDoc = async () => {
    if (!docName.trim()) return;
    const finalName = docName.includes('.') ? docName : `${docName}.pdf`;
    try {
      const res = await fetch(`/api/protected/clients/${accountId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: finalName,
          category: docCat,
          url: `https://syncgrid-vault.s3.amazonaws.com/clients/${accountId}/${finalName}`,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setDocuments([
          ...documents,
          { _id: Date.now().toString(), name: finalName, category: docCat, createdAt: 'Just now' },
        ]);
        setDocName('');
        toast.success('Document uploaded.');
      } else {
        toast.error(d.message);
      }
    } catch {
      toast.error('Error uploading document.');
    }
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
        <Link href={`/crm/accounts/${accountId}/edit`}>
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

            <div className="flex gap-2 mb-4">
              <Input
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="Meeting Title"
                className="bg-background/40 h-8 text-xs flex-1"
              />
              <Input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="bg-background/40 h-8 text-xs w-32"
              />
              <Button onClick={handleAddMeeting} size="sm" className="h-8 text-xs px-3">
                <Plus className="h-3 w-3" />
              </Button>
            </div>

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

            <div className="flex gap-2 mb-4">
              <Input
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="Filename (e.g. contract.pdf)"
                className="bg-background/40 h-8 text-xs flex-1"
              />
              <select
                value={docCat}
                onChange={(e) => setDocCat(e.target.value)}
                className="bg-background/40 border border-input rounded-md h-8 text-xs w-28 px-2 text-foreground"
              >
                <option value="contract">Contract</option>
                <option value="proposal">Proposal</option>
                <option value="NDA">NDA</option>
              </select>
              <Button onClick={handleAddDoc} size="sm" className="h-8 text-xs px-3">
                <Plus className="h-3 w-3" />
              </Button>
            </div>

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
                  <div
                    key={i}
                    className="bg-background/20 p-3 rounded-xl border border-border/40 text-[11px] leading-relaxed text-slate-300 space-y-1"
                  >
                    <p>{n.content}</p>
                    <span className="text-[9px] text-slate-500 block">
                      {n.createdAt} • logged by {n.createdByName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
