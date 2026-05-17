import React, { useState } from 'react';
import { useTasksStore, TaskType, StatusType } from '@/store/tasksStore';
import { toast } from 'sonner';
import { AlertCircle, CheckSquare, Clock, User, ArrowUpRight } from 'lucide-react';

interface TaskBoardProps {
  onSelectTask: (code: string) => void;
}

export function TaskBoard({ onSelectTask }: TaskBoardProps) {
  const { tasks, statuses, updateTaskStatusOptimistic } = useTasksStore();
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  // WIP Capacity Limits configurations
  const WIP_LIMITS: Record<string, number> = {
    backlog: 15,
    todo: 8,
    'in-progress': 4, // strict threshold to trigger warnings!
    review: 3,
    testing: 3,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'high':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'medium':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  // Drag and Drop triggers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    setDragOverColumnId(statusId);
  };

  const handleDrop = async (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    setDragOverColumnId(null);

    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    // Issue optimistic column shift
    const success = await updateTaskStatusOptimistic(taskId, statusId);
    if (success) {
      toast.success('Task moved successfully');
    } else {
      toast.error('Failed to move task. Reverted changes.');
    }
  };

  const handleDragLeave = () => {
    setDragOverColumnId(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 h-full min-h-[550px] pr-2">
      {statuses.map((status) => {
        // Filter tasks in this column
        const columnTasks = tasks.filter((t) => (t.statusId?._id || t.statusId) === status._id);

        const limit = WIP_LIMITS[status.key];
        const isOverLimit = limit && columnTasks.length > limit;

        return (
          <div
            key={status._id}
            onDragOver={(e) => handleDragOver(e, status._id)}
            onDrop={(e) => handleDrop(e, status._id)}
            onDragLeave={handleDragLeave}
            className={`flex-1 min-w-[280px] max-w-[320px] rounded-xl p-3.5 flex flex-col h-full bg-muted/5 border-2 transition-all duration-200 ${
              dragOverColumnId === status._id
                ? 'border-primary/40 bg-primary/5'
                : 'border-border/30'
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: status.color || '#94a3b8' }}
                />
                <h3 className="font-bold text-sm text-foreground">{status.name}</h3>
                <span className="bg-muted/15 border border-border/40 text-[10px] font-bold text-muted-foreground px-2 py-0.5 rounded-full font-mono">
                  {columnTasks.length}
                </span>
              </div>

              {/* WIP Limit warning */}
              {limit && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-sans ${
                    isOverLimit
                      ? 'bg-rose-500/10 text-rose-500 border border-rose-500/25 animate-pulse'
                      : 'bg-muted/10 text-muted-foreground'
                  }`}
                >
                  LMT: {limit}
                </span>
              )}
            </div>

            {isOverLimit && (
              <div className="mb-3 p-2 bg-rose-500/5 border border-rose-500/20 text-[10px] text-rose-500 rounded-md flex items-center gap-1.5 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> WIP Capacity overload threshold
                triggered!
              </div>
            )}

            {/* Cards container */}
            <div className="space-y-3 overflow-y-auto pr-1 flex-1 min-h-[450px]">
              {columnTasks.length === 0 ? (
                <div className="h-28 border border-dashed border-border/45 rounded-lg flex items-center justify-center text-xs text-muted-foreground/60 italic">
                  Drag tasks here
                </div>
              ) : (
                columnTasks.map((task) => {
                  const completedChecks =
                    task.checklistItems?.filter((c) => c.isCompleted).length || 0;
                  const totalChecks = task.checklistItems?.length || 0;
                  const hasChecks = totalChecks > 0;

                  return (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task._id)}
                      onClick={() => onSelectTask(task.code)}
                      className="bg-background border border-border/40 hover:border-primary/35 p-3.5 rounded-xl shadow-sm hover:shadow-md transition-all duration-150 cursor-grab active:cursor-grabbing space-y-3 group relative select-none"
                    >
                      {/* Top labels */}
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="bg-muted/15 border border-border/30 text-muted-foreground font-mono font-bold px-1.5 py-0.5 rounded">
                          {task.code}
                        </span>

                        <span
                          className={`px-1.5 py-0.2 rounded font-sans border font-bold capitalize tracking-wider ${getPriorityColor(task.priority)}`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-bold leading-normal text-foreground group-hover:text-primary transition-colors pr-3.5">
                        {task.title}
                      </h4>

                      {/* Checklist progress bar */}
                      {hasChecks && (
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[9px] font-bold text-muted-foreground">
                            <span className="flex items-center gap-0.5">
                              <CheckSquare className="w-2.5 h-2.5" /> Checklist
                            </span>
                            <span>
                              {completedChecks}/{totalChecks}
                            </span>
                          </div>
                          <div className="w-full bg-muted/15 h-1 rounded-full overflow-hidden">
                            <div
                              className="bg-primary h-full transition-all duration-200"
                              style={{ width: `${(completedChecks / totalChecks) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Footer assignees & point badge */}
                      <div className="flex justify-between items-center pt-2 border-t border-border/10">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] font-bold text-muted-foreground font-mono">
                            {task.actualHours ? `${task.actualHours.toFixed(1)}h` : '0h'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {task.storyPoints > 0 && (
                            <span className="bg-primary/10 text-primary border border-primary/20 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold">
                              {task.storyPoints} SP
                            </span>
                          )}

                          {/* Assignee Avatar */}
                          <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center text-[9px] font-black uppercase text-primary border border-primary/20">
                            {task.assignees?.[0]?.name?.charAt(0) || (
                              <User className="w-2.5 h-2.5" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Deep Link button */}
                      <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted/10 rounded">
                        <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
