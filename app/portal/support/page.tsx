'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HelpCircle,
  Plus,
  Send,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ListFilter,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui';
import { toast } from 'sonner';

export default function PortalSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<
    'billing' | 'technical' | 'bug' | 'feature-request' | 'general'
  >('general');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/portal/support');
      const body = await res.json();
      if (body.success) {
        setTickets(body.data);
      }
    } catch (err) {
      toast.error('Failed to load tickets history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Please complete all form fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/portal/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, priority, description }),
      });
      const body = await res.json();
      if (res.ok && body.success) {
        toast.success('Support Ticket submitted successfully!');
        setTitle('');
        setDescription('');
        setCategory('general');
        setPriority('medium');
        fetchTickets();
      } else {
        toast.error(body.message || 'Failed to submit support ticket.');
      }
    } catch (error) {
      toast.error('Network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadge = (p: string) => {
    const maps: Record<string, string> = {
      low: 'bg-slate-500/10 text-slate-400 border-slate-500/15',
      medium: 'bg-blue-500/10 text-blue-400 border-blue-500/15',
      high: 'bg-amber-500/10 text-amber-400 border-amber-500/15',
      urgent: 'bg-rose-500/10 text-rose-400 border-rose-500/15 animate-pulse',
    };
    return (
      <span
        className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${maps[p] || ''}`}
      >
        {p}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const maps: Record<string, { label: string; class: string; icon: any }> = {
      open: {
        label: 'Open',
        class: 'bg-blue-500/10 text-blue-400 border-blue-500/15',
        icon: Clock,
      },
      'in-progress': {
        label: 'Investigating',
        class: 'bg-amber-500/10 text-amber-400 border-amber-500/15',
        icon: Clock,
      },
      resolved: {
        label: 'Resolved',
        class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15',
        icon: CheckCircle2,
      },
      closed: {
        label: 'Closed',
        class: 'bg-slate-500/10 text-slate-400 border-slate-500/15',
        icon: CheckCircle2,
      },
    };
    const item = maps[status] || {
      label: status,
      class: 'bg-slate-500/10 text-slate-400 border-slate-500/15',
      icon: Clock,
    };
    const Icon = item.icon;
    return (
      <span
        className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border ${item.class}`}
      >
        <Icon className="w-2.5 h-2.5 mr-1" />
        {item.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-4">
          <Skeleton className="h-[400px] rounded-2xl bg-slate-900" />
        </div>
        <div className="lg:col-span-2">
          <Skeleton className="h-full rounded-2xl bg-slate-900" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Ticket filing form column */}
      <div className="space-y-4 text-left">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-blue-500" />
            <span>Helpdesk Support</span>
          </h1>
          <p className="text-xs text-slate-500">
            File tickets, technical issues, and request updates
          </p>
        </div>

        <Card className="bg-slate-900/40 border-slate-850 p-6 rounded-2xl">
          <form onSubmit={handleSubmitTicket} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Ticket Title
              </label>
              <Input
                placeholder="e.g. Broken links on staging checkout..."
                className="bg-slate-950/40 border-slate-850 text-white placeholder-slate-600 focus:border-blue-500 focus:ring-blue-500/25 rounded-xl"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Category
                </label>
                <select
                  className="w-full bg-slate-950 border border-slate-850 text-slate-200 text-xs rounded-xl p-3 focus:border-blue-500 focus:ring-blue-500/25 cursor-pointer outline-none"
                  value={category}
                  onChange={(e: any) => setCategory(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="general">General Help</option>
                  <option value="billing">Billing issue</option>
                  <option value="technical">Technical Support</option>
                  <option value="bug">Report a Bug</option>
                  <option value="feature-request">Feature Request</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Priority
                </label>
                <select
                  className="w-full bg-slate-950 border border-slate-850 text-slate-200 text-xs rounded-xl p-3 focus:border-blue-500 focus:ring-blue-500/25 cursor-pointer outline-none"
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Detailed Description
              </label>
              <Textarea
                placeholder="Provide steps to reproduce or details here..."
                className="bg-slate-950/40 border-slate-850 text-white placeholder-slate-600 focus:border-blue-500 focus:ring-blue-500/25 rounded-xl p-4 h-28 min-h-28"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs py-5 rounded-xl border-0 shadow-lg shadow-blue-600/10"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Request
                  <Plus className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>

      {/* Ticket history dashboard */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center text-left">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <ListFilter className="w-5 h-5 text-blue-500" />
              <span>Ticket History Panel</span>
            </h2>
            <p className="text-xs text-slate-500">Track priorities and SLA response metrics</p>
          </div>
        </div>

        {tickets.length === 0 ? (
          <Card className="bg-slate-900/20 border-slate-850 p-12 rounded-3xl text-center">
            <EmptyState
              title="No Tickets Found"
              description="You have a clean history slate! No helpdesk tickets have been filed yet."
              icon={<HelpCircle className="w-12 h-12 text-slate-500" />}
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Card
                key={ticket._id}
                className="bg-slate-900/40 border-slate-850 p-6 rounded-2xl hover:border-slate-800 transition-colors text-left space-y-4"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0 pb-3 border-b border-slate-850/60">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-[9px] uppercase font-bold tracking-wider bg-slate-850 text-slate-400 border border-slate-800 px-2 py-0.5 rounded">
                        {ticket.category}
                      </span>
                      {getPriorityBadge(ticket.priority)}
                    </div>
                    <h3 className="text-md font-bold text-white pt-1">{ticket.title}</h3>
                  </div>

                  <div className="flex items-center space-x-3">{getStatusBadge(ticket.status)}</div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{ticket.description}</p>

                <div className="flex flex-wrap items-center justify-between gap-4 text-[10px] text-slate-500 pt-1">
                  <div className="flex items-center space-x-4">
                    <span>
                      Assignee:{' '}
                      <span className="font-semibold text-slate-300">{ticket.assigneeName}</span>
                    </span>
                    {ticket.resolvedAt && (
                      <span>
                        Resolved:{' '}
                        <span className="font-semibold text-emerald-400">
                          {new Date(ticket.resolvedAt).toLocaleDateString()}
                        </span>
                      </span>
                    )}
                  </div>

                  {ticket.slaDeadline && !ticket.resolvedAt && (
                    <span className="flex items-center space-x-1 text-slate-500">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span>SLA Commitment: {new Date(ticket.slaDeadline).toLocaleString()}</span>
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
