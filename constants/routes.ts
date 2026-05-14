/**
 * Application route constants
 * Centralized route management for type-safe navigation
 */

export const ROUTES = {
  // Public routes
  HOME: '/',

  // Auth routes
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
  },

  // Dashboard routes (future modules)
  DASHBOARD: {
    HOME: '/dashboard',
    PROFILE: '/dashboard/profile',
    SETTINGS: '/dashboard/settings',

    // CRM Module (future)
    CRM: '/dashboard/crm',
    CRM_CONTACTS: '/dashboard/crm/contacts',
    CRM_ACCOUNTS: '/dashboard/crm/accounts',
    CRM_DEALS: '/dashboard/crm/deals',

    // Projects Module (future)
    PROJECTS: '/dashboard/projects',

    // Tasks Module (future)
    TASKS: '/dashboard/tasks',

    // Finance Module (future)
    FINANCE: '/dashboard/finance',
    FINANCE_INVOICES: '/dashboard/finance/invoices',
    FINANCE_EXPENSES: '/dashboard/finance/expenses',

    // HR Module (future)
    HR: '/dashboard/hr',
    HR_EMPLOYEES: '/dashboard/hr/employees',
    HR_PAYROLL: '/dashboard/hr/payroll',

    // Analytics Module (future)
    ANALYTICS: '/dashboard/analytics',
  },
} as const;

export type Routes = typeof ROUTES;
