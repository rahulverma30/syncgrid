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
  MessageSquare,
  Clock,
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
      {
        id: 'attendance',
        label: 'My Attendance',
        icon: Clock,
        href: '/attendance',
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
        href: '/crm',
        badge: null,
        disabled: false,
        roles: ['Super Admin', 'Admin'],
        permission: { resource: 'crm', action: 'read' },
        submenu: [
          { label: 'Contacts', href: '/crm/contacts' },
          { label: 'Accounts', href: '/crm/accounts' },
          { label: 'Deals', href: '/crm/deals' },
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
        permission: { resource: 'clients', action: 'read' },
      },
      {
        id: 'projects',
        label: 'Projects',
        icon: Briefcase,
        href: '/projects',
        badge: null,
        disabled: false,
        roles: ['Super Admin', 'Admin', 'Project Manager'],
        permission: { resource: 'projects', action: 'read' },
      },
      {
        id: 'tasks',
        label: 'Tasks',
        icon: CheckSquare,
        href: '/tasks',
        badge: null,
        disabled: false,
        roles: ['Super Admin', 'Admin', 'Project Manager', 'Team Lead', 'Developer'],
        permission: { resource: 'tasks', action: 'read' },
      },
      {
        id: 'finance',
        label: 'Finance',
        icon: DollarSign,
        href: '/finance',
        badge: null,
        disabled: false,
        roles: ['Super Admin', 'Admin', 'Finance'],
        permission: { resource: 'finance', action: 'read' },
        submenu: [
          { label: 'Invoices', href: '/finance/invoices' },
          { label: 'Expenses', href: '/finance/expenses' },
        ],
      },
      {
        id: 'hr',
        label: 'HR',
        icon: Users,
        href: '/hr',
        badge: null,
        disabled: false,
        roles: ['Super Admin', 'Admin', 'HR'],
        permission: { resource: 'hr', action: 'read' },
        submenu: [
          { label: 'Employees', href: '/hr/employees' },
          { label: 'Payroll', href: '/hr/payroll' },
        ],
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: TrendingUp,
        href: '/analytics',
        badge: null,
        disabled: false,
        roles: ['Super Admin', 'Admin'],
        permission: { resource: 'analytics', action: 'read' },
      },
      {
        id: 'collaboration',
        label: 'Collaboration',
        icon: MessageSquare,
        href: '/collaboration',
        badge: 'M13',
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
        permission: { resource: 'clients', action: 'read' },
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
        href: '/notifications',
        badge: null,
        disabled: false,
        roles: ['Super Admin', 'Admin'],
        permission: { resource: 'dashboard', action: 'read' },
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        href: '/settings',
        badge: null,
        disabled: false,
        roles: ['Super Admin', 'Admin'],
        permission: { resource: 'settings', action: 'read' },
      },
      {
        id: 'roles',
        label: 'Roles & Access',
        icon: ShieldCheck,
        href: '/roles',
        badge: null,
        disabled: false,
        roles: ['Super Admin', 'Admin'],
        permission: { resource: 'roles', action: 'read' },
      },
      // {
      //   id: 'design-system',
      //   label: 'Design System',
      //   icon: Sparkles,
      //   href: '/design-system',
      //   badge: 'M3',
      //   disabled: false,
      //   roles: [
      //     'Super Admin',
      //     'Admin',
      //     'Project Manager',
      //     'Team Lead',
      //     'Developer',
      //     'HR',
      //     'Finance',
      //   ],
      // },
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
