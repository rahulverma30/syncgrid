'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader, Card, CardContent, Button, Input, LoadingSpinner } from '@/components/ui';
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

  // Form states
  const [name, setName] = useState('John Carter');
  const [role, setRole] = useState('Chief Technology Officer');
  const [email, setEmail] = useState('carter@acme.com');
  const [phone, setPhone] = useState('415-555-0190');
  const [companyId, setCompanyId] = useState('acme123');
  const [isPrimary, setIsPrimary] = useState(true);
  const [communicationPref, setCommunicationPref] = useState('slack');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (!contactId) return;
    const fetchContact = async () => {
      setIsLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (contactId === 'c2') {
          setName('Samantha Vance');
          setRole('VP Marketing');
          setEmail('vance@globex.co');
          setPhone('650-555-0143');
          setIsPrimary(true);
          setCommunicationPref('slack');
        } else if (contactId === 'c3') {
          setName('Albert Wesker');
          setRole('Head of Operations');
          setEmail('wesker@umbrella.com');
          setPhone('312-555-0105');
          setIsPrimary(false);
          setCommunicationPref('zoom');
        } else if (contactId === 'c4') {
          setName('Pepper Potts');
          setRole('CEO');
          setEmail('potts@stark.com');
          setPhone('212-555-0177');
          setIsPrimary(true);
          setCommunicationPref('phone');
        }
      } catch (err) {
        toast.error('Failed to load contact for editing.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchContact();
  }, [contactId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error('Name and Email are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success(`Contact details for "${name}" updated successfully.`);
      router.push(`/crm/contacts/${contactId}`);
    } catch (err) {
      toast.error('Failed to save updates.');
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
                  Prefer Channel
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <select
                    value={communicationPref}
                    onChange={(e) => setCommunicationPref(e.target.value)}
                    className="w-full pl-10 pr-4 bg-background/30 border border-border/60 hover:border-primary/20 rounded-xl h-10 text-xs text-slate-300 focus:ring-0 outline-none cursor-pointer"
                  >
                    <option value="email" className="bg-slate-950">
                      Email Only
                    </option>
                    <option value="phone" className="bg-slate-950">
                      Phone Call
                    </option>
                    <option value="slack" className="bg-slate-950">
                      Corporate Slack
                    </option>
                    <option value="zoom" className="bg-slate-950">
                      Zoom Meeting
                    </option>
                  </select>
                </div>
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

            <div className="flex items-center gap-3 bg-background/20 p-4 rounded-xl border border-border/40 select-none mt-2">
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
