/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from 'react';
import { useTasksStore, TaskType } from '@/store/tasksStore';
import { DrawerModal } from '@/components/ui/modal-system';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Play,
  Square,
  Clock,
  Plus,
  CheckSquare,
  AlertTriangle,
  Lock,
  User as UserIcon,
  Check,
  Send,
  MessageSquare,
  Tag,
  Calendar,
} from 'lucide-react';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskCode: string;
}

export function TaskDetailModal({ isOpen, onClose, taskCode }: TaskDetailModalProps) {
  const {
    activeTask,
    fetchSingleTask,
    updateTask,
    statuses,
    tasks,
    fetchTasks,
    addChecklistItem,
    toggleChecklistItem,
    addDependency,
    runningTimer,
    startTimer,
    stopTimer,
    logManualTime,
  } = useTasksStore();

  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'time' | 'dependencies'>(
    'details'
  );
  const [description, setDescription] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [newChecklist, setNewChecklist] = useState('');

  // Comments state
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPrivateComment, setIsPrivateComment] = useState(false);

  // Time logging state
  const [timelogs, setTimelogs] = useState<any[]>([]);
  const [manualMinutes, setManualMinutes] = useState(60);
  const [manualDesc, setManualDesc] = useState('');

  // Blocker search
  const [selectedBlockerId, setSelectedBlockerId] = useState('');
  const [blockerType, setBlockerType] = useState<'blocked_by' | 'blocks' | 'relates_to'>(
    'blocked_by'
  );

  useEffect(() => {
    if (isOpen && taskCode) {
      fetchSingleTask(taskCode);
    }
  }, [isOpen, taskCode, fetchSingleTask]);

  // Sync state once task loads
  useEffect(() => {
    if (activeTask) {
      setDescription(activeTask.description || '');

      // Fetch task comments
      fetch(`/api/protected/tasks/${activeTask._id}/comments`)
        .then((res) => res.json())
        .then((res) => {
          if (res.success) setComments(res.data);
        });

      // Fetch task timelogs
      fetch(`/api/protected/tasks/${activeTask._id}/timelogs`)
        .then((res) => res.json())
        .then((res) => {
          if (res.success) setTimelogs(res.data);
        });
    }
  }, [activeTask]);

  if (!activeTask) return null;

  const handleSaveDesc = async () => {
    const success = await updateTask(activeTask._id, { description });
    if (success) {
      toast.success('Description updated successfully');
      setIsEditingDesc(false);
    } else {
      toast.error('Failed to save description');
    }
  };

  const handleAddCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklist.trim()) return;
    await addChecklistItem(activeTask._id, newChecklist.trim());
    setNewChecklist('');
    toast.success('Checklist item added');
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`/api/protected/tasks/${activeTask._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim(), isPrivate: isPrivateComment }),
      });
      const result = await res.json();
      if (result.success) {
        setComments([...comments, result.data]);
        setNewComment('');
        toast.success('Comment posted');
      }
    } catch {
      toast.error('Failed to post comment');
    }
  };

  const handleLogManual = async (e: React.FormEvent) => {
    e.preventDefault();
    await logManualTime(activeTask._id, {
      durationMinutes: manualMinutes,
      description: manualDesc || 'Manual logged work',
      startTime: new Date(),
    });
    setManualDesc('');
    toast.success('Time logged successfully!');
    // Reload logs
    fetch(`/api/protected/tasks/${activeTask._id}/timelogs`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setTimelogs(res.data);
      });
  };

  const handleAddBlocker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBlockerId) return;

    const success = await addDependency(activeTask._id, selectedBlockerId, blockerType);
    if (success) {
      toast.success('Task dependency link created successfully');
      setSelectedBlockerId('');
    } else {
      toast.error('Failed to link tasks. (Check for circular dependency cycles)');
    }
  };

  const isTimerRunning = runningTimer?.taskId === activeTask._id;

  // Health Score color logic
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 border-emerald-500/25';
    if (score >= 50) return 'text-amber-500 border-amber-500/25';
    return 'text-rose-500 border-rose-500/25';
  };

  return (
    <DrawerModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${activeTask.code}: Detail View`}
      className="max-w-4xl"
    >
      <div className="grid grid-cols-12 gap-6 h-full pb-10">
        {/* Left Column: Contents & Tabs */}
        <div className="col-span-8 space-y-4">
          {/* Header */}
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground select-all">
              {activeTask.title}
            </h2>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-mono font-bold select-all">
                {activeTask.code}
              </span>
              <span>
                Project: <strong className="text-foreground">{activeTask.projectId?.name}</strong>
              </span>
              {activeTask.sprintId && <span>Sprint Active</span>}
            </div>
          </div>

          {/* Tab buttons */}
          <div className="flex border-b border-border/40 gap-4 text-sm font-semibold">
            {(['details', 'comments', 'time', 'dependencies'] as const).map((tab) => (
              <button
                key={tab}
                className={`pb-2 border-b-2 capitalize transition-colors duration-150 ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Panels */}
          {activeTab === 'details' && (
            <div className="space-y-5">
              {/* Description */}
              <div className="bg-muted/15 border border-border/30 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Description
                  </span>
                  {!isEditingDesc ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setIsEditingDesc(true)}
                    >
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setIsEditingDesc(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={handleSaveDesc}
                      >
                        Save
                      </Button>
                    </div>
                  )}
                </div>

                {!isEditingDesc ? (
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {activeTask.description || (
                      <em className="text-muted-foreground/60">No description provided.</em>
                    )}
                  </p>
                ) : (
                  <Textarea
                    className="w-full text-sm min-h-[120px]"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                )}
              </div>

              {/* Checklist */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Checklist Items
                </span>

                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-2">
                  {activeTask.checklistItems?.length === 0 ? (
                    <p className="text-xs text-muted-foreground/75 italic">No items yet.</p>
                  ) : (
                    activeTask.checklistItems?.map((item: any) => (
                      <div
                        key={item._id}
                        className="flex items-center gap-3 bg-muted/10 border border-border/20 px-3 py-2.5 rounded-md hover:bg-muted/20 transition duration-150 group"
                      >
                        <button
                          type="button"
                          onClick={() => toggleChecklistItem(activeTask._id, item._id)}
                          className={`flex items-center justify-center w-5 h-5 rounded border transition-colors ${
                            item.isCompleted
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-muted-foreground/45 group-hover:border-primary/60'
                          }`}
                        >
                          {item.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <span
                          className={`text-sm ${item.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                        >
                          {item.title}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddCheck} className="flex gap-2">
                  <Input
                    placeholder="Add checklist action..."
                    value={newChecklist}
                    onChange={(e) => setNewChecklist(e.target.value)}
                    className="h-9 text-sm"
                  />
                  <Button variant="outline" size="sm" type="submit" className="h-9 gap-1">
                    <Plus className="w-4 h-4" /> Add
                  </Button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              {/* Comment Input */}
              <form
                onSubmit={handlePostComment}
                className="bg-muted/10 border border-border/20 p-3 rounded-lg space-y-3"
              >
                <Textarea
                  placeholder="Ask a question or post a progress update..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full text-sm min-h-[70px]"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isPrivateComment}
                      onChange={(e) => setIsPrivateComment(e.target.checked)}
                      className="rounded border-border bg-background focus:ring-0"
                    />
                    <Lock className="w-3.5 h-3.5 text-amber-500" /> Internal (Admins/PMs only)
                  </label>
                  <Button variant="default" size="sm" type="submit" className="gap-1.5">
                    <Send className="w-3.5 h-3.5" /> Post Comment
                  </Button>
                </div>
              </form>

              {/* Comment list */}
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                {comments.length === 0 ? (
                  <p className="text-xs text-muted-foreground/75 italic">
                    No comments yet. Mention team members using @Username.
                  </p>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c._id}
                      className={`border rounded-lg p-3.5 space-y-1.5 transition ${
                        c.isPrivate
                          ? 'border-amber-500/20 bg-amber-500/5'
                          : 'border-border/30 bg-muted/5'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary uppercase">
                            {c.userId?.name?.charAt(0) || <UserIcon className="w-3 h-3" />}
                          </div>
                          <span className="text-xs font-bold text-foreground">
                            {c.userId?.name || 'Developer'}
                          </span>
                          {c.isPrivate && (
                            <span className="flex items-center gap-0.5 bg-amber-500/10 text-amber-500 text-[9px] px-1 py-0.2 rounded font-bold uppercase tracking-wider">
                              <Lock className="w-2.5 h-2.5" /> Private
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString()}{' '}
                          {new Date(c.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/95 leading-relaxed">{c.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'time' && (
            <div className="space-y-5">
              {/* Active clock timer */}
              <div className="border border-border/30 rounded-xl p-5 bg-gradient-to-br from-primary/5 to-muted/10 flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider block">
                    Web Timer clock
                  </span>
                  <div className="flex items-center gap-2">
                    <Clock
                      className={`w-5 h-5 ${isTimerRunning ? 'text-emerald-500 animate-pulse' : 'text-muted-foreground'}`}
                    />
                    <span className="text-lg font-bold text-foreground font-mono">
                      {isTimerRunning ? 'Clock Running...' : 'Stopped'}
                    </span>
                  </div>
                </div>

                {!isTimerRunning ? (
                  <Button
                    variant="default"
                    onClick={() => startTimer(activeTask._id)}
                    className="bg-emerald-600 hover:bg-emerald-500 gap-1.5"
                  >
                    <Play className="w-4 h-4 fill-current" /> Start Timer
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={() => stopTimer(activeTask._id, 'Tracked work', true)}
                    className="gap-1.5"
                  >
                    <Square className="w-4 h-4 fill-current" /> Stop & Log
                  </Button>
                )}
              </div>

              {/* Manual time entry */}
              <form
                onSubmit={handleLogManual}
                className="border border-border/20 rounded-xl p-4 bg-muted/5 space-y-3"
              >
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Log Hours Manually
                </span>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground">
                      Minutes worked
                    </label>
                    <Input
                      type="number"
                      value={manualMinutes}
                      onChange={(e) => setManualMinutes(Number(e.target.value))}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground">
                      Work description
                    </label>
                    <Input
                      placeholder="What did you work on?"
                      value={manualDesc}
                      onChange={(e) => setManualDesc(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" type="submit">
                    Log manual time
                  </Button>
                </div>
              </form>

              {/* Time logs history */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Logged Work Log ({activeTask.actualHours.toFixed(1)} hrs total)
                </span>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2">
                  {timelogs.length === 0 ? (
                    <p className="text-xs text-muted-foreground/75 italic">
                      No logged hours recorded yet.
                    </p>
                  ) : (
                    timelogs.map((l) => (
                      <div
                        key={l._id}
                        className="flex justify-between items-center border border-border/10 bg-muted/5 p-3 rounded-md"
                      >
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-foreground">
                            {l.userId?.name || 'Developer'}
                          </span>
                          <p className="text-xs text-muted-foreground">{l.description}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-primary font-mono">
                            {l.durationMinutes} min
                          </span>
                          <span className="text-[10px] block text-muted-foreground">
                            {new Date(l.startTime).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dependencies' && (
            <div className="space-y-5">
              {/* Add Blocker Connection */}
              <form
                onSubmit={handleAddBlocker}
                className="border border-border/20 bg-muted/5 p-4 rounded-xl space-y-3"
              >
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Link Blocker / Related Task
                </span>
                <div className="grid grid-cols-12 gap-3">
                  {/* Relation type */}
                  <select
                    className="col-span-3 bg-background border border-border rounded-md px-3 py-1.5 text-xs focus:outline-none"
                    value={blockerType}
                    onChange={(e: any) => setBlockerType(e.target.value)}
                  >
                    <option value="blocked_by">Blocked By</option>
                    <option value="blocks">Blocks</option>
                    <option value="relates_to">Relates To</option>
                  </select>

                  {/* Task Searcher Dropdown */}
                  <select
                    className="col-span-6 bg-background border border-border rounded-md px-3 py-1.5 text-xs focus:outline-none"
                    value={selectedBlockerId}
                    onChange={(e) => setSelectedBlockerId(e.target.value)}
                  >
                    <option value="">Select Task...</option>
                    {tasks
                      .filter((t) => t._id !== activeTask._id)
                      .map((t) => (
                        <option key={t._id} value={t._id}>
                          [{t.code}] {t.title}
                        </option>
                      ))}
                  </select>

                  <Button
                    variant="default"
                    size="sm"
                    type="submit"
                    className="col-span-3 h-9 text-xs"
                  >
                    Link Task
                  </Button>
                </div>
              </form>

              {/* Linked relations list */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block font-sans">
                  Dependencies Chains
                </span>
                <div className="space-y-2">
                  {activeTask.dependencies?.length === 0 ? (
                    <p className="text-xs text-muted-foreground/75 italic">
                      No dependent blockers defined for this task.
                    </p>
                  ) : (
                    activeTask.dependencies?.map((dep: any) => {
                      const resolvedTask = tasks.find((t) => t._id === dep.targetTaskId);
                      return (
                        <div
                          key={dep._id}
                          className="flex justify-between items-center bg-muted/10 border border-border/20 p-3 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                dep.type === 'blocked_by'
                                  ? 'bg-rose-500/10 text-rose-500'
                                  : dep.type === 'blocks'
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : 'bg-muted/30 text-muted-foreground'
                              }`}
                            >
                              {dep.type.replace('_', ' ')}
                            </span>
                            <span className="text-sm font-semibold text-foreground font-sans">
                              {resolvedTask
                                ? `[${resolvedTask.code}] ${resolvedTask.title}`
                                : 'Related Task'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Settings & Attributes */}
        <div className="col-span-4 border-l border-border/40 pl-6 space-y-5">
          {/* Health score metric gauge */}
          <div
            className={`border border-border/30 rounded-xl p-4 text-center space-y-1 bg-muted/5`}
          >
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Health status score
            </span>
            <div className="relative inline-flex items-center justify-center mt-1">
              <div
                className={`w-14 h-14 rounded-full border-4 flex items-center justify-center font-mono font-black text-sm ${getHealthColor(activeTask.healthScore)}`}
              >
                {activeTask.healthScore}%
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 leading-normal font-sans">
              Calculated dynamically using blockers, overdue timers, and actual logged hours
              overruns.
            </p>
          </div>

          {/* Quick attribute switches */}
          <div className="space-y-4 text-xs font-semibold">
            {/* Status Column */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Workflow Status
              </label>
              <select
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                value={activeTask.statusId?._id || activeTask.statusId}
                onChange={async (e) => {
                  const success = await updateTask(activeTask._id, { statusId: e.target.value });
                  if (success) {
                    toast.success('Status updated!');
                    fetchTasks();
                  }
                }}
              >
                {statuses.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Task Priority
              </label>
              <select
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                value={activeTask.priority}
                onChange={async (e) => {
                  const success = await updateTask(activeTask._id, { priority: e.target.value });
                  if (success) {
                    toast.success('Priority updated!');
                    fetchTasks();
                  }
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Story Points */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Story Points
                </label>
                <Input
                  type="number"
                  defaultValue={activeTask.storyPoints}
                  onBlur={async (e) => {
                    await updateTask(activeTask._id, { storyPoints: Number(e.target.value) });
                    toast.success('Story points saved!');
                    fetchTasks();
                  }}
                  className="h-8 text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Est. Hours
                </label>
                <Input
                  type="number"
                  defaultValue={activeTask.estimatedHours}
                  onBlur={async (e) => {
                    await updateTask(activeTask._id, { estimatedHours: Number(e.target.value) });
                    toast.success('Estimated hours saved!');
                    fetchTasks();
                  }}
                  className="h-8 text-xs font-mono font-bold"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-3 pt-2 border-t border-border/20">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Start Date
                </span>
                <span className="text-foreground">
                  {activeTask.startDate
                    ? new Date(activeTask.startDate).toLocaleDateString()
                    : 'Not Set'}
                </span>
              </div>

              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Due Date
                </span>
                <span className="text-foreground">
                  {activeTask.dueDate
                    ? new Date(activeTask.dueDate).toLocaleDateString()
                    : 'Not Set'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DrawerModal>
  );
}
