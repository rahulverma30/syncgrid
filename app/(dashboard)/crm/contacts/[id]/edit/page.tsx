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
  Users,
  Building2,
  Mail,
  Phone,
  Tag,
  MessageSquare,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function EditContactPage() {
  const router = useRouter();
  const params = useParams();
  const contactId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : '';
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [communicationPref, setCommunicationPref] = useState('email');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (!contactId) return;
    const fetchContact = async () => {
      setIsLoading(true);
      try {
        let res = await fetch(`/api/protected/crm/contacts/${contactId}`);
        let d = await res.json();

        let foundContact = null;
        let companyIdStr = '';

        const clientsRes = await fetch('/api/protected/clients');
        const clientsData = await clientsRes.json();
        if (clientsData.success) {
          setCompanies(clientsData.data.map((c: any) => ({ _id: c._id, name: c.name })));
        }
        setIsLoadingCompanies(false);

        if (d.success && d.data) {
          foundContact = d.data;
          companyIdStr = foundContact.accountId?._id || foundContact.companyId;
        } else if (clientsData.success) {
          for (const client of clientsData.data) {
            const c = client.contacts?.find((ct: any) => ct._id === contactId);
            if (c) {
              foundContact = c;
              companyIdStr = client._id;
              break;
            }
          }
        }

        if (foundContact) {
          setName(
            foundContact.name ||
              `${foundContact.firstName || ''} ${foundContact.lastName || ''}`.trim()
          );
          setRole(foundContact.role || foundContact.title || '');
          setEmail(foundContact.email || '');
          setPhone(foundContact.phone || '');
          setCompanyId(companyIdStr);
          setIsPrimary(!!foundContact.isPrimary);
          setCommunicationPref(foundContact.communicationPref || 'email');
        } else {
          toast.error('Contact not found.');
          router.push('/crm/contacts');
        }
      } catch (err) {
        toast.error('Failed to load contact for editing.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchContact();
  }, [contactId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error('Name and Email are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const parts = name.split(' ');
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ') || ' ';

      const res = await fetch(`/api/protected/crm/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          role,
          email,
          phone,
          accountId: companyId,
          isPrimary,
          communicationPref,
        }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success(`Contact details for "${name}" updated successfully.`);
        router.push(`/crm/contacts/${contactId}`);
      } else {
        toast.error(d.message || 'Failed to save updates.');
      }
    } catch (err) {
      toast.error('Network error during save.');
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
          Synthesizing contact data form...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 select-none">
        <Link href={`/crm/contacts/${contactId}`}>
          <Button variant="outline" size="sm" className="h-8 hover:bg-accent/40 text-xs gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Profile
          </Button>
        </Link>
      </div>

      <PageHeader
        eyebrow="Relationship Intelligence"
        title="Edit Stakeholder Profile"
        description="Update positioning, communication details, or active channel preferences for this user."
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
                    <span className="text-[10px] text-slate-500">Loading accounts...</span>
                  </div>
                ) : (
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Select
                      value={companyId}
                      onChange={(val) => setCompanyId(val)}
                      className="w-full pl-10 pr-4 bg-background/30 border border-border/60 hover:border-primary/20 rounded-xl h-10 text-xs text-slate-300 focus:ring-0 outline-none cursor-pointer"
                      options={[
                        { value: '', label: 'Select Corporate Account...' },
                        ...companies.map((c) => ({ value: c._id, label: c.name })),
                      ]}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 bg-background/20 p-4 rounded-xl border border-border/40 select-none mt-2 mb-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      ]}
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-center space-y-1 mt-4 sm:mt-0 pt-2 sm:pt-4 sm:pl-4">
                  <div className="flex items-center gap-3">
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/20 mt-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-[65%] h-4 w-4 text-slate-500" />
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
                    <Phone className="absolute left-3 top-1/2 -translate-y-[65%] h-4 w-4 text-slate-500" />
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
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/40 select-none">
              <Link href={`/crm/contacts/${contactId}`}>
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
