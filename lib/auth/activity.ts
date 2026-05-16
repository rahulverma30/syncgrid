/**
 * Activity Tracking Utilities
 * Track user actions and system events for audit and analytics
 */

export const ACTIVITY_TYPES = {
  // Auth activities
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTER: 'register',
  PASSWORD_RESET: 'password_reset',
  PASSWORD_CHANGE: 'password_change',

  // User activities
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  USER_INVITED: 'user_invited',
  USER_ROLE_CHANGED: 'user_role_changed',

  // Role activities
  ROLE_CREATED: 'role_created',
  ROLE_UPDATED: 'role_updated',
  ROLE_DELETED: 'role_deleted',

  // Permission activities
  PERMISSION_GRANTED: 'permission_granted',
  PERMISSION_REVOKED: 'permission_revoked',

  // Company activities
  COMPANY_CREATED: 'company_created',
  COMPANY_UPDATED: 'company_updated',
  COMPANY_SETTINGS_CHANGED: 'company_settings_changed',

  // General
  CUSTOM: 'custom',
} as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[keyof typeof ACTIVITY_TYPES];

/**
 * Activity tracking payload
 */
export interface ActivityPayload {
  type: ActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Format activity type to human-readable text
 */
export function formatActivityType(type: ActivityType): string {
  const formatted = type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return formatted;
}

/**
 * Get icon for activity type
 */
export function getActivityIcon(type: ActivityType): string {
  const iconMap: Record<ActivityType, string> = {
    // Auth
    [ACTIVITY_TYPES.LOGIN]: '🔓',
    [ACTIVITY_TYPES.LOGOUT]: '🔒',
    [ACTIVITY_TYPES.REGISTER]: '✍️',
    [ACTIVITY_TYPES.PASSWORD_RESET]: '🔑',
    [ACTIVITY_TYPES.PASSWORD_CHANGE]: '🔐',

    // Users
    [ACTIVITY_TYPES.USER_CREATED]: '👤',
    [ACTIVITY_TYPES.USER_UPDATED]: '✏️',
    [ACTIVITY_TYPES.USER_DELETED]: '🗑️',
    [ACTIVITY_TYPES.USER_INVITED]: '📧',
    [ACTIVITY_TYPES.USER_ROLE_CHANGED]: '🎯',

    // Roles
    [ACTIVITY_TYPES.ROLE_CREATED]: '🆕',
    [ACTIVITY_TYPES.ROLE_UPDATED]: '🔄',
    [ACTIVITY_TYPES.ROLE_DELETED]: '❌',

    // Permissions
    [ACTIVITY_TYPES.PERMISSION_GRANTED]: '✅',
    [ACTIVITY_TYPES.PERMISSION_REVOKED]: '⛔',

    // Company
    [ACTIVITY_TYPES.COMPANY_CREATED]: '🏢',
    [ACTIVITY_TYPES.COMPANY_UPDATED]: '🔧',
    [ACTIVITY_TYPES.COMPANY_SETTINGS_CHANGED]: '⚙️',

    // Custom
    [ACTIVITY_TYPES.CUSTOM]: '📝',
  };

  return iconMap[type] || '📝';
}

/**
 * Get severity level for activity type
 */
export function getActivitySeverity(type: ActivityType): 'low' | 'medium' | 'high' | 'critical' {
  const severityMap: Record<ActivityType, 'low' | 'medium' | 'high' | 'critical'> = {
    // Low severity
    [ACTIVITY_TYPES.LOGIN]: 'low',
    [ACTIVITY_TYPES.LOGOUT]: 'low',

    // Medium severity
    [ACTIVITY_TYPES.REGISTER]: 'medium',
    [ACTIVITY_TYPES.USER_CREATED]: 'medium',
    [ACTIVITY_TYPES.USER_UPDATED]: 'medium',
    [ACTIVITY_TYPES.USER_INVITED]: 'medium',
    [ACTIVITY_TYPES.ROLE_CREATED]: 'medium',
    [ACTIVITY_TYPES.ROLE_UPDATED]: 'medium',
    [ACTIVITY_TYPES.PERMISSION_GRANTED]: 'medium',
    [ACTIVITY_TYPES.COMPANY_UPDATED]: 'medium',
    [ACTIVITY_TYPES.COMPANY_SETTINGS_CHANGED]: 'medium',

    // High severity
    [ACTIVITY_TYPES.PASSWORD_RESET]: 'high',
    [ACTIVITY_TYPES.PASSWORD_CHANGE]: 'high',
    [ACTIVITY_TYPES.USER_DELETED]: 'high',
    [ACTIVITY_TYPES.USER_ROLE_CHANGED]: 'high',
    [ACTIVITY_TYPES.ROLE_DELETED]: 'high',
    [ACTIVITY_TYPES.PERMISSION_REVOKED]: 'high',

    // Critical
    [ACTIVITY_TYPES.COMPANY_CREATED]: 'critical',

    // Custom
    [ACTIVITY_TYPES.CUSTOM]: 'medium',
  };

  return severityMap[type] || 'medium';
}

/**
 * Common activity titles and descriptions
 */
export const ACTIVITY_MESSAGES = {
  [ACTIVITY_TYPES.LOGIN]: {
    title: 'User logged in',
    description: 'User successfully authenticated',
  },
  [ACTIVITY_TYPES.LOGOUT]: {
    title: 'User logged out',
    description: 'User session ended',
  },
  [ACTIVITY_TYPES.REGISTER]: {
    title: 'Account registered',
    description: 'New account created',
  },
  [ACTIVITY_TYPES.PASSWORD_RESET]: {
    title: 'Password reset initiated',
    description: 'User requested password reset',
  },
  [ACTIVITY_TYPES.PASSWORD_CHANGE]: {
    title: 'Password changed',
    description: 'User password updated',
  },
  [ACTIVITY_TYPES.USER_CREATED]: {
    title: 'User created',
    description: 'New user added to system',
  },
  [ACTIVITY_TYPES.USER_UPDATED]: {
    title: 'User updated',
    description: 'User profile modified',
  },
  [ACTIVITY_TYPES.USER_DELETED]: {
    title: 'User deleted',
    description: 'User removed from system',
  },
  [ACTIVITY_TYPES.USER_INVITED]: {
    title: 'User invited',
    description: 'Invitation sent to user',
  },
  [ACTIVITY_TYPES.USER_ROLE_CHANGED]: {
    title: 'User role changed',
    description: 'User roles updated',
  },
  [ACTIVITY_TYPES.ROLE_CREATED]: {
    title: 'Role created',
    description: 'New role added',
  },
  [ACTIVITY_TYPES.ROLE_UPDATED]: {
    title: 'Role updated',
    description: 'Role modified',
  },
  [ACTIVITY_TYPES.ROLE_DELETED]: {
    title: 'Role deleted',
    description: 'Role removed',
  },
  [ACTIVITY_TYPES.PERMISSION_GRANTED]: {
    title: 'Permission granted',
    description: 'Permission added',
  },
  [ACTIVITY_TYPES.PERMISSION_REVOKED]: {
    title: 'Permission revoked',
    description: 'Permission removed',
  },
  [ACTIVITY_TYPES.COMPANY_CREATED]: {
    title: 'Company created',
    description: 'New company registered',
  },
  [ACTIVITY_TYPES.COMPANY_UPDATED]: {
    title: 'Company updated',
    description: 'Company profile modified',
  },
  [ACTIVITY_TYPES.COMPANY_SETTINGS_CHANGED]: {
    title: 'Company settings changed',
    description: 'Company configuration updated',
  },
  [ACTIVITY_TYPES.CUSTOM]: {
    title: 'Activity logged',
    description: 'Custom activity recorded',
  },
} as const;
