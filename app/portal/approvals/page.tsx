'use client';

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckSquare,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Sparkles,
  Download,
  Send,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui';
import { toast } from 'sonner';

export default function PortalApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<any | null>(null);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApprovals = async () => {
    try {
      const res = await fetch('/api/portal/approvals');
      const body = await res.json();
      if (body.success) {
        setApprovals(body.data);
        if (body.data.length > 0) {
          // Keep current selection if refreshing
          const current = body.data.find((a: any) => a._id === selectedApproval?._id);
          setSelectedApproval(current || body.data[0]);
        }
      }
    } catch (err) {
      toast.error('Failed to load approvals cabinet.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleAction = async (action: 'approved' | 'revision_requested') => {
    if (!selectedApproval) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/portal/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedApproval._id,
          action,
          comments,
        }),
      });
      const body = await res.json();
      if (res.ok && body.success) {
        toast.success(
          `Action successfully recorded: ${action === 'approved' ? 'Approved' : 'Revision Requested'}`
        );
        setComments('');
        await fetchApprovals();
      } else {
        toast.error(body.message || 'Failed to submit review.');
      }
    } catch (error) {
      toast.error('Error sending request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const maps: Record<string, { label: string; class: string; icon: any }> = {
      pending: {
        label: 'Pending Review',
        class: 'bg-blue-500/10 text-blue-400 border-blue-500/15',
        icon: Clock,
      },
      approved: {
        label: 'Approved',
        class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15',
        icon: CheckCircle,
      },
      rejected: {
        label: 'Rejected',
        class: 'bg-rose-500/10 text-rose-400 border-rose-500/15',
        icon: XCircle,
      },
      revision_requested: {
        label: 'Revisions Requested',
        class: 'bg-amber-500/10 text-amber-400 border-amber-500/15',
        icon: Clock,
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
        <Icon className="w-3 h-3 mr-1" />
        {item.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl bg-slate-900" />
          ))}
        </div>
        <div className="lg:col-span-2">
          <Skeleton className="h-full rounded-2xl bg-slate-900" />
        </div>
      </div>
    );
  }

  if (approvals.length === 0) {
    return (
      <Card className="bg-slate-900/20 border-slate-850 p-12 rounded-3xl text-center">
        <EmptyState
          title="Approvals Cabinet Empty"
          description="Your active projects do not contain any pending or historical sign-off deliverables."
          icon={<CheckSquare className="w-12 h-12 text-slate-500" />}
        />
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* List cabinet column */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-white">Approvals Cabinet</h1>
          <p className="text-xs text-slate-500">Milestone reviews and deliverable sign-offs</p>
        </div>

        <div className="space-y-3">
          {approvals.map((req) => {
            const isSelected = selectedApproval?._id === req._id;
            return (
              <div
                key={req._id}
                className={`cursor-pointer transition-all duration-300 rounded-2xl border p-5 space-y-3 ${
                  isSelected
                    ? 'bg-slate-900 border-blue-500 shadow-lg shadow-blue-500/5'
                    : 'bg-slate-900/40 border-slate-850 hover:border-slate-800'
                }`}
                onClick={() => setSelectedApproval(req)}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[9px] uppercase font-bold tracking-wider bg-slate-850 text-slate-400 border border-slate-800 px-2 py-0.5 rounded">
                    {req.type}
                  </span>
                  {getStatusBadge(req.status)}
                </div>
                <h3 className="text-sm font-bold text-white truncate text-left">{req.title}</h3>
                {req.dueDate && (
                  <span className="text-[10px] text-slate-500 block text-left">
                    Due Date: {new Date(req.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Action Panel */}
      {selectedApproval && (
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900/40 border-slate-850 rounded-3xl p-6 lg:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 border-b border-slate-850 pb-6">
              <div className="space-y-1 text-left">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider bg-slate-850 border border-slate-800 px-2 py-0.5 rounded">
                    {selectedApproval.type}
                  </span>
                  {getStatusBadge(selectedApproval.status)}
                </div>
                <h2 className="text-2xl font-bold text-white pt-2">{selectedApproval.title}</h2>
              </div>
            </div>

            <div className="space-y-2 text-left">
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                Review Request Details
              </span>
              <p className="text-sm text-slate-300 leading-relaxed">
                {selectedApproval.description || 'No detailed instructions shared.'}
              </p>
            </div>

            {/* Expiring / Shared Files download simulation */}
            {selectedApproval.type === 'deliverable' && (
              <div className="flex items-center justify-between bg-slate-950/40 border border-slate-850 p-4 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                  <div className="text-left text-xs">
                    <span className="text-slate-400 font-medium">Staging & Production Assets</span>
                    <p className="text-[10px] text-slate-500">Expiring preview url</p>
                  </div>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs py-5 border-0">
                  <Download className="w-3.5 h-3.5 mr-2" />
                  Open Staging
                </Button>
              </div>
            )}

            {/* Interactive Comment History Pipeline */}
            <div className="space-y-4 border-t border-slate-850 pt-6 text-left">
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                Approval & Review History
              </span>

              {selectedApproval.history.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No review timeline available yet.</p>
              ) : (
                <div className="relative border-l border-slate-850 ml-3 pl-6 space-y-4 pt-2">
                  {selectedApproval.history.map((hist: any, index: number) => (
                    <div key={index} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[31px] top-1 w-3 h-3 rounded-full border border-slate-800 bg-slate-950" />
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="font-semibold text-white">{hist.userName}</span>
                          <span className="text-[10px] text-slate-500 bg-slate-850 px-2 py-0.5 rounded uppercase">
                            {hist.action.replace('_', ' ')}
                          </span>
                        </div>
                        {hist.comments && (
                          <p className="text-xs text-slate-400 italic bg-slate-950/20 p-3 rounded-xl border border-slate-900 mt-1">
                            &quot;{hist.comments}&quot;
                          </p>
                        )}
                        <span className="text-[9px] text-slate-650 block pt-0.5">
                          {new Date(hist.actedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Decision Action Box (Only available if status is pending) */}
            {selectedApproval.status === 'pending' && (
              <div className="space-y-4 border-t border-slate-850 pt-6">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider block text-left">
                  Submit your Review Decision
                </span>
                <Textarea
                  placeholder="Enter comments, design guidelines, or revision request specifics here..."
                  className="bg-slate-950/40 border-slate-800 text-white placeholder-slate-600 focus:border-blue-500 focus:ring-blue-500/25 rounded-2xl p-4"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  disabled={isSubmitting}
                />
                <div className="flex items-center justify-end space-x-4">
                  <Button
                    variant="outline"
                    className="border-slate-800 hover:bg-slate-850 text-slate-300 rounded-xl py-5 px-6"
                    onClick={() => handleAction('revision_requested')}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-2 text-rose-500" />
                        Request Revisions
                      </>
                    )}
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-5 px-6 border-0 shadow-lg shadow-blue-600/10"
                    onClick={() => handleAction('approved')}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve & Sign Off
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
