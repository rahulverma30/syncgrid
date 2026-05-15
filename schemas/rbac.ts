import { z } from 'zod';
import { PERMISSION_ACTIONS } from '@/constants/rbac';

export const permissionSchema = z.object({
  resource: z.string().min(1).toLowerCase(),
  action: z.enum(PERMISSION_ACTIONS),
  description: z.string().max(300).optional(),
});

export const roleSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(300).optional(),
  permissionIds: z.array(z.string()).default([]),
});

export const companySchema = z.object({
  name: z.string().min(2).max(160),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
});
