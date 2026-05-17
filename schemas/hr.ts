import { z } from 'zod';

export const EmployeeCreateSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  designation: z.string().optional(),
  departmentId: z.string().nullable().optional(),
  teamId: z.string().nullable().optional(),
  managerId: z.string().nullable().optional(),
  employmentType: z.enum(['full-time', 'part-time', 'contractor', 'intern']).default('full-time'),
  joiningDate: z.string().or(z.date()).optional(),
  workMode: z.enum(['remote', 'hybrid', 'office']).default('remote'),
  timezone: z.string().default('UTC'),
  skills: z
    .array(
      z.object({
        name: z.string().min(1),
        proficiency: z.number().min(1).max(5),
      })
    )
    .optional()
    .default([]),
  emergencyContacts: z
    .array(
      z.object({
        name: z.string().min(1),
        relation: z.string().min(1),
        phone: z.string().min(1),
      })
    )
    .optional()
    .default([]),
  compensationMetadata: z
    .object({
      salary: z.number().default(0),
      currency: z.string().default('USD'),
      payPeriod: z.string().default('monthly'),
    })
    .optional(),
});

export const EmployeeUpdateSchema = EmployeeCreateSchema.partial().extend({
  status: z.enum(['active', 'suspended', 'onboarding', 'offboarded', 'terminated']).optional(),
  exitDate: z.string().or(z.date()).nullable().optional(),
  assets: z
    .array(
      z.object({
        name: z.string(),
        serialNumber: z.string().optional(),
        assignedDate: z.string().or(z.date()).optional(),
        returnedDate: z.string().or(z.date()).nullable().optional(),
        status: z.enum(['assigned', 'returned']).optional(),
      })
    )
    .optional(),
  documents: z
    .array(
      z.object({
        name: z.string(),
        url: z.string(),
        uploadedAt: z.string().or(z.date()).optional(),
      })
    )
    .optional(),
  onboardingChecklist: z.record(z.boolean()).optional(), // Map support for checkboxes
});

export const DepartmentCreateSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters'),
  code: z.string().min(2, 'Department code must be at least 2 characters'),
  managerId: z.string().nullable().optional(),
  parentDepartmentId: z.string().nullable().optional(),
  description: z.string().optional(),
});

export const TeamCreateSchema = z.object({
  departmentId: z.string().min(1, 'Department is required'),
  name: z.string().min(2, 'Team name must be at least 2 characters'),
  leaderId: z.string().nullable().optional(),
  description: z.string().optional(),
});

export const AttendanceCheckSchema = z.object({
  workMode: z.enum(['remote', 'hybrid', 'office']).default('remote'),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export const LeaveRequestCreateSchema = z.object({
  leaveType: z.enum(['casual', 'sick', 'paid', 'unpaid', 'emergency', 'maternity_paternity']),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  reason: z.string().optional().default(''),
});

export const LeaveApprovalSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  managerNotes: z.string().optional().default(''),
});

export const LeavePolicyCreateSchema = z.object({
  name: z.string().min(1),
  leaveType: z.enum(['casual', 'sick', 'paid', 'unpaid', 'emergency', 'maternity_paternity']),
  annualAllowance: z.number().min(0),
  carryOverLimit: z.number().min(0).default(0),
});

export const EmployeePerformanceReviewCreateSchema = z.object({
  employeeId: z.string().min(1),
  cycleName: z.string().min(2),
  score: z.number().min(1).max(5),
  selfFeedback: z.string().optional().default(''),
  managerFeedback: z.string().optional().default(''),
  goals: z
    .array(
      z.object({
        title: z.string().min(1),
        status: z.enum(['pending', 'in_progress', 'achieved', 'missed']).default('in_progress'),
        kpi: z.string().optional().default(''),
      })
    )
    .optional()
    .default([]),
});

export const EmployeeAnnouncementCreateSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  content: z.string().min(5, 'Content must be at least 5 characters'),
  departmentId: z.string().nullable().optional(),
  isPinned: z.boolean().default(false),
});
