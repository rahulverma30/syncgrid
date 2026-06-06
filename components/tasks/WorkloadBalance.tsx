/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, ShieldCheck, UserCheck, SlidersHorizontal, X } from 'lucide-react';
import { useTasksStore } from '@/store/tasksStore';
import { Select } from '@/components/ui/select';

interface WorkloadBalanceProps {
  /** Optional project ID pre-selected from the workspace-level project filter */
  projectId?: string;
}

export function WorkloadBalance({ projectId }: WorkloadBalanceProps) {
  const { fetchTasks } = useTasksStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Lookup data for filter dropdowns
  const [users, setUsers] = useState<any[]>([]);

  // Local filters — project comes from parent prop, not a local dropdown
  const [filterUserId, setFilterUserId] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const hasLocalFilters = !!(filterUserId || filterDateFrom || filterDateTo);

  const buildQueryString = (overrideProjectId?: string) => {
    const params = new URLSearchParams();
    const pid = overrideProjectId !== undefined ? overrideProjectId : projectId || '';
    if (pid) params.set('projectId', pid);
    if (filterUserId) params.set('userId', filterUserId);
    if (filterDateFrom) params.set('dateFrom', filterDateFrom);
    if (filterDateTo) params.set('dateTo', filterDateTo);
    return params.toString();
  };

  const fetchWorkload = (qs?: string) => {
    setLoading(true);
    const query = qs !== undefined ? qs : buildQueryString();
    fetch(`/api/protected/tasks/workload${query ? `?${query}` : ''}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setData(result.data);
      })
      .finally(() => setLoading(false));
  };

  // Initial load + load team member lookup data
  useEffect(() => {
    fetchWorkload(buildQueryString());
    fetch('/api/protected/team/members')
      .then((r) => r.json())
      .then((r) => {
        if (r.success) setUsers(r.data);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when workspace-level project filter changes
  useEffect(() => {
    fetchWorkload(buildQueryString());
    // Reset member filter when project changes — user may not belong to new project
    setFilterUserId('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Re-fetch when local filters change
  useEffect(() => {
    fetchWorkload(buildQueryString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterUserId, filterDateFrom, filterDateTo]);

  const clearFilters = () => {
    setFilterUserId('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const handleReassign = async (taskId: string, newUserId: string) => {
    try {
      const res = await fetch(`/api/protected/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignees: [newUserId] }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Task reassigned successfully! Rebalancing load...');
        fetchWorkload();
        fetchTasks();
      }
    } catch {
      toast.error('Failed to reassign task.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Single filter bar — Member + Due From + Due To only */}
      <div className="bg-muted/10 border border-border/20 p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-primary" /> Workload Filters
            {projectId && (
              <span className="ml-2 text-[9px] font-bold text-primary/70 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full normal-case tracking-normal">
                Showing project members only
              </span>
            )}
          </h4>
          {hasLocalFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition font-bold"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Member filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Member
            </label>
            <Select
              value={filterUserId}
              onChange={setFilterUserId}
              options={[
                { value: '', label: 'All Members' },
                ...users.map((u) => ({ value: u._id, label: u.name })),
              ]}
            />
          </div>

          {/* Due From */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Due From
            </label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="flex h-9 w-full rounded-md border border-border/60 bg-input px-3 py-2 text-xs text-foreground outline-none"
            />
          </div>

          {/* Due To */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Due To
            </label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="flex h-9 w-full rounded-md border border-border/60 bg-input px-3 py-2 text-xs text-foreground outline-none"
            />
          </div>
        </div>
      </div>

      {/* Capacity overview note */}
      <div className="bg-muted/10 border border-border/20 p-4 rounded-xl space-y-1">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <UserCheck className="w-4 h-4 text-primary" /> Resource capacity balancing engine
        </h4>
        <p className="text-xs text-muted-foreground leading-normal">
          This dashboard calculates team capacity limits based on active sprint workloads. Standard
          engineer capacity is set to <strong>40 hours per sprint</strong>. Overallocated members
          display warning panels to prevent exhaustion and delays.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px] text-xs text-muted-foreground italic">
          Calculating workload allocations & burnout metrics...
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-xs text-muted-foreground/60 italic">
          {projectId
            ? 'No team members found for this project, or no active tasks are assigned.'
            : 'No workload data found.'}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {data.map((member) => (
            <div
              key={member.userId}
              className={`border rounded-xl p-4 flex flex-col h-full bg-background transition ${
                member.isOverloaded
                  ? 'border-rose-500/30 shadow-md bg-rose-500/[0.01]'
                  : 'border-border/30'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary uppercase">
                    {member.userName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{member.userName}</h4>
                    <span className="text-[10px] text-muted-foreground block leading-none mt-0.5">
                      {member.email}
                    </span>
                  </div>
                </div>

                {member.isOverloaded ? (
                  <span className="flex items-center gap-1 bg-rose-500/10 text-rose-500 text-[9px] font-bold px-2 py-0.5 rounded border border-rose-500/20 animate-pulse uppercase tracking-wider">
                    <AlertTriangle className="w-3 h-3" /> Overloaded
                  </span>
                ) : (
                  <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3" /> Balanced
                  </span>
                )}
              </div>

              {/* Metrics */}
              <div className="py-4 space-y-3.5 flex-1">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                    <span>Assigned Load</span>
                    <span
                      className={
                        member.isOverloaded ? 'text-rose-500' : 'text-foreground font-mono'
                      }
                    >
                      {member.allocatedHours} hrs / {member.capacityHours} hrs (
                      {member.allocationPercentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted/15 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        member.isOverloaded
                          ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                          : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min(100, member.allocationPercentage)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center bg-muted/5 p-2 rounded-lg border border-border/10">
                  <div>
                    <span className="text-[9px] text-muted-foreground font-bold uppercase block">
                      Active tasks
                    </span>
                    <span className="text-sm font-bold text-foreground font-mono">
                      {member.tasksCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground font-bold uppercase block">
                      Actual Logged
                    </span>
                    <span className="text-sm font-bold text-foreground font-mono">
                      {member.actualHoursLogged}h
                    </span>
                  </div>
                </div>

                {/* Tasks List */}
                <div className="space-y-2 pt-2 border-t border-border/10">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Currently Assigned
                  </span>
                  <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                    {member.tasks.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground/60 italic">
                        No active tasks assigned.
                      </p>
                    ) : (
                      member.tasks.map((task: any) => (
                        <div
                          key={task._id}
                          className="bg-muted/10 border border-border/15 p-2 rounded-md hover:bg-muted/15 transition flex justify-between items-center text-[10px]"
                        >
                          <div className="space-y-0.5 pr-2">
                            <strong className="text-foreground font-mono">[{task.code}]</strong>
                            <span className="text-foreground block line-clamp-1">{task.title}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {task.estimatedHours > 0 && (
                              <span className="bg-primary/5 text-primary border border-primary/10 px-1 py-0.5 rounded font-mono font-bold">
                                {task.estimatedHours}h
                              </span>
                            )}
                            <Select
                              value=""
                              placeholder="Move..."
                              onChange={(val) => {
                                if (val) handleReassign(task._id, val);
                              }}
                              options={users
                                .filter((u) => u._id !== member.userId)
                                .map((u) => ({ value: u._id, label: u.name }))}
                              className="h-7 text-[10px] py-1 px-2 rounded-lg min-w-[80px]"
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
