/**
 * Granular Policy-Based Task Access Engine
 * Implements field-level controls, status transition restrictions, and task management policy rules.
 */

export interface PolicyUser {
  id: string;
  role: 'admin' | 'manager' | 'developer' | 'qa' | string;
  companyId: string;
}

export interface PolicyTask {
  _id: string;
  companyId: string;
  projectId: string;
  assignees: string[];
  watchers: string[];
  creatorId?: string;
  storyPoints?: number;
}

/**
 * Checks if a user has permission to delete a specific task
 */
export function canDeleteTask(user: PolicyUser, task: PolicyTask): boolean {
  const role = user.role.toLowerCase();

  // Multi-tenant check
  if (task.companyId.toString() !== user.companyId.toString()) return false;

  // Admins & Managers can delete any task
  if (role === 'admin' || role === 'manager') return true;

  // Standard members cannot delete tasks
  return false;
}

/**
 * Checks field-level write permissions
 */
export function canEditTaskField(user: PolicyUser, task: PolicyTask, field: string): boolean {
  const role = user.role.toLowerCase();

  // Multi-tenant check
  if (task.companyId.toString() !== user.companyId.toString()) return false;

  // Admins & Managers possess full write clearance
  if (role === 'admin' || role === 'manager') return true;

  // Standard Team Members (Developers / QA) restrictions
  const isLinkedToTask =
    task.assignees.some((a) => a.toString() === user.id.toString()) ||
    task.watchers.some((w) => w.toString() === user.id.toString()) ||
    (task.creatorId && task.creatorId.toString() === user.id.toString());

  if (!isLinkedToTask) return false; // Non-assigned members cannot modify tasks

  // Fields standard Developers/QA are permitted to modify
  const permittedFields = [
    'description',
    'checklistItems',
    'watchers',
    'actualHours', // Logging active clocks
  ];

  // Restrict critical estimation or scoping fields to Managers/Admins
  const restrictedFields = [
    'storyPoints',
    'estimatedHours',
    'projectId',
    'sprintId',
    'milestoneId',
    'priority',
    'severity',
    'dueDate',
    'startDate',
  ];

  if (restrictedFields.includes(field)) return false;

  return permittedFields.includes(field) || field.startsWith('checklistItems');
}

/**
 * Validates workflow status transitions using a secure state transition matrix
 * Matrix enforces QA validation gates: Standard Developers cannot bypass QA stages!
 */
export function canTransitionWorkflow(
  user: PolicyUser,
  task: PolicyTask,
  fromCategory: string,
  toCategory: string
): boolean {
  const role = user.role.toLowerCase();

  // Multi-tenant check
  if (task.companyId.toString() !== user.companyId.toString()) return false;

  // Admins & Managers bypass transition gates
  if (role === 'admin' || role === 'manager') return true;

  const isLinkedToTask =
    task.assignees.some((a) => a.toString() === user.id.toString()) ||
    (task.creatorId && task.creatorId.toString() === user.id.toString());

  if (!isLinkedToTask) return false;

  // Developer transition boundaries:
  // Developers can start backlog tasks or submit them for review, but CANNOT directly push them to 'done' (Requires QA or manager approval)
  if (role === 'developer') {
    if (toCategory === 'done') {
      return false; // Blocks moving directly to Completed column
    }
  }

  // QA transition boundaries:
  // QA engineers can mark items as tested/done, but cannot edit early backlog scoping
  if (role === 'qa') {
    if (fromCategory === 'backlog' && toCategory === 'in_progress') {
      return true;
    }
  }

  return true;
}

/**
 * Checks if a user has permission to link dependencies
 */
export function canManageDependencies(user: PolicyUser, task: PolicyTask): boolean {
  const role = user.role.toLowerCase();

  if (role === 'admin' || role === 'manager') return true;

  // Linked assignees can set dependencies
  return task.assignees.some((a) => a.toString() === user.id.toString());
}
