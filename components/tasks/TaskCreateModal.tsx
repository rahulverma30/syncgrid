/* eslint-disable react-hooks/incompatible-library */
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TaskCreateSchema } from '@/schemas/task';
import { useTasksStore } from '@/store/tasksStore';
import { CenteredModal } from '@/components/ui/modal-system';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TaskCreateModal({ isOpen, onClose }: TaskCreateModalProps) {
  const { createTask, statuses, fetchStatuses } = useTasksStore();
  const [projects, setProjects] = useState<any[]>([]);
  const [projectUsers, setProjectUsers] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(TaskCreateSchema),
    defaultValues: {
      title: '',
      description: '',
      projectId: '',
      sprintId: null,
      milestoneId: null,
      parentId: null,
      assignees: [],
      statusId: '',
      priority: 'medium',
      severity: 'medium',
      storyPoints: 0,
      estimatedHours: 0,
      dueDate: null,
      startDate: null,
    } as any,
  });

  // Fetch projects and statuses
  useEffect(() => {
    if (isOpen) {
      fetchStatuses();
      fetch('/api/protected/projects')
        .then((res) => res.json())
        .then((result) => {
          if (result.success) setProjects(result.data);
        })
        .catch((err) => console.error(err));
    }
  }, [isOpen, fetchStatuses]);

  // Set default status once statuses load
  useEffect(() => {
    if (statuses.length > 0) {
      const def = statuses.find((s) => s.isDefault) || statuses[0];
      setValue('statusId', def._id);
    }
  }, [statuses, setValue]);

  // Handle Project Change to load its team members or company users
  const projectIdWatch = watch('projectId');
  useEffect(() => {
    if (projectIdWatch) {
      setSelectedProjectId(projectIdWatch);

      // Load users
      fetch('/api/protected/team')
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            setProjectUsers(result.data);
          }
        })
        .catch(() => {
          // Fallback: fetch me
          fetch('/api/protected/me')
            .then((res) => res.json())
            .then((result) => {
              if (result.success) setProjectUsers([result.data]);
            });
        });
    }
  }, [projectIdWatch]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const success = await createTask(data);
      if (success) {
        toast.success('Task created successfully!');
        reset();
        onClose();
      } else {
        toast.error('Failed to create task.');
      }
    } catch (error) {
      toast.error('An error occurred during task creation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProj = projects.find((p) => p._id === selectedProjectId);
  const sprintOptions = selectedProj?.sprints || [];
  const milestoneOptions = selectedProj?.milestones || [];

  return (
    <CenteredModal isOpen={isOpen} onClose={onClose} title="Create Task" className="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        {/* Title */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Task Title
          </label>
          <Input placeholder="Type task title..." {...register('title')} />
          {errors.title && (
            <span className="text-xs text-rose-500">{errors.title.message as string}</span>
          )}
        </div>

        {/* Project Selector */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Project
            </label>
            <select
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              {...register('projectId')}
            >
              <option value="">Select Project...</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
            {errors.projectId && (
              <span className="text-xs text-rose-500">{errors.projectId.message as string}</span>
            )}
          </div>

          {/* Status Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Status
            </label>
            <select
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              {...register('statusId')}
            >
              {statuses.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.statusId && (
              <span className="text-xs text-rose-500">{errors.statusId.message as string}</span>
            )}
          </div>
        </div>

        {/* Sprints & Milestones */}
        {selectedProjectId && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Sprint
              </label>
              <select
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                onChange={(e) => setValue('sprintId', e.target.value || null)}
              >
                <option value="">Backlog / No Sprint</option>
                {sprintOptions.map((s: any) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Milestone
              </label>
              <select
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                onChange={(e) => setValue('milestoneId', e.target.value || null)}
              >
                <option value="">No Milestone</option>
                {milestoneOptions.map((m: any) => (
                  <option key={m._id} value={m._id}>
                    {m.title} ({m.status})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Description
          </label>
          <Textarea
            placeholder="Type task details and requirements..."
            rows={3}
            {...register('description')}
          />
        </div>

        {/* Assignees, Priority, Severity */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Assignee
            </label>
            <select
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              onChange={(e) => setValue('assignees', e.target.value ? [e.target.value] : [])}
            >
              <option value="">Unassigned</option>
              {projectUsers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Priority
            </label>
            <select
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              {...register('priority')}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Severity
            </label>
            <select
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              {...register('severity')}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Story points and estimations */}
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Story Points
            </label>
            <Input type="number" {...register('storyPoints', { valueAsNumber: true })} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Estimated Hours
            </label>
            <Input type="number" {...register('estimatedHours', { valueAsNumber: true })} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Start Date
            </label>
            <Input
              type="date"
              onChange={(e) =>
                setValue('startDate', e.target.value ? new Date(e.target.value) : null)
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Due Date
            </label>
            <Input
              type="date"
              onChange={(e) =>
                setValue('dueDate', e.target.value ? new Date(e.target.value) : null)
              }
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="default" type="submit" isLoading={isSubmitting}>
            Create Task
          </Button>
        </div>
      </form>
    </CenteredModal>
  );
}
