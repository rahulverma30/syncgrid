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
            description={isNaN(trendValue) ? item.change : undefined}
          />
        );
      })}
    </div>
  );
}

/**
 * 1. EXECUTIVE / CEO VIEW
 */
export function SuperAdminView({ data, isLoading, onRefresh }: RoleViewProps) {
  const adminKPIs = {
    revenueThisMonth: data.kpis.revenueThisMonth,
    profitability: data.kpis.profitability,
    pipelineValue: data.kpis.pipelineValue,
    activeClients: data.kpis.activeClients,
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
    type: activityTypes[act.type as keyof typeof activityTypes] || 'user',
  }));

  return (
    <div className="space-y-6">
      <KPIGrid kpis={adminKPIs} />

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardWidget
            title="Revenue Overview"
            description="Gross corporate income compared against monthly targets"
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

        <div className="col-span-1">
          <DashboardWidget
            title="System Insights"
            description="Automated business intelligence feed"
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

      {/* Secondary KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Conversion Rate"
          value={data.kpis.wonDeals?.change || '0%'}
          trendLabel="win rate"
          description={data.kpis.wonDeals?.value + ' won deals'}
        />
        <MetricCard
          title="Total Leads"
          value={data.kpis.totalLeads?.value || '0'}
          trendLabel="conversion rate"
          description={data.kpis.totalLeads?.change + ' converted'}
        />
        <MetricCard
          title="Pending Receivables"
          value={data.kpis.pendingInvoices?.value || '$0'}
          trendLabel="amount overdue"
          description={data.kpis.pendingInvoices?.change + ' overdue'}
        />
        <MetricCard
          title="Labor Utilization"
          value={data.kpis.teamProductivity?.value || '0%'}
          trendLabel="logged"
          description={data.kpis.teamProductivity?.change + ' logged'}
        />
      </div>
    </div>
  );
}

/**
 * 2. OPERATIONS / PROJECT MANAGER VIEW
 */
export function OperationsView({ data, isLoading, onRefresh }: RoleViewProps) {
  const opsKPIs = {
    activeProjects: data.kpis.activeProjects,
    projectsAtRisk: data.kpis.projectsAtRisk,
    overdueTasks: data.kpis.overdueTasks,
    teamProductivity: data.kpis.teamProductivity,
  };

  return (
    <div className="space-y-6">
      <KPIGrid kpis={opsKPIs} />

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardWidget
            title="Team Allocation Capacities"
            description="Total sprint hours allocated vs remaining maximum capacities"
            isLoading={isLoading}
            onRefresh={onRefresh}
          >
            <div className="space-y-4 py-2 text-left">
              {data.charts.teamWorkload.map((member: any) => {
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
              {data.charts.teamWorkload.length === 0 && (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  No workload allocations found.
                </div>
              )}
            </div>
          </DashboardWidget>
        </div>

        <div className="col-span-1">
          <DashboardWidget
            title="Project Pipeline Distribution"
            description="Active projects distribution by development status"
            isLoading={isLoading}
            onRefresh={onRefresh}
          >
            {/* Fallback to simple stats if pie data isn't mapped fully yet */}
            <div className="h-full flex flex-col justify-center space-y-5 py-4">
              <div className="text-center space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Completion Rate
                </span>
                <h3 className="text-3xl font-black tracking-tight text-primary font-mono">
                  {data.kpis.activeProjects?.change || '0%'}
                </h3>
              </div>
              <div className="space-y-3.5 border-t border-border/40 pt-4 px-4">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Active Sprints</span>
                  <span>{data.kpis.activeProjects?.value || 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-rose-500">
                  <span>At Risk</span>
                  <span>{data.kpis.projectsAtRisk?.value || 0}</span>
                </div>
              </div>
            </div>
          </DashboardWidget>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. WORKFORCE / HR VIEW
 */
export function WorkforceView({ data, isLoading, onRefresh }: RoleViewProps) {
  const hrKPIs = {
    activeEmployees: data.kpis.activeEmployees,
    presentToday: data.kpis.presentToday,
    absentToday: data.kpis.absentToday,
    onBreak: data.kpis.onBreak,
  };

  return (
    <div className="space-y-6">
      <KPIGrid kpis={hrKPIs} />

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <div className="col-span-1">
          <DashboardWidget
            title="Attendance Overview"
            description="Daily punch-in distribution"
            isLoading={isLoading}
            onRefresh={onRefresh}
          >
            <div className="flex flex-col justify-center h-full gap-4 text-center py-6">
              <div className="text-4xl font-black text-emerald-500">
                {data.kpis.presentToday?.value || 0}
              </div>
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                Present Employees
              </div>
              <div className="text-xs font-medium text-rose-500 mt-4">
                {data.kpis.absentToday?.value || 0} Absent • {data.kpis.presentToday?.change}
              </div>
            </div>
          </DashboardWidget>
        </div>

        <div className="col-span-1">
          <DashboardWidget
            title="Workload Balance"
            description="Total labor hours logged vs company limits"
            isLoading={isLoading}
            onRefresh={onRefresh}
          >
            <div className="flex flex-col justify-center h-full gap-4 text-center py-6">
              <div className="text-4xl font-black text-primary font-mono">
                {data.kpis.teamProductivity?.change || '0h'}
              </div>
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                Total Hours Logged
              </div>
              <div className="text-xs font-medium text-emerald-500 mt-4">
                {data.kpis.teamProductivity?.value || '0%'} Billable Utilization
              </div>
            </div>
          </DashboardWidget>
        </div>
      </div>
    </div>
  );
}
