'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Briefcase,
  CheckSquare,
  HelpCircle,
  DollarSign,
  ArrowUpRight,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui';
import { usePortalTheme } from '@/hooks/use-portal-theme';
import { toast } from 'sonner';

export default function PortalOverviewPage() {
  const { theme } = usePortalTheme();
  const [stats, setStats] = useState<any>(null);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [analyticsRes, approvalsRes] = await Promise.all([
        fetch('/api/portal/analytics'),
        fetch('/api/portal/approvals'),
      ]);

      const analyticsData = await analyticsRes.json();
      const approvalsData = await approvalsRes.json();

      if (analyticsData.success) {
        setStats(analyticsData.data);
      }

      if (approvalsData.success) {
        // Only keep the pending items for the quick dashboard list
        const pending = approvalsData.data.filter((a: any) => a.status === 'pending');
        setPendingApprovals(pending);
      }
    } catch (error) {
      console.error('Error loading overview data:', error);
      toast.error('Failed to load dashboard statistics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprovalAction = async (
    requestId: string,
    action: 'approved' | 'revision_requested',
    comments = 'Approved from quick dashboard'
  ) => {
    try {
      const res = await fetch('/api/portal/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action, comments }),
      });
      const body = await res.json();
      if (res.ok && body.success) {
        toast.success(
          `Item successfully ${action === 'approved' ? 'approved' : 'returned for revisions'}!`
        );
        // Refresh local items
        loadData();
      } else {
        toast.error(body.message || 'Failed to complete review action.');
      }
    } catch (error) {
      toast.error('Network error executing approval action.');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  } as const;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-44 w-full rounded-2xl bg-slate-900" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl bg-slate-900" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-96 lg:col-span-2 rounded-2xl bg-slate-900" />
          <Skeleton className="h-96 rounded-2xl bg-slate-900" />
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
      {/* Premium Welcome Hero Card */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl border border-slate-800 bg-radial from-slate-900 via-slate-900 to-slate-950 p-8 lg:p-10 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center space-y-6 md:space-y-0"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="space-y-3 max-w-2xl z-10">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Client Workspace</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white">
            {theme.welcomeTitle}
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">{theme.welcomeSubtitle}</p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-900/80 border border-slate-800 backdrop-blur-md p-4 rounded-2xl shadow-inner z-10 self-stretch md:self-auto justify-center">
          <Calendar className="w-5 h-5 text-blue-500" />
          <div className="text-left">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              Current Session Date
            </p>
            <p className="text-sm font-semibold text-white">
              {new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Grid of Key Metrics */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {/* Active Projects */}
        <Card className="bg-slate-900/40 border-slate-850 hover:border-slate-750 transition-all duration-300 rounded-2xl relative group overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                  Active Projects
                </span>
                <p className="text-3xl font-extrabold text-white">{stats?.projects?.total || 0}</p>
                <div className="inline-flex items-center text-[11px] text-emerald-400 font-semibold bg-emerald-500/5 px-2 py-0.5 rounded-md">
                  <span>Health: {stats?.projects?.averageHealth || 100}%</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/15 group-hover:scale-110 transition-transform">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Pending */}
        <Card className="bg-slate-900/40 border-slate-850 hover:border-slate-750 transition-all duration-300 rounded-2xl relative group overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                  Pending Reviews
                </span>
                <p className="text-3xl font-extrabold text-white">
                  {stats?.approvals?.pending || 0}
                </p>
                <span className="text-[11px] text-slate-500 font-medium">
                  Require your decision
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/15 group-hover:scale-110 transition-transform">
                <CheckSquare className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Tickets */}
        <Card className="bg-slate-900/40 border-slate-850 hover:border-slate-750 transition-all duration-300 rounded-2xl relative group overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                  Open Tickets
                </span>
                <p className="text-3xl font-extrabold text-white">{stats?.support?.open || 0}</p>
                <div className="inline-flex items-center text-[11px] text-blue-400 font-semibold bg-blue-500/5 px-2 py-0.5 rounded-md">
                  <span>Resolved: {stats?.support?.resolutionRate || 100}%</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/15 group-hover:scale-110 transition-transform">
                <HelpCircle className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Outstanding Billing */}
        <Card className="bg-slate-900/40 border-slate-850 hover:border-slate-750 transition-all duration-300 rounded-2xl relative group overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                  Outstanding Balance
                </span>
                <p className="text-3xl font-extrabold text-white">
                  $
                  {stats?.finance?.outstandingAmount
                    ? stats.finance.outstandingAmount.toLocaleString()
                    : '0'}
                </p>
                <span className="text-[11px] text-emerald-400 font-semibold">
                  Paid: $
                  {stats?.finance?.paidAmount ? stats.finance.paidAmount.toLocaleString() : '0'}
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/15 group-hover:scale-110 transition-transform">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Grid: Approvals Pipeline & Side widgets */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Approvals Dashboard Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-blue-500" />
                <span>Quick Approvals Hub</span>
              </h2>
              <p className="text-xs text-slate-500">
                Sign off on deliverables, staging links, and milestone deliverables
              </p>
            </div>
            <Link href="/portal/approvals">
              <Button variant="ghost" className="text-xs text-blue-400 hover:text-blue-300">
                View All Approvals
                <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          {pendingApprovals.length === 0 ? (
            <Card className="bg-slate-900/20 border-slate-850 p-8 rounded-2xl text-center">
              <EmptyState
                title="All Caught Up!"
                description="There are no pending deliverables or approvals requiring your feedback."
                icon={<ThumbsUp className="w-12 h-12 text-slate-500" />}
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((req) => (
                <Card
                  key={req._id}
                  className="bg-slate-900/40 border-slate-850 p-6 rounded-2xl hover:border-slate-800 transition-colors"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/15">
                          {req.type}
                        </span>
                        {req.dueDate && (
                          <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                            <AlertCircle className="w-3 h-3 text-amber-500" />
                            <span>Due: {new Date(req.dueDate).toLocaleDateString()}</span>
                          </span>
                        )}
                      </div>
                      <h3 className="text-md font-bold text-white">{req.title}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {req.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 w-full md:w-auto">
                      <Button
                        variant="outline"
                        className="flex-1 md:flex-none border-slate-800 hover:bg-slate-850 text-slate-300 text-xs rounded-xl"
                        onClick={() => handleApprovalAction(req._id, 'revision_requested')}
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-2 text-amber-500" />
                        Needs Revisions
                      </Button>
                      <Button
                        className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-xl border-0 shadow-lg shadow-blue-600/10"
                        onClick={() => handleApprovalAction(req._id, 'approved')}
                      >
                        <ThumbsUp className="w-3.5 h-3.5 mr-2" />
                        Approve & Sign Off
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Side Widget: Support Ticket Status & Help */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-purple-500" />
              <span>Workspace Helpdesk</span>
            </h2>
            <p className="text-xs text-slate-500">Need support? Open a ticket or contact PMs</p>
          </div>

          <Card className="bg-slate-900/40 border-slate-850 rounded-2xl p-6 space-y-4">
            <div className="space-y-2 text-center pb-4 border-b border-slate-850">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Average Turnaround Time
              </span>
              <p className="text-3xl font-extrabold text-white">2.4 Hours</p>
              <p className="text-[11px] text-slate-400">
                Our dedicated team is reviewing requests round the clock
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">SLA Resolution Rate:</span>
                <span className="text-emerald-400 font-semibold">98.2%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Active Account Manager:</span>
                <span className="text-slate-200 font-medium">Pepper Potts</span>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/portal/support">
                <Button className="w-full bg-slate-800 hover:bg-slate-750 text-white text-xs rounded-xl border-0">
                  Open Support Ticket
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  );
}
