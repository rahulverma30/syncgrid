export const ROLE_NAMES = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  PROJECT_MANAGER: 'Project Manager',
  TEAM_LEAD: 'Team Lead',
  DEVELOPER: 'Developer',
  HR: 'HR',
  FINANCE: 'Finance',
} as const;

export const PERMISSION_ACTIONS = [
  'create',
  'read',
  'update',
  'delete',
  'export',
  'approve',
  'assign',
  'manage',
] as const;

export const PERMISSION_RESOURCES = [
  'dashboard',
  'company',
  'users',
  'roles',
  'permissions',
  'auditLogs',
  'activity',
  'settings',
  'auth',
  'api',
] as const;

export const DEFAULT_ROLE_PERMISSIONS = {
  [ROLE_NAMES.SUPER_ADMIN]: [{ resource: '*', actions: ['manage'] }],
  [ROLE_NAMES.ADMIN]: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'api', actions: ['read'] },
    { resource: 'company', actions: ['read', 'update'] },
    { resource: 'users', actions: ['create', 'read', 'update', 'assign'] },
    { resource: 'roles', actions: ['read', 'assign'] },
    { resource: 'permissions', actions: ['read'] },
    { resource: 'auditLogs', actions: ['read', 'export'] },
    { resource: 'settings', actions: ['read', 'update'] },
  ],
  [ROLE_NAMES.PROJECT_MANAGER]: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'api', actions: ['read'] },
    { resource: 'users', actions: ['read', 'assign'] },
    { resource: 'activity', actions: ['read'] },
  ],
  [ROLE_NAMES.TEAM_LEAD]: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'api', actions: ['read'] },
    { resource: 'users', actions: ['read', 'assign'] },
  ],
  [ROLE_NAMES.DEVELOPER]: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'api', actions: ['read'] },
  ],
  [ROLE_NAMES.HR]: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'api', actions: ['read'] },
    { resource: 'users', actions: ['create', 'read', 'update', 'export'] },
  ],
  [ROLE_NAMES.FINANCE]: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'api', actions: ['read'] },
    { resource: 'auditLogs', actions: ['read'] },
  ],
} as const;

export const AUTH_PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
] as const;
