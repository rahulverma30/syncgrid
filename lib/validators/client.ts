import { z } from 'zod';

export const ClientIngestSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters long.'),
  clientType: z
    .enum(['VIP', 'Enterprise', 'Startup', 'High Value', 'Retainer', 'Inactive'])
    .default('Startup'),
  industry: z.string().min(2, 'Industry must be specified.').default('Tech'),
  emails: z.array(z.string().email('Invalid contact email format.')).default([]),
  phones: z.array(z.string()).default([]),
  address: z.string().default(''),
  timezone: z.string().default('UTC'),
  website: z.string().default(''),
  socialLinks: z.record(z.string()).default({}),
  companySize: z.enum(['1-10', '11-50', '51-200', '201+']).default('1-10'),
  revenueContribution: z.number().nonnegative('ARR contribution cannot be negative.').default(0),
  accountManager: z.string().default('Pepper Potts'),
  tags: z.array(z.string()).default([]),
  customFields: z.record(z.string()).default({}),
});

export const ClientUpdateSchema = ClientIngestSchema.partial().extend({
  isArchived: z.boolean().optional(),
});

export const ContactIngestSchema = z.object({
  name: z.string().min(2, 'Contact name is required.'),
  role: z.string().default('Point of Contact'),
  email: z.string().email('Invalid email address format.').or(z.literal('')),
  phone: z.string().default(''),
  isPrimary: z.boolean().default(false),
  communicationPref: z.enum(['email', 'phone', 'slack', 'zoom']).default('email'),
});

export const ContractIngestSchema = z.object({
  title: z.string().min(2, 'Contract Title is required.'),
  value: z.number().nonnegative('Contract pricing cannot be negative.'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['active', 'expired', 'renewal-pending']).default('active'),
});

export const NoteIngestSchema = z.object({
  content: z.string().min(1, 'Note content cannot be empty.'),
  isPinned: z.boolean().default(false),
  isPrivate: z.boolean().default(false),
});

export const MeetingIngestSchema = z.object({
  title: z.string().min(2, 'Meeting title is required.'),
  dueDate: z.string().min(1, 'Meeting date is required.'),
  attendees: z.array(z.string()).default([]),
  notes: z.string().optional(),
  isCompleted: z.boolean().default(false),
});
