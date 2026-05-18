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
    PROFILE: '/profile',
    SETTINGS: '/settings',

    // CRM Module (future)
    CRM: '/crm',
    CRM_CONTACTS: '/crm/contacts',
    CRM_ACCOUNTS: '/crm/accounts',
    CRM_DEALS: '/crm/deals',

    // Projects Module (future)
    PROJECTS: '/projects',

    // Tasks Module (future)
    TASKS: '/tasks',

    // Finance Module (future)
    FINANCE: '/finance',
    FINANCE_INVOICES: '/finance/invoices',
    FINANCE_EXPENSES: '/finance/expenses',

    // HR Module (future)
    HR: '/hr',
    HR_EMPLOYEES: '/hr/employees',
    HR_PAYROLL: '/hr/payroll',

    // Analytics Module (future)
    ANALYTICS: '/analytics',
  },
} as const;

export type Routes = typeof ROUTES;
