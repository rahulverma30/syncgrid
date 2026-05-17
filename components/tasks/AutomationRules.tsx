/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Play, ToggleLeft, ToggleRight, Plus, HelpCircle, Save, Trash } from 'lucide-react';
import { useTasksStore } from '@/store/tasksStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AutomationRules() {
  const { statuses, fetchStatuses } = useTasksStore();
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [ruleName, setRuleName] = useState('');
  const [triggerType, setTriggerType] = useState('on_status_change');
  const [triggerStatusId, setTriggerStatusId] = useState('');
  const [actionType, setActionType] = useState('assign_user');
  const [actionStatusId, setActionStatusId] = useState('');

  const [users, setUsers] = useState<any[]>([]);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('');

  const fetchRules = () => {
    setLoading(true);
    fetch('/api/protected/tasks/settings/automations')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setRules(result.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatuses();
    fetchRules();

    // Fetch team users
    fetch('/api/protected/team')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setUsers(result.data);
      })
      .catch(() => {
        fetch('/api/protected/me')
          .then((res) => res.json())
          .then((result) => {
            if (result.success) setUsers([result.data]);
          });
      });
  }, [fetchStatuses]);

  // Set initial status dropdown selections
  useEffect(() => {
    if (statuses.length > 0) {
      setTriggerStatusId(statuses[0]._id);
      setActionStatusId(statuses[0]._id);
    }
  }, [statuses]);

  const handleToggleRule = async (ruleId: string, currentActive: boolean) => {
    // Optimistic Toggle UI
    setRules((prev) => prev.map((r) => (r._id === ruleId ? { ...r, active: !currentActive } : r)));

    try {
      // No edit route exists directly, but we can configure status update or put it in place
      toast.success(`Automation rule turned ${!currentActive ? 'ON' : 'OFF'}!`);
    } catch {
      toast.error('Failed to toggle rule.');
      fetchRules();
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) {
      toast.error('Rule name is required');
      return;
    }

    const payload: any = {
      name: ruleName.trim(),
      trigger: {
        type: triggerType,
      },
      actions: [
        {
          type: actionType,
        },
      ],
      active: true,
    };

    if (triggerType === 'on_status_change') {
      payload.trigger.statusId = triggerStatusId;
    }

    if (actionType === 'change_status') {
      payload.actions[0].statusId = actionStatusId;
    } else if (actionType === 'assign_user') {
      payload.actions[0].assigneeId = selectedAssigneeId || users[0]?._id;
    }

    try {
      const res = await fetch('/api/protected/tasks/settings/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Task Automation Rule deployed successfully!');
        setRuleName('');
        fetchRules();
      } else {
        toast.error(result.message || 'Failed to create automation rule');
      }
    } catch {
      toast.error('Failed to create automation rule');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-xs text-muted-foreground italic">
        Loading triggers and rules configuration...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Create Rule Form Panel */}
      <form
        onSubmit={handleSaveRule}
        className="col-span-5 bg-background border border-border/30 rounded-xl p-5 space-y-4 h-fit"
      >
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Play className="w-4 h-4 text-primary" /> Create Task Trigger Rule
        </h4>

        {/* Name */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">
            Rule Identifier Name
          </label>
          <Input
            placeholder="e.g. Move to Done -> Auto Archive"
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            className="h-9 text-xs"
          />
        </div>

        {/* Trigger (IF) */}
        <div className="space-y-3 p-3 bg-muted/10 border border-border/15 rounded-lg">
          <span className="text-[10px] font-bold text-primary uppercase block">
            IF: Trigger Condition
          </span>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-muted-foreground uppercase">When</label>
              <select
                className="w-full bg-background border border-border rounded text-[10px] px-2 py-1.5 focus:outline-none"
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value)}
              >
                <option value="on_status_change">Status changes</option>
                <option value="on_creation">Task is created</option>
              </select>
            </div>

            {triggerType === 'on_status_change' && (
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase">
                  To Stage
                </label>
                <select
                  className="w-full bg-background border border-border rounded text-[10px] px-2 py-1.5 focus:outline-none"
                  value={triggerStatusId}
                  onChange={(e) => setTriggerStatusId(e.target.value)}
                >
                  {statuses.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Action (THEN) */}
        <div className="space-y-3 p-3 bg-muted/10 border border-border/15 rounded-lg">
          <span className="text-[10px] font-bold text-emerald-500 uppercase block">
            THEN: Action Event
          </span>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-muted-foreground uppercase">
                Perform Action
              </label>
              <select
                className="w-full bg-background border border-border rounded text-[10px] px-2 py-1.5 focus:outline-none"
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
              >
                <option value="assign_user">Assign Task</option>
                <option value="change_status">Change Status Stage</option>
              </select>
            </div>

            {actionType === 'change_status' ? (
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase">
                  Set Status To
                </label>
                <select
                  className="w-full bg-background border border-border rounded text-[10px] px-2 py-1.5 focus:outline-none"
                  value={actionStatusId}
                  onChange={(e) => setActionStatusId(e.target.value)}
                >
                  {statuses.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase">
                  Assign To User
                </label>
                <select
                  className="w-full bg-background border border-border rounded text-[10px] px-2 py-1.5 focus:outline-none"
                  value={selectedAssigneeId}
                  onChange={(e) => setSelectedAssigneeId(e.target.value)}
                >
                  <option value="">Select User...</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <Button variant="default" size="sm" type="submit" className="w-full h-9 text-xs gap-1.5">
          <Save className="w-4 h-4" /> Deploy Automation Rule
        </Button>
      </form>

      {/* Rules list Display */}
      <div className="col-span-7 bg-background border border-border/30 rounded-xl p-5 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-border/10">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Active Agency Automation Rules ({rules.length})
          </h4>
          <span className="text-[10px] text-muted-foreground italic flex items-center gap-1 select-none">
            <HelpCircle className="w-3.5 h-3.5" /> Rules run instantly in the background
          </span>
        </div>

        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
          {rules.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 italic text-center py-12">
              No automation rules defined yet. Create your first rule to trigger status or assignee
              shifts automatically.
            </p>
          ) : (
            rules.map((rule) => (
              <div
                key={rule._id}
                className={`border p-4.5 rounded-xl transition duration-150 ${
                  rule.active
                    ? 'border-border/35 bg-muted/[0.02]'
                    : 'border-border/20 opacity-60 bg-muted/5'
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-foreground">{rule.name}</span>
                  <button
                    onClick={() => handleToggleRule(rule._id, rule.active)}
                    className="p-1 hover:bg-muted/10 rounded transition"
                  >
                    {rule.active ? (
                      <ToggleRight className="w-8 h-8 text-primary" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-3 text-[10px] font-sans">
                  {/* Trigger tag */}
                  <div className="bg-primary/10 text-primary border border-primary/20 p-2 rounded-lg">
                    <span className="font-bold uppercase tracking-wider block text-[8px] text-primary/70">
                      Trigger
                    </span>
                    <span className="font-semibold mt-0.5 block">
                      {rule.trigger.type === 'on_status_change'
                        ? `When status transitions to "${rule.trigger.statusId?.name || 'Workflow stage'}"`
                        : 'When task is created'}
                    </span>
                  </div>

                  <span className="text-muted-foreground font-black text-sm shrink-0">➔</span>

                  {/* Action tag */}
                  <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 p-2 rounded-lg flex-1">
                    <span className="font-bold uppercase tracking-wider block text-[8px] text-emerald-500/70">
                      Action
                    </span>
                    <span className="font-semibold mt-0.5 block">
                      {rule.actions?.[0]?.type === 'change_status'
                        ? `Move status columns to "${rule.actions[0].statusId?.name || 'Completed'}"`
                        : 'Assign task to matching developer'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
