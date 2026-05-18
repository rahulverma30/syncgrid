'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart2,
  Clock,
  ThumbsUp,
  HelpCircle,
  DollarSign,
  TrendingUp,
  Percent,
  TrendingDown,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function PortalAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/portal/analytics');
        const body = await res.json();
        if (body.success) {
          setStats(body.data);
        }
      } catch (err) {
        toast.error('Failed to load metrics insights.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-96 rounded-xl bg-slate-900" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl bg-slate-900" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl bg-slate-900" />
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left">
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <BarChart2 className="w-5 h-5 text-blue-500" />
          <span>Analytics & Engagement Insights</span>
        </h1>
        <p className="text-xs text-slate-500">
          Track milestones turnaround times, SLAs, and billing reports
        </p>
      </div>

      {/* Analytics main grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Turnaround speed */}
        <Card className="bg-slate-900/40 border-slate-850 p-6 rounded-2xl relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                Approval Turnaround
              </span>
              <p className="text-3xl font-extrabold text-white">
                {stats?.approvals?.averageTurnaroundHours || 0}h
              </p>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                Optimal response speed
              </span>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/15">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Deliverables approved */}
        <Card className="bg-slate-900/40 border-slate-850 p-6 rounded-2xl relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                Signoff rate
              </span>
              <p className="text-3xl font-extrabold text-white">
                {stats?.approvals?.completed || 0}
              </p>
              <span className="text-[10px] text-slate-400 font-semibold">
                Completed milestone reviews
              </span>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/15">
              <ThumbsUp className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* SLA rate */}
        <Card className="bg-slate-900/40 border-slate-850 p-6 rounded-2xl relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                Helpdesk Resolution
              </span>
              <p className="text-3xl font-extrabold text-white">
                {stats?.support?.resolutionRate || 100}%
              </p>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center">
                <Percent className="w-3 h-3 mr-0.5" />
                SLA commitments achieved
              </span>
            </div>
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl border border-purple-500/15">
              <HelpCircle className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Total contract value */}
        <Card className="bg-slate-900/40 border-slate-850 p-6 rounded-2xl relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                Shared billing
              </span>
              <p className="text-3xl font-extrabold text-white">
                ${stats?.finance?.totalAmount ? stats.finance.totalAmount.toLocaleString() : '0'}
              </p>
              <span className="text-[10px] text-slate-500 font-semibold">
                Across shared invoicing files
              </span>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/15">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Finance Table & ticket statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ticket statistics table */}
        <Card className="bg-slate-900/40 border-slate-850 p-6 rounded-3xl space-y-4">
          <div className="border-b border-slate-850 pb-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Helpdesk Ticket Metrics
            </span>
            <p className="text-[10px] text-slate-500">Summary of support interactions filed</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs p-3 bg-slate-950/40 rounded-xl border border-slate-900">
              <span className="text-slate-400">Total Support Requests Raised:</span>
              <span className="font-semibold text-white">{stats?.support?.total || 0} Tickets</span>
            </div>
            <div className="flex justify-between items-center text-xs p-3 bg-slate-950/40 rounded-xl border border-slate-900">
              <span className="text-slate-400">Active Unresolved Cases:</span>
              <span className="font-semibold text-blue-400">{stats?.support?.open || 0} Open</span>
            </div>
            <div className="flex justify-between items-center text-xs p-3 bg-slate-950/40 rounded-xl border border-slate-900">
              <span className="text-slate-400">Successfully Solved:</span>
              <span className="font-semibold text-emerald-400">
                {stats?.support?.resolved || 0} Resolved
              </span>
            </div>
          </div>
        </Card>

        {/* Outstanding finance breakdown */}
        <Card className="bg-slate-900/40 border-slate-850 p-6 rounded-3xl space-y-4">
          <div className="border-b border-slate-850 pb-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Shared Billing Summary
            </span>
            <p className="text-[10px] text-slate-500">Outstanding invoice distributions</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs p-3 bg-slate-950/40 rounded-xl border border-slate-900">
              <span className="text-slate-400">Total Invoiced Amount:</span>
              <span className="font-semibold text-white">
                ${stats?.finance?.totalAmount ? stats.finance.totalAmount.toLocaleString() : '0'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs p-3 bg-slate-950/40 rounded-xl border border-slate-900">
              <span className="text-slate-400">Settled and Paid:</span>
              <span className="font-semibold text-emerald-400">
                ${stats?.finance?.paidAmount ? stats.finance.paidAmount.toLocaleString() : '0'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs p-3 bg-slate-950/40 rounded-xl border border-slate-900">
              <span className="text-slate-400">Outstanding Balance Due:</span>
              <span className="font-semibold text-rose-400">
                $
                {stats?.finance?.outstandingAmount
                  ? stats.finance.outstandingAmount.toLocaleString()
                  : '0'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
