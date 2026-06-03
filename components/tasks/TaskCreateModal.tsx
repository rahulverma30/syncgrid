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
import { Select } from '@/components/ui/select';

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
      fetch('/api/protected/team/members')
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
            <Select
              value={watch('projectId')}
              onChange={(val) => setValue('projectId', val, { shouldValidate: true })}
              options={[
                { value: '', label: 'Select Project...' },
                ...projects.map((p) => ({ value: p._id, label: `${p.name} (${p.code})` })),
              ]}
            />
            {errors.projectId && (
              <span className="text-xs text-rose-500">{errors.projectId.message as string}</span>
            )}
          </div>

          {/* Status Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Status
            </label>
            <Select
              value={watch('statusId')}
              onChange={(val) => setValue('statusId', val, { shouldValidate: true })}
              options={statuses.map((s) => ({ value: s._id, label: s.name }))}
            />
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
              <Select
                value={watch('sprintId') || ''}
                onChange={(val) => setValue('sprintId', val || null, { shouldValidate: true })}
                options={[
                  { value: '', label: 'Backlog / No Sprint' },
                  ...sprintOptions.map((s: any) => ({
                    value: s._id,
                    label: `${s.name} (${s.status})`,
                  })),
                ]}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Milestone
              </label>
              <Select
                value={watch('milestoneId') || ''}
                onChange={(val) => setValue('milestoneId', val || null, { shouldValidate: true })}
                options={[
                  { value: '', label: 'No Milestone' },
                  ...milestoneOptions.map((m: any) => ({
                    value: m._id,
                    label: `${m.title} (${m.status})`,
                  })),
                ]}
              />
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
            <Select
              value={watch('assignees')?.[0] || ''}
              onChange={(val) => setValue('assignees', val ? [val] : [], { shouldValidate: true })}
              options={[
                { value: '', label: 'Unassigned' },
                ...projectUsers.map((u) => ({ value: u._id, label: u.name })),
              ]}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Priority
            </label>
            <Select
              value={watch('priority')}
              onChange={(val) => setValue('priority', val, { shouldValidate: true })}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
              ]}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Severity
            </label>
            <Select
              value={watch('severity')}
              onChange={(val) => setValue('severity', val, { shouldValidate: true })}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'critical', label: 'Critical' },
              ]}
            />
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
