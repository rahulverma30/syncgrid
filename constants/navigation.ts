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
  ShieldCheck,
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
        roles: ['owner', 'admin', 'member'],
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
        badge: 'Soon',
        disabled: true,
        roles: ['owner', 'admin', 'sales'],
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
        badge: 'Soon',
        disabled: true,
        roles: ['owner', 'admin', 'member'],
      },
      {
        id: 'tasks',
        label: 'Tasks',
        icon: CheckSquare,
        href: '/dashboard/tasks',
        badge: 'Soon',
        disabled: true,
        roles: ['owner', 'admin', 'member'],
      },
      {
        id: 'finance',
        label: 'Finance',
        icon: DollarSign,
        href: '/dashboard/finance',
        badge: 'Soon',
        disabled: true,
        roles: ['owner', 'finance'],
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
        badge: 'Soon',
        disabled: true,
        roles: ['owner', 'hr'],
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
        badge: 'Soon',
        disabled: true,
        roles: ['owner', 'admin'],
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
        badge: 'Soon',
        disabled: true,
        roles: ['owner', 'admin', 'member'],
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        href: '/dashboard/settings',
        badge: 'Soon',
        disabled: true,
        roles: ['owner', 'admin'],
      },
      {
        id: 'roles',
        label: 'Roles & Access',
        icon: ShieldCheck,
        href: '/dashboard/roles',
        badge: 'Soon',
        disabled: true,
        roles: ['owner', 'admin'],
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
  disabled?: boolean;
  roles?: string[];
  submenu?: Array<{ label: string; href: string }>;
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};
