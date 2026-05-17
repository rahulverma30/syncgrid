import { z } from 'zod';

// MongoDB ObjectId Regex Helper
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z
  .string()
  .regex(objectIdRegex, { message: 'Invalid database identifier format' });

export const TaskCreateSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(150, 'Title cannot exceed 150 characters'),
  description: z.string().optional().default(''),
  projectId: objectIdSchema,
  sprintId: objectIdSchema.nullable().optional(),
  milestoneId: objectIdSchema.nullable().optional(),
  parentId: objectIdSchema.nullable().optional(),
  assignees: z.array(objectIdSchema).optional().default([]),
  statusId: objectIdSchema,
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
  storyPoints: z.number().min(0).max(100).optional().default(0),
  estimatedHours: z.number().min(0).max(1000).optional().default(0),
  dueDate: z.preprocess(
    (val) => (typeof val === 'string' && val ? new Date(val) : val),
    z.date().nullable().optional()
  ),
  startDate: z.preprocess(
    (val) => (typeof val === 'string' && val ? new Date(val) : val),
    z.date().nullable().optional()
  ),
  recurrenceRules: z
    .object({
      frequency: z.enum(['none', 'daily', 'weekly', 'monthly']).default('none'),
      interval: z.number().min(1).default(1),
      active: z.boolean().default(false),
    })
    .optional(),
});

export const TaskUpdateSchema = TaskCreateSchema.partial().extend({
  completedDate: z.preprocess(
    (val) => (typeof val === 'string' && val ? new Date(val) : val),
    z.date().nullable().optional()
  ),
  isArchived: z.boolean().optional(),
  isSoftDeleted: z.boolean().optional(),
});

export const TaskCommentSchema = z.object({
  content: z.string().min(1, 'Comment body cannot be empty'),
  parentId: objectIdSchema.nullable().optional(),
  isPrivate: z.boolean().optional().default(false),
});

export const TaskChecklistItemSchema = z.object({
  title: z.string().min(1, 'Checklist item title is required').trim(),
  isCompleted: z.boolean().optional(),
  parentId: objectIdSchema.nullable().optional(),
  order: z.number().optional().default(0),
});

export const TaskTimeLogSchema = z.object({
  description: z.string().optional().default(''),
  durationMinutes: z.number().min(1, 'Logged duration must be at least 1 minute'),
  billable: z.boolean().optional().default(true),
  startTime: z.preprocess((val) => (typeof val === 'string' ? new Date(val) : val), z.date()),
  endTime: z.preprocess(
    (val) => (typeof val === 'string' ? new Date(val) : val),
    z.date().optional()
  ),
});

export const TaskStatusSchema = z.object({
  name: z.string().min(1, 'Workflow status name is required').trim(),
  key: z.string().min(1, 'Workflow key is required').trim().toLowerCase(),
  category: z.enum(['backlog', 'todo', 'in_progress', 'done']),
  color: z.string().optional().default('#94a3b8'),
  order: z.number().optional().default(0),
  isDefault: z.boolean().optional().default(false),
  description: z.string().optional().default(''),
});

export const TaskLabelSchema = z.object({
  name: z.string().min(1, 'Label name is required').trim(),
  color: z.string().optional().default('#3b82f6'),
  description: z.string().optional().default(''),
});

export const TaskAutomationRuleSchema = z.object({
  name: z.string().min(1, 'Automation rule name is required'),
  trigger: z.object({
    type: z.enum(['on_status_change', 'on_priority_change', 'on_creation', 'on_overdue']),
    statusId: objectIdSchema.optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  }),
  actions: z.array(
    z.object({
      type: z.enum(['assign_user', 'change_status', 'escalate_priority', 'send_notification']),
      assigneeId: objectIdSchema.optional(),
      statusId: objectIdSchema.optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
      emailTemplate: z.string().optional(),
    })
  ),
  active: z.boolean().optional().default(true),
});
