import { z } from 'zod';
import { PERMISSION_ACTIONS, ROLE_NAMES } from '@/constants/rbac';

/**
 * Password validation schema
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (optional but recommended)
 */
const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[0-9]/, 'Password must include a number');

/**
 * Login schema - Email and password validation
 */
export const loginSchema = z.object({
  email: z
    .string()
    .email()
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Register schema - New user account creation
 */
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  companyName: z.string().min(2, 'Company name must be at least 2 characters').max(160),
  email: z
    .string()
    .email('Invalid email address')
    .transform((value) => value.toLowerCase()),
  password: passwordSchema,
});

/**
 * Forgot password schema - Email verification
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .transform((value) => value.toLowerCase()),
});

/**
 * Reset password schema - Token and new password
 */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(32, 'Invalid reset token'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Change password schema - Current and new password
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

/**
 * Create user schema - Admin creating new user
 */
export const createUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z
    .string()
    .email()
    .transform((value) => value.toLowerCase()),
  roleIds: z.array(z.string()).min(1, 'At least one role is required'),
  sendInvite: z.boolean().default(true),
});

/**
 * Update user schema - User profile update
 */
export const updateUserSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  image: z.string().url().optional().nullable(),
});

/**
 * Update user roles schema - Role assignment
 */
export const updateUserRolesSchema = z.object({
  userId: z.string().min(1),
  roleIds: z.array(z.string()).min(1, 'At least one role is required'),
});

/**
 * Create role schema - New role creation
 */
export const createRoleSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(300).optional(),
  permissionIds: z.array(z.string()).min(1, 'At least one permission is required'),
});

/**
 * Permission check schema - Verify single permission
 */
export const permissionCheckSchema = z.object({
  resource: z.string().min(1),
  action: z.enum(PERMISSION_ACTIONS),
});
