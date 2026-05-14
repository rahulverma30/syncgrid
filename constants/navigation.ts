/**
 * Navigation configuration for sidebar and breadcrumbs
 * Defines navigation structure, icons, and roles
 */

import {
  LayoutDashboard,
  Users,
  Briefcase,
  CheckSquare,
  DollarSign,
  TrendingUp,
  Settings,
  Bell,
  LogOut,
} from 'lucide-react';

export const SIDEBAR_GROUPS = [
  {
    id: 'core',
    label: 'Core',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        href: '/dashboard',
        badge: null,
      },
    ],
  },
  {
    id: 'modules',
    label: 'Business Modules',
    items: [
      {
        id: 'crm',
        label: 'CRM',
        icon: Users,
        href: '/dashboard/crm',
        badge: null,
        submenu: [
          { label: 'Contacts', href: '/dashboard/crm/contacts' },
          { label: 'Accounts', href: '/dashboard/crm/accounts' },
          { label: 'Deals', href: '/dashboard/crm/deals' },
        ],
      },
      {
        id: 'projects',
        label: 'Projects',
        icon: Briefcase,
        href: '/dashboard/projects',
        badge: null,
      },
      {
        id: 'tasks',
        label: 'Tasks',
        icon: CheckSquare,
        href: '/dashboard/tasks',
        badge: null,
      },
      {
        id: 'finance',
        label: 'Finance',
        icon: DollarSign,
        href: '/dashboard/finance',
        badge: null,
        submenu: [
          { label: 'Invoices', href: '/dashboard/finance/invoices' },
          { label: 'Expenses', href: '/dashboard/finance/expenses' },
        ],
      },
      {
        id: 'hr',
        label: 'HR',
        icon: Users,
        href: '/dashboard/hr',
        badge: null,
        submenu: [
          { label: 'Employees', href: '/dashboard/hr/employees' },
          { label: 'Payroll', href: '/dashboard/hr/payroll' },
        ],
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: TrendingUp,
        href: '/dashboard/analytics',
        badge: null,
      },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      {
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        href: '/dashboard/notifications',
        badge: '3',
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        href: '/dashboard/settings',
        badge: null,
      },
    ],
  },
];

export const HEADER_ACTIONS = [
  {
    id: 'logout',
    label: 'Logout',
    icon: LogOut,
    action: 'logout',
  },
];

export type NavItem = {
  id: string;
  label: string;
  icon: any;
  href: string;
  badge?: string | null;
  submenu?: Array<{ label: string; href: string }>;
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};
