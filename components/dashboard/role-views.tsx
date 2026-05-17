'use client';

import React from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  User,
  ShieldAlert,
  Sparkles,
  Receipt,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { DashboardWidget } from './dashboard-widgets';
import {
  AreaChartWrapper,
  BarChartWrapper,
  LineChartWrapper,
  PieChartWrapper,
} from '@/components/ui/charts';
import { MetricCard } from '@/components/ui/advanced-card';
import { ActivityTimeline } from '@/components/ui/notification-center';
import type { ActivityTimelineItem } from '@/components/ui/notification-center';
import { AnalyticsData } from '@/lib/services/analytics';

interface RoleViewProps {
  data: AnalyticsData;
  isLoading: boolean;
  onRefresh: () => void;
}

/**
 * Standard dynamic counter metric card grid
 */
function KPIGrid({ kpis }: { kpis: any }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Object.entries(kpis).map(([key, item]: [string, any]) => {
        const trendValue = parseFloat(item.change.replace(/[^\d.-]/g, ''));
        return (
          <MetricCard
            key={key}
            title={key.replace(/([A-Z])/g, ' $1').trim()}
            value={item.value}
            trend={
              isNaN(trendValue)
                ? undefined
                : item.isPositive
                  ? Math.abs(trendValue)
                  : -Math.abs(trendValue)
            }
            trendLabel={item.comparisonLabel}
          />
        );
      })}
    </div>
  );
}

/**
 * 1. SUPER ADMIN WORKSPACE VIEW
 */
export function SuperAdminView({ data, isLoading, onRefresh }: RoleViewProps) {
  const adminKPIs = {
    totalRevenue: data.kpis.revenue,
    activeProjects: data.kpis.activeProjects,
    totalLeads: data.kpis.totalLeads,
    teamProductivity: data.kpis.teamProductivity,
  };

  const activityTypes = {
    project: 'status' as const,
    lead: 'user' as const,
    security: 'audit' as const,
    finance: 'document' as const,
    task: 'user' as const,
  };

  const timelineItems: ActivityTimelineItem[] = data.activities.map((act) => ({
    id: act.id,
    title: act.user.name,
    description: `${act.action} ${act.target}`,
    time: act.time,
    user: { name: act.user.name },
    type: activityTypes[act.type] || 'user',
  }));

  return (
    <div className="space-y-6">
      {/* Dynamic Counters Grid */}
      <KPIGrid kpis={adminKPIs} />

      {/* Main Charts & Timelines Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Revenue streams */}
        <div className="lg:col-span-2">
          <DashboardWidget
            title="Revenue Overview"
            description="Gross corporate income compared against monthly target lines"
            isLoading={isLoading}
            onRefresh={onRefresh}
          >
            <AreaChartWrapper
              data={data.charts.revenueArea}
              xKey="name"
              metrics={[
                { key: 'amount', label: 'Actual Revenue', color: 'hsl(var(--primary))' },
                { key: 'target', label: 'Target Target', color: 'hsl(var(--secondary))' },
              ]}
              height={260}
            />
          </DashboardWidget>
        </div>

        {/* Project Status Ratio */}
        <div className="col-span-1">
          <DashboardWidget
            title="Project Pipeline Distribution"
            description="Active projects distribution by development status"
            isLoading={isLoading}
            onRefresh={onRefresh}
          >
            <PieChartWrapper data={data.charts.projectStatusPie} height={260} />
          </DashboardWidget>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Lead conversions sources */}
        <div className="lg:col-span-2">
          <DashboardWidget
            title="Lead Acquisition & Conversion"
            description="Acquired leads vs successfully qualified clients"
            isLoading={isLoading}
            onRefresh={onRefresh}
          >
            <BarChartWrapper
              data={data.charts.leadConversionBar}
              xKey="name"
              metrics={[
                { key: 'leads', label: 'Total Leads', color: 'hsl(var(--primary) / 0.4)' },
                { key: 'conversions', label: 'Converted Clients', color: 'hsl(var(--primary))' },
              ]}
              height={250}
            />
          </DashboardWidget>
        </div>

        {/* Global Security & Activity Feed */}
        <div className="col-span-1">
          <DashboardWidget
            title="System Activity Log"
            description="Real-time agency activity feed and system audits"
            isLoading={isLoading}
            onRefresh={onRefresh}
            className="h-full"
          >
            <div className="max-h-[250px] overflow-y-auto pr-1">
              <ActivityTimeline items={timelineItems} />
            </div>
          </DashboardWidget>
        </div>
      </div>

      {/* Transactions Widget */}
      <DashboardWidget
        title="Recent Client Invoices"
        description="Overview of latest agency payments, billings, and processing"
        isLoading={isLoading}
        onRefresh={onRefresh}
        colSpan={4}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/20">
                <th className="py-2.5 px-4">Invoice ID</th>
                <th className="py-2.5 px-4">Client Name</th>
                <th className="py-2.5 px-4">Transaction Amount</th>
                <th className="py-2.5 px-4">Processing Date</th>
                <th className="py-2.5 px-4 text-right">Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-border/40 hover:bg-muted/10 text-xs transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono font-semibold">{tx.id}</td>
                  <td className="py-3.5 px-4 font-semibold">{tx.client}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-foreground">{tx.amount}</td>
                  <td className="py-3.5 px-4 text-muted-foreground">{tx.date}</td>
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                        tx.status === 'paid' && 'bg-emerald-500/10 text-emerald-500',
                        tx.status === 'pending' && 'bg-amber-500/10 text-amber-500',
                        tx.status === 'failed' && 'bg-rose-500/10 text-rose-500',
                        tx.status === 'refunded' && 'bg-blue-500/10 text-blue-500'
                      )}
                    >
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardWidget>
    </div>
  );
}

/**
 * 2. FINANCE OVERVIEW VIEW
 */
export function FinanceView({ data, isLoading, onRefresh }: RoleViewProps) {
  const financeKPIs = {
    totalRevenue: data.kpis.revenue,
    pendingInvoices: data.kpis.pendingInvoices,
    profitability: data.kpis.profitability,
    monthlyGrowth: data.kpis.monthlyGrowth,
  };

  return (
    <div className="space-y-6">
      {/* Counters Grid */}
      <KPIGrid kpis={financeKPIs} />

      {/* Corporate Profit & Loss */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardWidget
            title="Profit & Loss Breakdown"
            description="Comparison of corporate revenue, expenses, and net profit margins"
            isLoading={isLoading}
            onRefresh={onRefresh}
          >
            <BarChartWrapper
              data={data.charts.expensesBar}
              xKey="name"
              metrics={[
                { key: 'revenue', label: 'Gross Revenue', color: '#10b981' },
                { key: 'expenses', label: 'Total Expenses', color: '#f59e0b' },
                { key: 'profit', label: 'Net Profit', color: 'hsl(var(--primary))' },
              ]}
              height={280}
            />
          </DashboardWidget>
        </div>

        <div className="col-span-1">
          <DashboardWidget
            title="Outstanding Revenue Collections"
            description="Distribution of active billings vs pending invoices"
            isLoading={isLoading}
            onRefresh={onRefresh}
          >
            <div className="h-full flex flex-col justify-center space-y-5 py-4">
              <div className="text-center space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Total Outstanding Balance
                </span>
                <h3 className="text-3xl font-black tracking-tight text-rose-500 font-mono">
                  {data.kpis.pendingInvoices.change}
                </h3>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Across {data.kpis.pendingInvoices.value} pending accounts
                </p>
              </div>

              <div className="space-y-3.5 border-t border-border/40 pt-4">
                {data.transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between text-xs">
                    <div className="text-left">
                      <p className="font-semibold text-foreground truncate max-w-[150px]">
                        {tx.client}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {tx.id} • {tx.date}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-foreground">{tx.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </DashboardWidget>
        </div>
      </div>

      {/* Transaction Listings */}
      <DashboardWidget
        title="Agency Billing Ledger"
        description="Detailed ledger of recent financial incoming invoices and refunds"
        isLoading={isLoading}
        onRefresh={onRefresh}
        colSpan={4}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/20">
                <th className="py-2.5 px-4">Ledger ID</th>
                <th className="py-2.5 px-4">Associated Entity</th>
                <th className="py-2.5 px-4">Billing Date</th>
                <th className="py-2.5 px-4">Transaction Type</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-border/40 hover:bg-muted/10 text-xs transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono font-semibold">{tx.id}</td>
                  <td className="py-3.5 px-4 font-semibold">{tx.client}</td>
                  <td className="py-3.5 px-4 text-muted-foreground">{tx.date}</td>
                  <td className="py-3.5 px-4 uppercase font-bold text-[10px] tracking-wide text-muted-foreground">
                    {tx.type}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-black text-foreground">
                    {tx.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardWidget>
    </div>
  );
}

/**
 * 3. DEVELOPER / PRODUCTIVITY VIEW
 */
export function DeveloperView({ data, isLoading, onRefresh }: RoleViewProps) {
  const devTimelineItems: ActivityTimelineItem[] = data.activities
    .filter((a) => a.type === 'project' || a.type === 'task')
    .map((act) => ({
      id: act.id,
      title: act.user.name,
      description: `${act.action} ${act.target}`,
      time: act.time,
      user: { name: act.user.name },
      type: act.type === 'project' ? 'status' : 'user',
    }));

  const devKPIs = {
    activeProjects: data.kpis.activeProjects,
    completedProjects: data.kpis.completedProjects,
    teamProductivity: data.kpis.teamProductivity,
    clientRetention: data.kpis.clientRetention,
  };

  return (
    <div className="space-y-6">
      {/* Counters Grid */}
      <KPIGrid kpis={devKPIs} />

      {/* Sprints completion line charts */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardWidget
            title="Sprint Velocity Trends"
            description="Active tasks versus completed milestones per interval"
            isLoading={isLoading}
            onRefresh={onRefresh}
          >
            <LineChartWrapper
              data={data.charts.projectGrowthLine}
              xKey="name"
              metrics={[
                { key: 'active', label: 'Active Milestones', color: 'hsl(var(--primary))' },
                { key: 'completed', label: 'Completed Deliverables', color: '#10b981' },
              ]}
              height={260}
            />
          </DashboardWidget>
        </div>

        {/* Workload allocations list */}
        <div className="col-span-1">
          <DashboardWidget
            title="Team Allocation Capacities"
            description="Total sprint hours allocated vs remaining maximum capacities"
            isLoading={isLoading}
            onRefresh={onRefresh}
          >
            <div className="space-y-4 py-2 text-left">
              {data.charts.teamWorkload.map((member) => {
                const percentage = Math.min(
                  100,
                  Math.round((member.allocated / member.capacity) * 100)
                );
                return (
                  <div key={member.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-foreground">{member.name}</span>
                      <span className="font-mono text-muted-foreground">
                        {member.allocated}h / {member.capacity}h ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percentage}%` }}
                        className={cn(
                          'h-full transition-all duration-300 rounded-full',
                          percentage > 100 && 'bg-rose-500',
                          percentage <= 100 && percentage > 85 && 'bg-amber-500',
                          percentage <= 85 && 'bg-primary'
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </DashboardWidget>
        </div>
      </div>

      {/* Competencies radar chart */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardWidget
            title="Sprint Activity Timeline"
            description="Latest completed deliverables, commits, and code merges"
            isLoading={isLoading}
            onRefresh={onRefresh}
          >
            <div className="max-h-[220px] overflow-y-auto pr-1">
              <ActivityTimeline items={devTimelineItems} />
            </div>
          </DashboardWidget>
        </div>

        <div className="col-span-1">
          <DashboardWidget
            title="System Alert Notifications"
            description="Active reminders, mentions, and pending pull requests"
            isLoading={isLoading}
            onRefresh={onRefresh}
          >
            <div className="space-y-3 text-left">
              {data.notifications.map((not) => (
                <div
                  key={not.id}
                  className={cn(
                    'p-2.5 rounded-lg border text-xs space-y-1',
                    not.read ? 'border-border/40 bg-muted/10' : 'border-primary/20 bg-primary/5'
                  )}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-foreground truncate">{not.title}</span>
                    <span className="font-mono text-[9px] text-muted-foreground flex-shrink-0">
                      {not.time}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{not.description}</p>
                </div>
              ))}
            </div>
          </DashboardWidget>
        </div>
      </div>
    </div>
  );
}
