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
  Sparkles,
  Building,
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
        roles: [
          'Super Admin',
          'Admin',
          'Project Manager',
          'Team Lead',
          'Developer',
          'HR',
          'Finance',
        ],
        permission: { resource: 'dashboard', action: 'read' },
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
        disabled: false,
        roles: ['Super Admin', 'Admin'],
        submenu: [
          { label: 'Contacts', href: '/dashboard/crm/contacts' },
          { label: 'Accounts', href: '/dashboard/crm/accounts' },
          { label: 'Deals', href: '/dashboard/crm/deals' },
        ],
      },
      {
        id: 'clients',
        label: 'Clients',
        icon: Building,
        href: '/clients',
        badge: 'M6',
        disabled: false,
        roles: [
          'Super Admin',
          'Admin',
          'Project Manager',
          'Team Lead',
          'Developer',
          'HR',
          'Finance',
        ],
      },
      {
        id: 'projects',
        label: 'Projects',
        icon: Briefcase,
        href: '/dashboard/projects',
        badge: null,
        disabled: false,
        roles: ['Super Admin', 'Admin', 'Project Manager'],
      },
      {
        id: 'tasks',
        label: 'Tasks',
        icon: CheckSquare,
        href: '/dashboard/tasks',
        badge: null,
        disabled: false,
        roles: ['Super Admin', 'Admin', 'Project Manager', 'Team Lead', 'Developer'],
      },
      {
        id: 'finance',
        label: 'Finance',
        icon: DollarSign,
        href: '/dashboard/finance',
        badge: null,
        disabled: false,
        roles: ['Super Admin', 'Admin', 'Finance'],
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
        disabled: false,
        roles: ['Super Admin', 'Admin', 'HR'],
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
        disabled: false,
        roles: ['Super Admin', 'Admin'],
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
        badge: null,
        disabled: false,
        roles: ['Super Admin', 'Admin'],
        permission: { resource: 'dashboard', action: 'read' },
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        href: '/dashboard/settings',
        badge: null,
        disabled: false,
        roles: ['Super Admin', 'Admin'],
        permission: { resource: 'settings', action: 'read' },
      },
      {
        id: 'roles',
        label: 'Roles & Access',
        icon: ShieldCheck,
        href: '/dashboard/roles',
        badge: null,
        disabled: false,
        roles: ['Super Admin', 'Admin'],
        permission: { resource: 'roles', action: 'read' },
      },
      {
        id: 'design-system',
        label: 'Design System',
        icon: Sparkles,
        href: '/dashboard/design-system',
        badge: 'M3',
        disabled: false,
        roles: [
          'Super Admin',
          'Admin',
          'Project Manager',
          'Team Lead',
          'Developer',
          'HR',
          'Finance',
        ],
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
  permission?: {
    resource: string;
    action: string;
  };
  submenu?: Array<{ label: string; href: string }>;
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};
