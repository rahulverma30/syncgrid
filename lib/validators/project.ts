import { z } from 'zod';

export const ProjectIngestSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters.'),
  description: z.string().default(''),
  clientId: z.string().optional(),
  status: z
    .enum([
      'planning',
      'design',
      'development',
      'testing',
      'deployment',
      'completed',
      'on-hold',
      'cancelled',
    ])
    .default('planning'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  projectManager: z.string().default(''),
  budget: z.number().nonnegative('Budget cannot be negative.').default(0),
  billingType: z.enum(['fixed', 'hourly', 'retainer', 'milestone-based']).default('fixed'),
  billingRate: z.number().nonnegative().default(0),
  estimatedHours: z.number().nonnegative().default(0),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
  technologies: z.array(z.string()).default([]),
  repositoryLinks: z.array(z.string()).default([]),
  stagingUrl: z.string().default(''),
  liveUrl: z.string().default(''),
  tags: z.array(z.string()).default([]),
});

export const ProjectUpdateSchema = ProjectIngestSchema.partial().extend({
  isArchived: z.boolean().optional(),
  actualHours: z.number().nonnegative().optional(),
  progressPercentage: z.number().min(0).max(100).optional(),
  healthScore: z.number().min(0).max(100).optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  deliveryDate: z.string().optional(),
});

export const MilestoneIngestSchema = z.object({
  title: z.string().min(2, 'Milestone title is required.'),
  description: z.string().default(''),
  dueDate: z.string().optional(),
  status: z.enum(['pending', 'in-progress', 'completed', 'overdue']).default('pending'),
  progressPercentage: z.number().min(0).max(100).default(0),
  dependsOn: z.array(z.string()).default([]),
  parentMilestoneId: z.string().optional(),
});

export const SprintIngestSchema = z.object({
  name: z.string().min(2, 'Sprint name is required.'),
  goal: z.string().default(''),
  startDate: z.string().min(1, 'Sprint start date is required.'),
  endDate: z.string().min(1, 'Sprint end date is required.'),
  status: z.enum(['planning', 'active', 'completed', 'cancelled']).default('planning'),
  velocity: z.number().nonnegative().default(0),
});

export const TeamMemberIngestSchema = z.object({
  userName: z.string().min(2, 'Team member name is required.'),
  role: z
    .enum(['project-manager', 'team-lead', 'developer', 'qa', 'designer', 'devops', 'other'])
    .default('developer'),
  allocation: z.number().min(0).max(100).default(100),
});

export const RiskIngestSchema = z.object({
  title: z.string().min(2, 'Risk title is required.'),
  description: z.string().default(''),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z.enum(['open', 'mitigated', 'resolved', 'escalated']).default('open'),
  category: z
    .enum(['technical', 'staffing', 'financial', 'timeline', 'dependency', 'operational'])
    .default('technical'),
  probability: z.number().min(1).max(5).default(3),
  impact: z.number().min(1).max(5).default(3),
  mitigation: z.string().default(''),
});

export const ProjectDocumentIngestSchema = z.object({
  name: z.string().min(1, 'Document name is required.'),
  category: z
    .enum(['requirements', 'design', 'technical', 'meeting-notes', 'contract', 'other'])
    .default('other'),
  url: z.string().min(1, 'Document URL is required.'),
  size: z.number().nonnegative().default(0),
});

export const BulkActionSchema = z.object({
  projectIds: z.array(z.string()).min(1, 'At least one project must be selected.'),
  action: z.enum(['status', 'priority', 'archive', 'unarchive', 'tag_add', 'manager']),
  value: z.any(),
});
