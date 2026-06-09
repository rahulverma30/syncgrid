'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader, Card, CardContent, Button, Input, LoadingSpinner } from '@/components/ui';
import {
  Users,
  Mail,
  Phone,
  Building2,
  Tag,
  ArrowLeft,
  Edit2,
  Clock,
  History,
  CheckSquare,
  MessageSquare,
  Video,
  Send,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { getClientError, getNetworkError, SUCCESS_MESSAGES } from '@/lib/errors';
import { useSession } from 'next-auth/react';

interface Note {
  _id: string;
  content: string;
  createdAt: string;
  createdByName?: string;
}

export default function ContactDetailsPage() {
  const params = useParams();
  const contactId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : '';
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const userName = session?.user?.name || 'You';

  const [isLoading, setIsLoading] = useState(true);

  // States
  const [name, setName] = useState('John Carter');
  const [role, setRole] = useState('Chief Technology Officer');
  const [email, setEmail] = useState('carter@acme.com');
  const [phone, setPhone] = useState('415-555-0190');
  const [companyName, setCompanyName] = useState('Acme Corp');
  const [isPrimary, setIsPrimary] = useState(true);
  const [communicationPref, setCommunicationPref] = useState('slack');

  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (!contactId) return;
    const fetchContactDetails = async () => {
      setIsLoading(true);
      try {
        let res = await fetch(`/api/protected/crm/contacts/${contactId}?t=${Date.now()}`);
        let d = await res.json();

        let foundContact = null;
        let companyNameStr = 'Unknown Company';

        if (d.success && d.data) {
          foundContact = d.data;
          companyNameStr = foundContact.accountId?.name || 'Unknown Account';
        } else {
          // If not found in CRM contacts, check Client embedded contacts
          const clientsRes = await fetch(`/api/protected/clients?t=${Date.now()}`);
          const clientsData = await clientsRes.json();
          if (clientsData.success) {
            for (const client of clientsData.data) {
              const c = client.contacts?.find((ct: any) => ct._id === contactId);
              if (c) {
                foundContact = c;
                companyNameStr = client.name;
                break;
              }
            }
          }
        }

        if (foundContact) {
          setName(
            foundContact.name ||
              `${foundContact.firstName || ''} ${foundContact.lastName || ''}`.trim()
          );
          setRole(foundContact.role || foundContact.title || 'Executive');
          setEmail(foundContact.email || 'No email');
          setPhone(foundContact.phone || 'No phone');
          setCompanyName(companyNameStr);
          setIsPrimary(!!foundContact.isPrimary);
          setCommunicationPref(foundContact.communicationPref || 'email');

          if (foundContact.notes && Array.isArray(foundContact.notes)) {
            setNotes(
              foundContact.notes
                .map((n: any) => ({
                  _id: n._id,
                  content: n.content,
                  createdAt: new Date(n.createdAt).toLocaleDateString(),
                  createdByName: n.createdByName || 'CRM Agent',
                }))
                .reverse()
            );
          }
        } else {
          toast.error('Contact not found.');
        }
      } catch (err) {
        toast.error('Failed to sync stakeholder profile details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchContactDetails();
  }, [contactId]);

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      const res = await fetch(`/api/protected/crm/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newNote: noteText }),
      });
      const d = await res.json();
      if (d.success) {
        setNotes([
          {
            _id: Date.now().toString(),
            content: noteText,
            createdAt: 'Just now',
            createdByName: userName,
          },
          ...notes,
        ]);
        setNoteText('');
        toast.success('Note attached to profile.');
      } else {
        toast.error(getClientError(d).title, { description: getClientError(d).description });
      }
    } catch {
      toast.error('Network error.');
    }
  };

  // Removed JS-based handler in favor of native anchor tags

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground animate-pulse font-bold tracking-wider uppercase">
          Synthesizing stakeholder relationship logs...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 select-none">
        <Link href="/crm/contacts">
          <Button variant="outline" size="sm" className="h-8 hover:bg-accent/40 text-xs gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Directory
          </Button>
        </Link>
        <Link href={`/crm/contacts/${contactId}/edit`}>
          <Button variant="default" size="sm" className="h-8 text-xs gap-1">
            <Edit2 className="h-3.5 w-3.5" />
            Edit Profile
          </Button>
        </Link>
      </div>

      {/* Profile Header Widget */}
      <Card className="bg-gradient-to-r from-slate-900/40 to-slate-950/40 border border-border/60 p-6 rounded-2xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 text-2xl font-black font-mono shadow-inner select-none">
              {name.charAt(0)}
            </div>
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-white">{name}</h1>
                {isPrimary && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                    Primary
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-slate-500" />
                {role} at{' '}
                <span className="font-bold text-primary hover:underline cursor-pointer">
                  {companyName}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 select-none">
            <a
              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${email}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1 hover:bg-accent/40"
              >
                <Mail className="h-3.5 w-3.5" />
                Email
              </Button>
            </a>
            <a href={`tel:${phone}`}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1 hover:bg-accent/40"
              >
                <Phone className="h-3.5 w-3.5 text-blue-400" />
                Phone Call
              </Button>
            </a>
          </div>
        </div>
      </Card>

      {/* Main Details and Logs layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Notes Log */}
          <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl text-left backdrop-blur-md">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <History className="h-4 w-4 text-slate-400" />
              Stakeholder Notes ledger
            </h2>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Log profile detail or communication summary..."
                  className="bg-background/40 h-9 text-xs"
                />
                <Button onClick={handleAddNote} variant="default" size="sm" className="h-9 text-xs">
                  Log Note
                </Button>
              </div>

              <div className="space-y-3 pt-2">
                {notes.map((n) => (
                  <div
                    key={n._id}
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

          {/* Removed Activity Stream */}
        </div>

        {/* Sidebar Info Panel */}
        <div className="space-y-6">
          <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl text-left backdrop-blur-md space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-border/40 pb-2">
              Stakeholder Context
            </h2>

            <div className="space-y-3.5 text-xs select-none">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase block leading-none">
                  Email Address
                </span>
                <span className="font-medium text-slate-200 block truncate">{email}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase block leading-none">
                  Phone Number
                </span>
                <span className="font-medium text-slate-200 block">{phone}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase block leading-none">
                  Corporate Company
                </span>
                <span className="font-bold text-primary block flex items-center gap-1.5 mt-0.5">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  {companyName}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase block leading-none">
                  Communication Preference
                </span>
                <span className="font-bold uppercase tracking-wider text-[10px] text-purple-400 block">
                  {communicationPref} channel
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
