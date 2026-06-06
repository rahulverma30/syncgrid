/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  Target,
  ShieldAlert,
  Clock,
  Zap,
  Filter,
  X,
  CheckCircle2,
  Play,
  AlertCircle,
  Sparkles,
  Bot,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/cn';
import Link from 'next/link';

function ProductivityChart({ data }: { data: { date: string; completed: number }[] }) {
  if (!data || data.length === 0)
    return (
      <div className="w-full h-40 flex items-center justify-center border border-dashed border-border/40 rounded-xl bg-muted/5">
        <span className="text-xs text-muted-foreground font-medium">
          No completion history available yet.
        </span>
      </div>
    );

  const maxVal = Math.max(1, ...data.map((d) => d.completed));

  return (
    <div className="w-full h-40 flex items-end gap-[4px]">
      {data.map((d, i) => {
        const heightPct = maxVal > 0 ? (d.completed / maxVal) * 100 : 0;
        return (
          <div
            key={i}
            className="bg-primary/80 hover:bg-primary transition-all rounded-t-sm flex-1 min-w-[4px] cursor-crosshair group relative"
            style={{ height: `${Math.max(2, heightPct)}%` }}
          >
            <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-bold px-3 py-2 rounded-md shadow-xl pointer-events-none whitespace-nowrap z-10 transition-opacity flex flex-col items-center">
              <span>{d.completed} completed</span>
              <span className="text-[9px] text-black font-normal">
                {new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TaskDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [filterProjectId, setFilterProjectId] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // UI State
  const [activeAttentionTab, setActiveAttentionTab] = useState<
    'overdue' | 'overEstimate' | 'blocked' | 'unassigned' | 'dueToday' | null
  >(null);

  const fetchDashboardData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterProjectId) params.set('projectId', filterProjectId);
    if (filterUserId) params.set('userId', filterUserId);
    if (filterDateFrom) params.set('dateFrom', filterDateFrom);
    if (filterDateTo) params.set('dateTo', filterDateTo);

    fetch(`/api/protected/tasks/dashboard${params.toString() ? `?${params.toString()}` : ''}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setData(result.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch('/api/protected/projects')
      .then((r) => r.json())
      .then((r) => {
        if (r.success) setProjects(r.data);
      });
    fetch('/api/protected/team/members')
      .then((r) => r.json())
      .then((r) => {
        if (r.success) setUsers(r.data);
      });
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [filterProjectId, filterUserId, filterDateFrom, filterDateTo]);

  const clearFilters = () => {
    setFilterProjectId('');
    setFilterUserId('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Zap className="w-8 h-8 animate-pulse text-primary" />
          <span className="text-xs uppercase tracking-widest font-bold">
            Booting Operations Command Center...
          </span>
        </div>
      </div>
    );
  }

  const {
    operationsHealth,
    dailyBriefing,
    kpis,
    attentionRequired,
    teamWorkload,
    projectHealth,
    timePerformance,
    activeWorkStream,
    automationInsights,
    actionableInsights,
    momentumTrend,
  } = data;

  const renderTrend = (val: number, label: string) => {
    if (val === 0)
      return (
        <span className="text-[10px] text-muted-foreground leading-none tracking-wide">Stable</span>
      );
    const isUp = val > 0;
    return (
      <span
        className={cn(
          'flex items-center gap-1 text-[10px] font-bold leading-none tracking-wide',
          isUp ? 'text-rose-500' : 'text-emerald-500'
        )}
      >
        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {Math.abs(val)} {label}
      </span>
    );
  };

  const renderPositiveTrend = (val: number, label: string) => {
    if (val === 0)
      return (
        <span className="text-[10px] text-muted-foreground leading-none tracking-wide">Stable</span>
      );
    const isUp = val > 0;
    return (
      <span
        className={cn(
          'flex items-center gap-1 text-[10px] font-bold leading-none tracking-wide',
          isUp ? 'text-emerald-500' : 'text-rose-500'
        )}
      >
        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {Math.abs(val)} {label}
      </span>
    );
  };

  return (
    <div className="space-y-12 pb-24">
      {/* SECTION 1: Operations Health Score (Top Level) */}
      <div
        className={cn(
          'rounded-2xl p-6 md:p-10 flex flex-col md:flex-row items-center justify-between border shadow-sm transition-colors',
          operationsHealth.score >= 90
            ? 'bg-emerald-500/5 border-emerald-500/20'
            : operationsHealth.score >= 75
              ? 'bg-primary/5 border-primary/20'
              : operationsHealth.score >= 60
                ? 'bg-amber-500/5 border-amber-500/20'
                : 'bg-rose-500/5 border-rose-500/20'
        )}
      >
        <div className="space-y-4 text-center md:text-left mb-6 md:mb-0 w-full">
          <div className="flex items-center gap-6 justify-center md:justify-start">
            <div className="text-right border-r border-border/30 pr-6">
              <span
                className={cn(
                  'text-6xl font-mono font-bold leading-none tracking-tighter block',
                  operationsHealth.score >= 90
                    ? 'text-emerald-500'
                    : operationsHealth.score >= 75
                      ? 'text-primary'
                      : operationsHealth.score >= 60
                        ? 'text-amber-500'
                        : 'text-rose-500'
                )}
              >
                {operationsHealth.score}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-foreground mt-2 block">
                {operationsHealth.status}
              </span>
            </div>
            <div>
              <h1 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4" /> Operations Health
              </h1>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {[
                  { label: 'Project Health', val: operationsHealth.breakdown.projectHealth },
                  { label: 'Task Delivery', val: operationsHealth.breakdown.taskDelivery },
                  { label: 'Capacity', val: operationsHealth.breakdown.capacity },
                  { label: 'Automation', val: operationsHealth.breakdown.automation },
                  { label: 'Time Perf', val: operationsHealth.breakdown.timePerformance },
                ].map((metric, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {metric.label}:
                    </span>
                    <span
                      className={cn(
                        'text-xs font-mono font-bold',
                        metric.val < 80 ? 'text-rose-500' : 'text-foreground'
                      )}
                    >
                      {metric.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1.5: Today's Operations Summary (Daily Briefing) */}
      <div className="bg-muted/10 border-y border-border/20 py-4 -mx-6 px-6 lg:-mx-10 lg:px-10 flex flex-wrap gap-x-8 gap-y-4 items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2 shrink-0">
          <CheckCircle2 className="w-3 h-3" /> Today&apos;s Operations Summary
        </span>
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <span className="text-[11px] font-mono text-muted-foreground">
            <span className="font-bold text-foreground">{dailyBriefing.tasksCompletedToday}</span>{' '}
            tasks completed
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            <span
              className={cn(
                'font-bold',
                dailyBriefing.overdueCount > 0 ? 'text-rose-500' : 'text-foreground'
              )}
            >
              {dailyBriefing.overdueCount}
            </span>{' '}
            overdue tasks
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            <span className="font-bold text-foreground">{dailyBriefing.hoursLoggedToday}h</span>{' '}
            logged today
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            <span className="font-bold text-foreground">{dailyBriefing.activeEmployees}</span>{' '}
            employees active
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            <span
              className={cn(
                'font-bold',
                dailyBriefing.criticalBlockers > 0 ? 'text-rose-500' : 'text-foreground'
              )}
            >
              {dailyBriefing.criticalBlockers}
            </span>{' '}
            critical blockers
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            <span
              className={cn(
                'font-bold',
                dailyBriefing.projectsAtRisk > 0 ? 'text-amber-500' : 'text-foreground'
              )}
            >
              {dailyBriefing.projectsAtRisk}
            </span>{' '}
            projects at risk
          </span>
        </div>
      </div>

      {/* SECTION 2: Actionable Insights Engine */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 px-1">
          <Sparkles className="w-3 h-3" /> Actionable Insights
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {actionableInsights.map((insight: any, idx: number) => (
            <div
              key={idx}
              className="bg-background border border-border/40 hover:border-foreground/30 transition-colors rounded-xl p-5 text-sm font-medium text-foreground flex flex-col justify-between gap-4 shadow-sm relative overflow-hidden group"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="leading-relaxed">{insight.message}</span>
              </div>
              {insight.actionHref && (
                <Link
                  href={insight.actionHref}
                  className="self-start mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider hover:bg-primary/20 transition-colors group-hover:translate-x-1 duration-200"
                >
                  {insight.actionLabel} <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: Filters */}
      <div className="flex flex-col gap-4 bg-muted/5 p-2 rounded-xl border border-border/10">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3 w-full max-w-2xl">
            <Select
              value={filterProjectId}
              onChange={setFilterProjectId}
              placeholder="All Projects"
              options={[
                { value: '', label: 'All Projects' },
                ...projects.map((p) => ({ value: p._id, label: p.name })),
              ]}
            />
            <Select
              value={filterUserId}
              onChange={setFilterUserId}
              placeholder="All Members"
              options={[
                { value: '', label: 'All Members' },
                ...users.map((u) => ({ value: u._id, label: u.name })),
              ]}
            />
            {(filterProjectId || filterUserId || filterDateFrom || filterDateTo) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-[10px] font-bold text-foreground transition whitespace-nowrap"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 hover:text-foreground transition bg-background px-3 py-1.5 rounded-md border border-border/20 shadow-sm"
          >
            Advanced Filters{' '}
            {showAdvancedFilters ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        </div>
        {showAdvancedFilters && (
          <div className="bg-background border border-border/20 rounded-lg p-5 flex gap-6 animate-in slide-in-from-top-2 shadow-sm mt-2 mx-2 mb-2">
            <div className="flex items-center gap-3 relative">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Due From:
              </span>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="h-9 rounded-md border border-border/30 bg-input px-3 text-xs text-foreground outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center gap-3 relative">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Due To:
              </span>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="h-9 rounded-md border border-border/30 bg-input px-3 text-xs text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 5: Needs Attention Center */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
          Needs Attention
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              id: 'overdue',
              label: 'Overdue Tasks',
              desc: 'Missed deadline',
              count: attentionRequired.overdue.length,
              color: 'bg-rose-500',
              tColor: 'text-rose-500',
              emptyText: 'Excellent. No overdue work.',
            },
            {
              id: 'blocked',
              label: 'Blocked Tasks',
              desc: 'Dependency issue',
              count: attentionRequired.blocked.length,
              color: 'bg-purple-500',
              tColor: 'text-purple-500',
              emptyText: 'All workflows are moving.',
            },
            {
              id: 'overEstimate',
              label: 'Over Estimate',
              desc: 'Budget overrun',
              count: attentionRequired.overEstimate.length,
              color: 'bg-amber-500',
              tColor: 'text-amber-500',
              emptyText: 'All tasks within budget.',
            },
            {
              id: 'unassigned',
              label: 'Unassigned',
              desc: 'No owner',
              count: attentionRequired.unassigned.length,
              color: 'bg-zinc-500',
              tColor: 'text-zinc-500',
              emptyText: 'All tasks assigned.',
            },
            {
              id: 'dueToday',
              label: 'Due Today',
              desc: 'Needs completion',
              count: attentionRequired.dueToday.length,
              color: 'bg-primary',
              tColor: 'text-primary',
              emptyText: 'No pressing deadlines today.',
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setActiveAttentionTab(activeAttentionTab === tab.id ? null : (tab.id as any))
              }
              className={cn(
                'p-5 rounded-2xl border text-left transition-all flex flex-col relative overflow-hidden',
                activeAttentionTab === tab.id
                  ? 'bg-muted border-foreground/30 shadow-md scale-[1.02]'
                  : 'bg-background border-border/20 hover:border-border/60 hover:shadow-sm'
              )}
            >
              <div className={cn('absolute top-0 left-0 w-full h-1', tab.color)} />
              <span
                className={cn('text-[11px] font-bold uppercase tracking-wider mb-3', tab.tColor)}
              >
                {tab.label}
              </span>
              <span className="text-5xl font-mono font-bold text-foreground mb-2">{tab.count}</span>
              <span className="text-[10px] text-muted-foreground">{tab.desc}</span>
            </button>
          ))}
        </div>

        {activeAttentionTab && (
          <div className="bg-muted/20 border border-border/30 rounded-xl p-6 animate-in fade-in slide-in-from-top-2 duration-200 shadow-inner">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                <Filter className="w-4 h-4" /> Exploring: {activeAttentionTab}
              </span>
              <button
                onClick={() => setActiveAttentionTab(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {attentionRequired[activeAttentionTab].length === 0 ? (
              <div className="py-8 flex items-center justify-center border border-dashed border-border/30 rounded-lg">
                <p className="text-sm font-medium text-emerald-500 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {
                    [
                      { id: 'overdue', emptyText: 'Excellent. No overdue work.' },
                      { id: 'blocked', emptyText: 'All workflows are moving seamlessly.' },
                      {
                        id: 'overEstimate',
                        emptyText: 'All active tasks are currently within budget.',
                      },
                      { id: 'unassigned', emptyText: 'Every task is actively owned.' },
                      { id: 'dueToday', emptyText: 'No pressing deadlines remain for today.' },
                    ].find((x) => x.id === activeAttentionTab)?.emptyText
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {attentionRequired[activeAttentionTab].map((t: any) => (
                  <Link
                    href={`/tasks/${t._id}`}
                    key={t._id}
                    className="bg-background border border-border/20 p-5 rounded-xl text-sm space-y-4 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all shadow-sm block"
                  >
                    <div className="font-bold text-foreground line-clamp-2 leading-relaxed">
                      {t.title}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border/10">
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                        {t.code}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5">
                        <Users className="w-3 h-3" /> {t.assignees?.length || 0}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 6: Project Health Command Center */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
          Project Health Command Center
        </h3>
        <div className="bg-background border border-border/20 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-muted/10 border-b border-border/20 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <th className="px-6 py-5 font-bold">Project Name</th>
                  <th className="px-6 py-5 font-bold text-right w-48">Progress</th>
                  <th className="px-6 py-5 font-bold text-right">Tasks (C/R)</th>
                  <th className="px-6 py-5 font-bold text-right">Hours (Log/Est)</th>
                  <th className="px-6 py-5 font-bold text-right">Health Score</th>
                  <th className="px-6 py-5 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {projectHealth.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-sm font-medium text-muted-foreground italic"
                    >
                      No active projects currently available.
                    </td>
                  </tr>
                ) : (
                  projectHealth.map((ph: any) => (
                    <tr key={ph.project._id} className="hover:bg-muted/5 transition-colors group">
                      <td className="px-6 py-5">
                        <span className="text-sm font-bold text-foreground block mb-1.5 group-hover:text-primary transition-colors cursor-pointer">
                          {ph.project.name}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                          {ph.project.code}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${ph.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono font-bold w-10 text-right">
                            {ph.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right text-xs font-mono">
                        <span className="text-foreground">{ph.completedTasks}</span> /{' '}
                        <span className="text-muted-foreground">{ph.remainingTasks}</span>
                      </td>
                      <td className="px-6 py-5 text-right text-xs font-mono">
                        <span
                          className={cn(
                            ph.loggedHours > ph.estimatedHours
                              ? 'text-rose-500 font-bold'
                              : 'text-foreground'
                          )}
                        >
                          {Math.round(ph.loggedHours)}h
                        </span>{' '}
                        /{' '}
                        <span className="text-muted-foreground">
                          {Math.round(ph.estimatedHours)}h
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right relative">
                        <span
                          className={cn(
                            'text-base font-mono font-bold block',
                            ph.healthScore < 60
                              ? 'text-rose-500'
                              : ph.healthScore < 80
                                ? 'text-amber-500'
                                : 'text-foreground'
                          )}
                        >
                          {ph.healthScore}{' '}
                          <span className="text-[10px] text-muted-foreground font-sans font-normal">
                            / 100
                          </span>
                        </span>
                        <div className="absolute top-1/2 -translate-y-1/2 right-full mr-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-48 bg-foreground text-background p-3 rounded-lg shadow-xl text-left text-[10px] font-medium">
                          <span className="block font-bold mb-2 border-b border-background/20 pb-1">
                            Health Factors
                          </span>
                          <ul className="list-disc pl-3 space-y-1">
                            {ph.explanations.map((ex: string, i: number) => (
                              <li key={i}>{ex}</li>
                            ))}
                          </ul>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider',
                            ph.health.includes('Green') || ph.health.includes('Healthy')
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : ph.health.includes('Yellow') ||
                                  ph.health.includes('Attention') ||
                                  ph.health.includes('Risk')
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse'
                          )}
                        >
                          {ph.health}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 7 & 8: Team Capacity & Time Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Team Capacity Center */}
        <div className="xl:col-span-2 space-y-4">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
            Team Capacity
          </h3>
          <div className="bg-background border border-border/20 rounded-2xl overflow-hidden shadow-sm h-[calc(100%-32px)]">
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-muted/10 border-b border-border/20 text-[10px] uppercase tracking-widest text-muted-foreground sticky top-0 backdrop-blur-md">
                    <th className="px-6 py-4 font-bold">Team Member</th>
                    <th className="px-6 py-4 font-bold text-right">Active Tasks</th>
                    <th className="px-6 py-4 font-bold text-right">Overdue</th>
                    <th className="px-6 py-4 font-bold text-right">Logged (Wk)</th>
                    <th className="px-6 py-4 font-bold w-40">Capacity %</th>
                    <th className="px-6 py-4 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {teamWorkload.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-sm font-medium text-muted-foreground italic border-dashed border-border/40 m-4 rounded-xl"
                      >
                        No team members are actively tracking work.
                      </td>
                    </tr>
                  ) : (
                    teamWorkload.map((w: any) => (
                      <tr
                        key={w.user._id}
                        className="hover:bg-muted/5 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0 border border-border/50">
                            {w.user.name.charAt(0)}
                          </div>
                          <span className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                            {w.user.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-[11px] font-mono">
                          {w.inProgressTasks} / {w.assignedTasks}
                        </td>
                        <td className="px-6 py-4 text-right text-[11px] font-mono font-bold text-rose-500">
                          {w.overdueTasks > 0 ? w.overdueTasks : '-'}
                        </td>
                        <td className="px-6 py-4 text-right text-[11px] font-mono">
                          {Math.round(w.actualHours)}h
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full transition-all',
                                w.capacityPct > 100
                                  ? 'bg-rose-500'
                                  : w.capacityPct > 80
                                    ? 'bg-amber-500'
                                    : w.capacityPct > 0
                                      ? 'bg-emerald-500'
                                      : 'bg-zinc-500'
                              )}
                              style={{ width: `${Math.min(100, w.capacityPct)}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            <span
                              className={cn(
                                'text-sm font-mono font-bold',
                                w.capacityPct > 100 ? 'text-rose-500' : 'text-foreground'
                              )}
                            >
                              {w.capacityPct}%
                            </span>
                            <span
                              className={cn(
                                'text-[9px] font-bold uppercase tracking-wider',
                                w.status.includes('Overloaded')
                                  ? 'text-rose-500'
                                  : w.status.includes('Near')
                                    ? 'text-amber-500'
                                    : w.status.includes('Healthy')
                                      ? 'text-emerald-500'
                                      : 'text-zinc-500'
                              )}
                            >
                              {w.status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Time Performance Analytics */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
            Time Performance
          </h3>
          <div className="bg-background border border-border/20 rounded-2xl p-8 flex flex-col justify-center h-[calc(100%-32px)] space-y-10 shadow-sm">
            <div>
              <div className="flex justify-between items-end mb-4">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Global Budget Burn
                </span>
                <span className="text-sm font-mono font-bold text-foreground">
                  {timePerformance.logged}h{' '}
                  <span className="text-muted-foreground font-normal">
                    / {timePerformance.estimated}h
                  </span>
                </span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden relative">
                <div
                  className={cn(
                    'h-full transition-all',
                    timePerformance.logged > timePerformance.estimated
                      ? 'bg-rose-500'
                      : 'bg-emerald-500'
                  )}
                  style={{
                    width: `${Math.min(100, (timePerformance.logged / Math.max(1, timePerformance.estimated)) * 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between mt-3">
                <span className="text-[10px] text-muted-foreground font-medium">
                  {timePerformance.remaining > 0
                    ? `${timePerformance.remaining}h remaining`
                    : '0h remaining'}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">Estimated Cap</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-border/10">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-3">
                  Overrun Hours
                </span>
                <span
                  className={cn(
                    'text-4xl font-mono font-bold leading-none',
                    timePerformance.overrun > 0 ? 'text-rose-500' : 'text-emerald-500'
                  )}
                >
                  {timePerformance.overrun}h
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-3">
                  Efficiency
                </span>
                <span
                  className={cn(
                    'text-4xl font-mono font-bold leading-none block mb-2',
                    timePerformance.efficiency > 100 ? 'text-rose-500' : 'text-emerald-500'
                  )}
                >
                  {timePerformance.efficiency}%
                </span>
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-wider',
                    timePerformance.efficiency > 100 ? 'text-rose-500' : 'text-emerald-500'
                  )}
                >
                  {timePerformance.efficiencyStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 9 & 10: Active Work Stream & Automation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Work Stream */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 px-1">
            <Play className="w-3 h-3 text-emerald-500" /> Active Work Stream
          </h3>
          <div className="bg-background border border-border/20 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full min-h-[300px]">
            <div className="flex items-center justify-between p-6 lg:p-8 border-b border-border/10 bg-muted/5">
              <div className="flex gap-10">
                <div>
                  <span className="text-4xl font-mono font-bold text-foreground leading-none block mb-2">
                    {activeWorkStream.employeesWorking}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Active Sessions
                  </span>
                </div>
                <div>
                  <span className="text-4xl font-mono font-bold text-muted-foreground leading-none block mb-2">
                    {activeWorkStream.employeesPaused}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">
                    Paused
                  </span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[350px]">
              <table className="w-full text-left whitespace-nowrap">
                <tbody className="divide-y divide-border/10">
                  {activeWorkStream.timers.length === 0 ? (
                    <tr>
                      <td className="p-12 text-sm font-medium text-muted-foreground text-center">
                        No active work sessions currently.
                      </td>
                    </tr>
                  ) : (
                    activeWorkStream.timers.map((timer: any) => (
                      <tr key={timer._id} className="hover:bg-muted/5 transition-colors">
                        <td className="p-4 pl-6 lg:pl-8">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
                              <span className="text-xs font-bold">
                                {timer.userId?.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm font-bold text-foreground block mb-0.5">
                                {timer.userId?.name}
                              </span>
                              <span className="text-[11px] font-medium text-muted-foreground">
                                {timer.taskId?.title}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                            Project
                          </span>
                          <span className="text-xs font-medium text-foreground">
                            {timer.projectName}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-sm font-mono font-bold text-foreground block mb-1">
                            {timer.elapsedFormatted}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 flex items-center justify-end gap-1.5">
                            <Play className="w-2.5 h-2.5 fill-emerald-500" /> Working
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Automation Insights */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 px-1">
            <Bot className="w-3 h-3 text-primary" /> Automation Insights Today
          </h3>
          <div className="bg-background border border-border/20 rounded-2xl p-8 lg:p-10 shadow-sm flex flex-col justify-center h-full min-h-[300px]">
            {automationInsights.triggeredToday === 0 ? (
              <div className="flex items-center justify-center h-full border border-dashed border-border/30 rounded-xl p-8">
                <span className="text-sm font-medium text-muted-foreground">
                  No automation events recorded today.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-y-12 gap-x-10">
                <div>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-3">
                    Rules Triggered
                  </span>
                  <span className="text-5xl font-mono font-bold text-primary block">
                    {automationInsights.triggeredToday}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-3">
                    Auto Completed
                  </span>
                  <span className="text-5xl font-mono font-bold text-foreground block">
                    {automationInsights.autoCompleted}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-3">
                    Auto Assigned
                  </span>
                  <span className="text-5xl font-mono font-bold text-foreground block">
                    {automationInsights.autoAssigned}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-3">
                    Rules Failed
                  </span>
                  <span
                    className={cn(
                      'text-5xl font-mono font-bold block',
                      automationInsights.rulesFailed > 0 ? 'text-rose-500' : 'text-foreground'
                    )}
                  >
                    {automationInsights.rulesFailed}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 11: Momentum Trends */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Tasks Completed Daily
          </h3>
          <span className="text-[10px] font-bold text-muted-foreground bg-muted border border-border/30 px-3 py-1.5 rounded-md">
            Last 30 Days
          </span>
        </div>
        <div className="bg-background border border-border/20 rounded-2xl p-8 pt-16 shadow-sm">
          <ProductivityChart data={momentumTrend} />
        </div>
      </div>
    </div>
  );
}
