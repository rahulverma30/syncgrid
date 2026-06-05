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
  CalendarDays,
  MoreVertical,
  Link as LinkIcon,
  FolderOpen,
  Download,
  File,
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
          <Card className="bg-card/40 border border-border/60 p-0 rounded-2xl text-left backdrop-blur-md overflow-hidden">
            <div className="p-5 border-b border-border/60 bg-gradient-to-r from-card/60 to-transparent">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2 select-none">
                <CalendarDays className="h-4 w-4 text-blue-400" />
                Meeting Schedule
              </h2>
              <div className="flex gap-2">
                <Input
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="Meeting Title"
                  className="bg-background/60 h-8 text-xs flex-1 border-border/50 focus:border-blue-500/50"
                />
                <Input
                  type="datetime-local"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="bg-background/60 h-8 text-xs w-44 border-border/50 focus:border-blue-500/50 text-slate-300 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                />
                <Button
                  onClick={handleAddMeeting}
                  size="sm"
                  className="h-8 text-xs px-3 bg-blue-600 hover:bg-blue-500 text-white"
                >
                  Schedule
                </Button>
              </div>
            </div>

            <div className="p-5">
              {meetings.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs italic">
                  No meetings scheduled.
                </div>
              ) : (
                <div className="relative border-l border-border/60 ml-3 space-y-6">
                  {meetings.map((m) => {
                    const isPast = new Date(m.dueDate) < new Date() && !m.isCompleted;
                    return (
                      <div key={m._id} className="relative pl-6">
                        <div
                          className={`absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-card ${
                            m.isCompleted
                              ? 'bg-emerald-500'
                              : isPast
                                ? 'bg-rose-500'
                                : 'bg-blue-500'
                          }`}
                        />
                        <div className="bg-background/20 hover:bg-background/40 transition-colors p-3.5 rounded-xl border border-border/40 text-xs flex items-center justify-between group">
                          <div className="space-y-1">
                            <h4
                              className={`font-bold text-sm ${m.isCompleted ? 'text-slate-500 line-through' : 'text-white'}`}
                            >
                              {m.title}
                            </h4>
                            <span
                              className={`text-[10px] flex items-center gap-1.5 ${isPast && !m.isCompleted ? 'text-rose-400' : 'text-slate-400'}`}
                            >
                              <Clock className="h-3 w-3" />
                              {m.dueDate ? new Date(m.dueDate).toLocaleString() : 'No date'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleToggleMeeting(m._id)}
                            className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors border ${
                              m.isCompleted
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                                : 'bg-background border-border hover:border-primary hover:text-primary text-slate-400'
                            }`}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* Documents Folder */}
          <Card className="bg-card/40 border border-border/60 p-0 rounded-2xl text-left backdrop-blur-md overflow-hidden">
            <div className="p-5 border-b border-border/60 bg-gradient-to-r from-card/60 to-transparent">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2 select-none">
                <FolderOpen className="h-4 w-4 text-purple-400" />
                Enterprise Vault
              </h2>
              <div className="flex gap-2">
                <Input
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="Upload document (e.g. Contract.pdf)"
                  className="bg-background/60 h-8 text-xs flex-1 border-border/50 focus:border-purple-500/50"
                />
                <select
                  value={docCat}
                  onChange={(e) => setDocCat(e.target.value)}
                  className="bg-background/60 border border-border/50 focus:border-purple-500/50 rounded-md h-8 text-xs w-32 px-2 text-slate-300"
                >
                  <option value="contract">Contract</option>
                  <option value="proposal">Proposal</option>
                  <option value="NDA">NDA</option>
                </select>
                <Button
                  onClick={handleAddDoc}
                  size="sm"
                  className="h-8 text-xs px-3 bg-purple-600 hover:bg-purple-500 text-white border-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="p-5">
              {documents.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs italic">
                  Vault is empty.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {documents.map((d) => (
                    <div
                      key={d._id}
                      className="bg-background/20 hover:bg-background/40 transition-all p-3 rounded-xl border border-border/40 text-xs flex items-start gap-3 group"
                    >
                      <div className="h-10 w-10 shrink-0 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <File className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white text-sm truncate">{d.name}</h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded">
                            {d.category}
                          </span>
                          <span className="text-[9px] text-slate-400">{d.createdAt}</span>
                        </div>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-white transition-opacity bg-background/50 rounded-md border border-border/50">
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
