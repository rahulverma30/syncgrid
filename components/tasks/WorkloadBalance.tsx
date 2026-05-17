/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, ShieldCheck, CheckSquare, Clock, UserCheck } from 'lucide-react';
import { useTasksStore } from '@/store/tasksStore';

export function WorkloadBalance() {
  const { fetchTasks } = useTasksStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkload = () => {
    setLoading(true);
    fetch('/api/protected/tasks/workload')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setData(result.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWorkload();
  }, []);

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
        fetchWorkload(); // reload workload capacity calculations
        fetchTasks(); // reload main task grid
      }
    } catch {
      toast.error('Failed to reassign task.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-xs text-muted-foreground italic">
        Calculating workload allocations & burnout metrics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Intro */}
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

      {/* Grid of Workloads */}
      <div className="grid grid-cols-3 gap-6">
        {data.map((member) => (
          <div
            key={member.userId}
            className={`border rounded-xl p-4.5 flex flex-col h-full bg-background transition ${
              member.isOverloaded
                ? 'border-rose-500/30 shadow-md bg-rose-500/[0.01]'
                : 'border-border/30'
            }`}
          >
            {/* Header info */}
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
              {/* Slider meter */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                  <span>Assigned Load</span>
                  <span
                    className={member.isOverloaded ? 'text-rose-500' : 'text-foreground font-mono'}
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
                            <span className="bg-primary/5 text-primary border border-primary/10 px-1 py-0.2 rounded font-mono font-bold">
                              {task.estimatedHours}h
                            </span>
                          )}

                          {/* Drag rebalancer shortcut select box */}
                          <select
                            className="bg-background border border-border rounded text-[9px] px-1 py-0.5 focus:outline-none cursor-pointer"
                            onChange={(e) => {
                              if (e.target.value) handleReassign(task._id, e.target.value);
                            }}
                            defaultValue=""
                          >
                            <option value="" disabled>
                              Move...
                            </option>
                            {data
                              .filter((m) => m.userId !== member.userId)
                              .map((m) => (
                                <option key={m.userId} value={m.userId}>
                                  {m.userName}
                                </option>
                              ))}
                          </select>
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
    </div>
  );
}
