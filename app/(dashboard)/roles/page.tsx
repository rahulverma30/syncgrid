'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Select } from '@/components/ui';
import { PERMISSION_RESOURCES } from '@/constants/rbac';

import {
  ShieldCheck,
  Plus,
  Trash2,
  Lock,
  Search,
  CheckCircle,
  HelpCircle,
  FolderLock,
  Users,
  GitFork,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Info,
  Layers,
  Copy,
  ChevronRight,
  ChevronDown,
  UserCheck,
  Network,
  ArrowLeft,
  ArrowRight,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

interface PermissionObj {
  _id: string;
  key: string;
  resource: string;
  action: string;
  description: string;
  module: string;
  category: string;
}

interface RoleObj {
  _id: string;
  name: string;
  slug: string;
  description: string;
  companyId: string | null;
  permissions: PermissionObj[] | string[];
  inheritedRoles: RoleObj[] | string[];
  hierarchyLevel: number;
  isSystem: boolean;
  isSystemRole?: boolean;
}

interface PolicyObj {
  _id: string;
  name: string;
  resource: string;
  actions: string[];
  conditions: any;
  effect: 'allow' | 'deny';
  priority: number;
  enabled: boolean;
  companyId: string | null;
}

// 8 click-to-fill archetype cards configuration
const ROLE_TEMPLATES = [
  {
    name: 'Super Administrator',
    description:
      'Enterprise-grade authorization tier granting full administrative privileges across all tenant modules.',
    hierarchyLevel: 1,
    perms: [
      'crm:read',
      'crm:create',
      'crm:update',
      'crm:delete',
      'crm:manage',
      'projects:read',
      'projects:create',
      'projects:update',
      'projects:update:any',
      'projects:delete',
      'projects:manage',
      'hr:read',
      'hr:create',
      'hr:update',
      'hr:delete',
      'hr:manage',
      'finance:read',
      'finance:create',
      'finance:update',
      'finance:delete',
      'finance:manage',
      'settings:read',
      'settings:update',
      'settings:manage',
      'collaboration:read',
      'collaboration:create',
      'collaboration:manage',
      'analytics:read',
      'analytics:manage',
    ],
    gradient: 'from-rose-500/20 via-pink-500/10 to-transparent',
    border: 'border-rose-500/35 text-rose-400',
  },
  {
    name: 'Software Developer',
    description:
      'Technical clearance role tailored for creating, managing, and resolving development milestone pipelines.',
    hierarchyLevel: 20,
    perms: [
      'projects:read',
      'projects:create',
      'projects:update',
      'collaboration:read',
      'collaboration:create',
    ],
    gradient: 'from-blue-500/20 via-indigo-500/10 to-transparent',
    border: 'border-blue-500/35 text-blue-400',
  },
  {
    name: 'Project Manager',
    description:
      'Supervises team projects, milestone schedules, analytics tracking, and cross-channel collaboration.',
    hierarchyLevel: 10,
    perms: [
      'projects:read',
      'projects:create',
      'projects:update',
      'projects:update:any',
      'projects:delete',
      'projects:manage',
      'collaboration:read',
      'collaboration:create',
      'analytics:read',
    ],
    gradient: 'from-purple-500/20 via-fuchsia-500/10 to-transparent',
    border: 'border-purple-500/35 text-purple-400',
  },
  {
    name: 'HR Specialist',
    description:
      'Manages enterprise talent onboarding, specialist directory settings, and compensation/leave policies.',
    hierarchyLevel: 12,
    perms: ['hr:read', 'hr:create', 'hr:update', 'hr:delete', 'hr:manage', 'collaboration:read'],
    gradient: 'from-pink-500/20 via-rose-500/10 to-transparent',
    border: 'border-pink-500/35 text-pink-400',
  },
  {
    name: 'Financial Controller',
    description:
      'Clears audit restrictions for ledger logs, invoice processing, billing cycles, and Stripe configurations.',
    hierarchyLevel: 15,
    perms: [
      'finance:read',
      'finance:create',
      'finance:update',
      'finance:delete',
      'finance:manage',
      'analytics:read',
    ],
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    border: 'border-emerald-500/35 text-emerald-400',
  },
  {
    name: 'Sales Executive',
    description:
      'Tailored clearance for CRM leads management, deals negotiation, and transaction logging.',
    hierarchyLevel: 25,
    perms: ['crm:read', 'crm:create', 'crm:update', 'collaboration:read', 'collaboration:create'],
    gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    border: 'border-amber-500/35 text-amber-400',
  },
  {
    name: 'Customer Support',
    description:
      'Assigned to client relationship management pipelines, workspace communications, and feedback queues.',
    hierarchyLevel: 30,
    perms: ['crm:read', 'crm:update', 'collaboration:read', 'collaboration:create'],
    gradient: 'from-teal-500/20 via-cyan-500/10 to-transparent',
    border: 'border-teal-500/35 text-teal-400',
  },
  {
    name: 'Enterprise Client Partner',
    description:
      'External clearance permitting read-only access to scoped projects, support channels, and invoices.',
    hierarchyLevel: 100,
    perms: ['projects:read', 'collaboration:read', 'finance:read'],
    gradient: 'from-cyan-500/20 via-sky-500/10 to-transparent',
    border: 'border-cyan-500/35 text-cyan-400',
  },
];

// Progressive disclosure toggles schema
const BASIC_TOGGLES = [
  {
    category: 'CRM',
    label: 'CRM Operations Clearances',
    options: [
      { level: 'none', label: 'No Access', perms: [] },
      { level: 'read', label: 'Viewer (Read-only leads & pipelines)', perms: ['crm:read'] },
      {
        level: 'write',
        label: 'Manager (Create & edit CRM profiles)',
        perms: ['crm:read', 'crm:create', 'crm:update', 'crm:delete'],
      },
      {
        level: 'admin',
        label: 'Administrator (Supervise sales & budgets)',
        perms: ['crm:read', 'crm:create', 'crm:update', 'crm:delete', 'crm:manage'],
      },
    ],
  },
  {
    category: 'Projects',
    label: 'Project Engineering Clearances',
    options: [
      { level: 'none', label: 'No Access', perms: [] },
      { level: 'read', label: 'Viewer (Read-only projects & boards)', perms: ['projects:read'] },
      {
        level: 'write',
        label: 'Manager (Manage deliverables & milestones)',
        perms: ['projects:read', 'projects:create', 'projects:update', 'projects:delete'],
      },
      {
        level: 'admin',
        label: 'Administrator (Full project governance & budgets)',
        perms: [
          'projects:read',
          'projects:create',
          'projects:update',
          'projects:update:any',
          'projects:delete',
          'projects:manage',
        ],
      },
    ],
  },
  {
    category: 'HR',
    label: 'Human Resources Clearances',
    options: [
      { level: 'none', label: 'No Access', perms: [] },
      { level: 'read', label: 'Viewer (Read specialists & departments)', perms: ['hr:read'] },
      {
        level: 'write',
        label: 'Manager (Onboard & manage employee statuses)',
        perms: ['hr:read', 'hr:create', 'hr:update', 'hr:delete'],
      },
      {
        level: 'admin',
        label: 'Administrator (Full employee compensations & policies)',
        perms: ['hr:read', 'hr:create', 'hr:update', 'hr:delete', 'hr:manage'],
      },
    ],
  },
  {
    category: 'Finance',
    label: 'Ledgers & Invoice Clearances',
    options: [
      { level: 'none', label: 'No Access', perms: [] },
      {
        level: 'read',
        label: 'Viewer (View invoices & transaction logs)',
        perms: ['finance:read'],
      },
      {
        level: 'write',
        label: 'Manager (Draft & reconcile billing transactions)',
        perms: ['finance:read', 'finance:create', 'finance:update', 'finance:delete'],
      },
      {
        level: 'admin',
        label: 'Administrator (Configure gateway billing overrides)',
        perms: [
          'finance:read',
          'finance:create',
          'finance:update',
          'finance:delete',
          'finance:manage',
        ],
      },
    ],
  },
  {
    category: 'Collaboration',
    label: 'Workspace Communication Clearances',
    options: [
      { level: 'none', label: 'No Access', perms: [] },
      { level: 'read', label: 'Viewer (Access & chat in channels)', perms: ['collaboration:read'] },
      {
        level: 'write',
        label: 'Manager (Create channels & threads)',
        perms: ['collaboration:read', 'collaboration:create'],
      },
      {
        level: 'admin',
        label: 'Administrator (Moderate channels & chat parameters)',
        perms: ['collaboration:read', 'collaboration:create', 'collaboration:manage'],
      },
    ],
  },
  {
    category: 'Analytics',
    label: 'Intelligence & BI Clearances',
    options: [
      { level: 'none', label: 'No Access', perms: [] },
      { level: 'read', label: 'Viewer (Access standard dashboards)', perms: ['analytics:read'] },
      {
        level: 'admin',
        label: 'Administrator (Configure enterprise BI analytics schemas)',
        perms: ['analytics:read', 'analytics:manage'],
      },
    ],
  },
  {
    category: 'Settings',
    label: 'System Parameter Clearances',
    options: [
      { level: 'none', label: 'No Access', perms: [] },
      { level: 'read', label: 'Viewer (View system configurations)', perms: ['settings:read'] },
      {
        level: 'write',
        label: 'Manager (Modify standard configs)',
        perms: ['settings:read', 'settings:update'],
      },
      {
        level: 'admin',
        label: 'Administrator (Control gateway portals & tenant keys)',
        perms: ['settings:read', 'settings:update', 'settings:manage'],
      },
    ],
  },
];

// Business Translation Mapper
const translatePermissionKey = (key: string, description: string) => {
  const k = key.toLowerCase();
  if (k === 'crm:read') return 'View CRM Pipeline & Leads';
  if (k === 'crm:create') return 'Create CRM Leads & Pipelines';
  if (k === 'crm:update') return 'Edit CRM Lead & Pipeline Information';
  if (k === 'crm:delete') return 'Remove CRM Lead & Pipeline Records';
  if (k === 'crm:manage') return 'Supervise CRM Sales Operations & Assignments';

  if (k === 'projects:read') return 'View Projects & Milestones';
  if (k === 'projects:create') return 'Create New Projects & Milestones';
  if (k === 'projects:update') return 'Edit Projects & Milestones';
  if (k === 'projects:update:any') return 'Modify Any Enterprise Project';
  if (k === 'projects:delete') return 'Archive Projects & Milestones';
  if (k === 'projects:manage') return 'Approve Project Budgets & Deliverables';

  if (k === 'hr:read') return 'View Colleagues Profiles & Contacts';
  if (k === 'hr:create') return 'Onboard New Workspace Specialists';
  if (k === 'hr:update') return 'Update Employee Profiles & Statuses';
  if (k === 'hr:delete') return 'Offboard Workspace Specialists';
  if (k === 'hr:manage') return 'Manage Employee Compensation & Leaves';

  if (k === 'finance:read') return 'View Invoices & Transaction History';
  if (k === 'finance:create') return 'Draft Invoices & Log Expenditures';
  if (k === 'finance:update') return 'Reconcile Invoices & Transactions';
  if (k === 'finance:delete') return 'Revoke Draft Invoices & Transactions';
  if (k === 'finance:manage') return 'Supervise Stripe Integrations & Billing';

  if (k === 'settings:read') return 'View Workspace Configurations';
  if (k === 'settings:update') return 'Modify General Tenant System Parameters';
  if (k === 'settings:manage') return 'Configure System Gateways & Security';

  if (k === 'collaboration:read') return 'Access Channels & Workspace Chats';
  if (k === 'collaboration:create') return 'Create Channels & Direct Messages';
  if (k === 'collaboration:manage') return 'Moderate Channels & Chats';

  if (k === 'analytics:read') return 'View Performance Dashboards';
  if (k === 'analytics:manage') return 'Deploy Custom Business BI Models';

  const parts = key.split(':');
  if (parts.length >= 2) {
    const resource = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    const action = parts.slice(1).join(' ').toUpperCase();
    return `${action} Privilege inside ${resource}`;
  }
  return description || key;
};

export default function RolesAndAuthorizationPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [activeTab, setActiveTab] = useState<'roles' | 'policies' | 'assignments'>('roles');
  const [loading, setLoading] = useState(true);

  // Core Data States
  const [roles, setRoles] = useState<RoleObj[]>([]);
  const [permissions, setPermissions] = useState<PermissionObj[]>([]);
  const [policies, setPolicies] = useState<PolicyObj[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Selection & Modal States
  const [selectedRole, setSelectedRole] = useState<RoleObj | null>(null);
  const [searchPermissionQuery, setSearchPermissionQuery] = useState('');
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [isCreatingPolicy, setIsCreatingPolicy] = useState(false);
  const [viewMode, setViewMode] = useState<'basic' | 'advanced'>('basic');
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    CRM: true,
    Projects: true,
    HR: false,
    Finance: false,
    Collaboration: false,
    Analytics: false,
    Settings: false,
    General: false,
  });

  // New Custom Role Builder Form State
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleHierarchy, setNewRoleHierarchy] = useState(10);
  const [newRoleInherits, setNewRoleInherits] = useState<string[]>([]);

  // Advanced Security Mode & Step Wizard State
  const [advancedMode, setAdvancedMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);
  const [enabledModules, setEnabledModules] = useState<string[]>([]);
  const [moduleAccessLevels, setModuleAccessLevels] = useState<
    Record<string, 'none' | 'read' | 'edit' | 'manage' | 'admin'>
  >({});

  const newRolePermissionIds = useMemo(() => {
    let allKeys: string[] = [];
    enabledModules.forEach((modName) => {
      const level = moduleAccessLevels[modName] || 'read';
      const keys = getPermissionKeysForLevel(modName, level);
      allKeys = [...allKeys, ...keys];
    });

    return allKeys
      .map((key) => permissions.find((p) => p.key === key)?._id)
      .filter(Boolean) as string[];
  }, [enabledModules, moduleAccessLevels, permissions]);

  // Populate wizard selections from permission keys list
  const populateLevelsFromPerms = (permsList: string[]) => {
    const modules: string[] = [];
    const levels: Record<string, 'none' | 'read' | 'edit' | 'manage' | 'admin'> = {};
    const availableModules = [
      'CRM',
      'Projects',
      'HR',
      'Finance',
      'Collaboration',
      'Analytics',
      'Settings',
    ];

    availableModules.forEach((mod) => {
      const m = mod.toLowerCase();
      const hasRead = permsList.includes(`${m}:read`);
      const hasCreate = permsList.includes(`${m}:create`);
      const hasUpdate = permsList.includes(`${m}:update`);
      const hasDelete = permsList.includes(`${m}:delete`);
      const hasManage =
        permsList.includes(`${m}:manage`) ||
        permsList.includes(`${m}:admin`) ||
        (m === 'projects' && permsList.includes('projects:manage'));

      let level: 'none' | 'read' | 'edit' | 'manage' | 'admin' = 'none';
      if (hasManage) level = 'admin';
      else if (hasDelete) level = 'manage';
      else if (hasCreate || hasUpdate) level = 'edit';
      else if (hasRead) level = 'read';

      if (level !== 'none') {
        modules.push(mod);
        levels[mod] = level;
      }
    });

    setEnabledModules(modules);
    setModuleAccessLevels(levels);
  };

  // Helper mapping access level keys
  const getPermissionKeysForLevel = (
    moduleName: string,
    level: 'none' | 'read' | 'edit' | 'manage' | 'admin'
  ) => {
    const m = moduleName.toLowerCase();
    if (level === 'none') return [];
    if (m === 'crm') {
      if (level === 'read') return ['crm:read'];
      if (level === 'edit') return ['crm:read', 'crm:create', 'crm:update'];
      if (level === 'manage') return ['crm:read', 'crm:create', 'crm:update', 'crm:delete'];
      if (level === 'admin')
        return ['crm:read', 'crm:create', 'crm:update', 'crm:delete', 'crm:manage'];
    }
    if (m === 'projects') {
      if (level === 'read') return ['projects:read'];
      if (level === 'edit') return ['projects:read', 'projects:create', 'projects:update'];
      if (level === 'manage')
        return ['projects:read', 'projects:create', 'projects:update', 'projects:delete'];
      if (level === 'admin')
        return [
          'projects:read',
          'projects:create',
          'projects:update',
          'projects:update:any',
          'projects:delete',
          'projects:manage',
        ];
    }
    if (m === 'hr') {
      if (level === 'read') return ['hr:read'];
      if (level === 'edit') return ['hr:read', 'hr:create', 'hr:update'];
      if (level === 'manage') return ['hr:read', 'hr:create', 'hr:update', 'hr:delete'];
      if (level === 'admin') return ['hr:read', 'hr:create', 'hr:update', 'hr:delete', 'hr:manage'];
    }
    if (m === 'finance') {
      if (level === 'read') return ['finance:read'];
      if (level === 'edit') return ['finance:read', 'finance:create', 'finance:update'];
      if (level === 'manage')
        return ['finance:read', 'finance:create', 'finance:update', 'finance:delete'];
      if (level === 'admin')
        return [
          'finance:read',
          'finance:create',
          'finance:update',
          'finance:delete',
          'finance:manage',
        ];
    }
    if (m === 'collaboration') {
      if (level === 'read') return ['collaboration:read'];
      if (level === 'edit') return ['collaboration:read', 'collaboration:create'];
      if (level === 'manage') return ['collaboration:read', 'collaboration:create'];
      if (level === 'admin')
        return ['collaboration:read', 'collaboration:create', 'collaboration:manage'];
    }
    if (m === 'analytics') {
      if (level === 'read') return ['analytics:read'];
      if (level === 'edit') return ['analytics:read'];
      if (level === 'manage') return ['analytics:read'];
      if (level === 'admin') return ['analytics:read', 'analytics:manage'];
    }
    if (m === 'settings') {
      if (level === 'read') return ['settings:read'];
      if (level === 'edit') return ['settings:read', 'settings:update'];
      if (level === 'manage') return ['settings:read', 'settings:update'];
      if (level === 'admin') return ['settings:read', 'settings:update', 'settings:manage'];
    }
    return [`${m}:read`];
  };

  // New Dynamic Policy Form State
  const [newPolicyName, setNewPolicyName] = useState('');
  const [newPolicyResource, setNewPolicyResource] = useState('tasks');
  const [newPolicyActions, setNewPolicyActions] = useState<string[]>(['read']);
  const [newPolicyEffect, setNewPolicyEffect] = useState<'allow' | 'deny'>('allow');
  const [newPolicyConditionJson, setNewPolicyConditionJson] = useState('{\n  "isOwner": true\n}');

  const fetchCoreData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Roles
      const rRes = await fetch('/api/protected/roles');
      const rData = await rRes.json();
      if (rData.success) setRoles(rData.data);

      // 2. Fetch Permissions
      const pRes = await fetch('/api/protected/permissions');
      const pData = await pRes.json();
      if (pData.success) setPermissions(pData.data);

      // 3. Fetch Policies
      const polRes = await fetch('/api/protected/policies');
      const polData = await polRes.json();
      if (polData.success) setPolicies(polData.data);

      // 4. Fetch Users (Members list)
      const uRes = await fetch('/api/protected/hr');
      const uData = await uRes.json();
      if (uData.success) {
        setUsers(uData.data || []);
      }
    } catch (err) {
      toast.error('Failed to resolve enterprise access contexts.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFetchedRef = useRef(false);
  useEffect(() => {
    if (fetchFetchedRef.current) return;
    fetchFetchedRef.current = true;
    fetchCoreData();
  }, []);

  // --- ROLE ACTIONS ---
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName) return toast.error('Role name is required.');

    try {
      const res = await fetch('/api/protected/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoleName,
          description: newRoleDesc,
          hierarchyLevel: newRoleHierarchy,
          permissionIds: newRolePermissionIds,
          inheritedRoleIds: newRoleInherits,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Role "${newRoleName}" created successfully.`);
        setIsCreatingRole(false);
        setNewRoleName('');
        setNewRoleDesc('');
        setNewRoleHierarchy(10);
        setEnabledModules([]);
        setModuleAccessLevels({});
        setNewRoleInherits([]);
        fetchCoreData();
      } else {
        toast.error(data.message || 'Creation rejected.');
      }
    } catch (err) {
      toast.error('Communication error.');
    }
  };

  const handleUpdateRolePermissions = async (
    roleId: string,
    updatedPermIds: string[],
    inheritedIds: string[]
  ) => {
    try {
      const res = await fetch(`/api/protected/roles/${roleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissionIds: updatedPermIds,
          inheritedRoleIds: inheritedIds,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Matrix modifications persisted successfully.');
        fetchCoreData();
      } else {
        toast.error(data.message || 'Failed updating permissions');
      }
    } catch (err) {
      toast.error('Network sync failure');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to permanently delete this custom role?')) return;

    try {
      const res = await fetch(`/api/protected/roles/${roleId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Role deleted successfully.');
        setSelectedRole(null);
        fetchCoreData();
      } else {
        toast.error(data.message || 'Deletion rejected.');
      }
    } catch (err) {
      toast.error('Network sync failure.');
    }
  };

  const handleCloneRole = (role: RoleObj) => {
    setNewRoleName(`${role.name} Copy`);
    setNewRoleDesc(`Clone of ${role.name}. ${role.description}`);
    setNewRoleHierarchy(role.hierarchyLevel + 1);

    const inheritedIds = (role.inheritedRoles || []).map((ir: any) =>
      typeof ir === 'string' ? ir : ir._id
    );

    setNewRoleInherits(inheritedIds);

    const permKeys = (role.permissions || [])
      .map((p: any) => {
        if (typeof p === 'string') {
          const found = permissions.find((perm) => perm._id === p);
          return found?.key || '';
        }
        return p?.key || '';
      })
      .filter(Boolean) as string[];
    populateLevelsFromPerms(permKeys);

    setIsCreatingRole(true);
    toast.info(`Cloned matrix configuration from "${role.name}".`);
  };

  const handleToggleCategoryPermissions = (
    categoryName: string,
    permsList: PermissionObj[],
    selectAll: boolean
  ) => {
    if (!selectedRole || selectedRole.isSystem) return;
    const currentRolePermIds = (selectedRole.permissions || []).map((p: any) =>
      typeof p === 'string' ? p : p._id
    );
    const categoryPermIds = permsList.map((p) => p._id);

    let nextPermIds: string[];
    if (selectAll) {
      nextPermIds = Array.from(new Set([...currentRolePermIds, ...categoryPermIds]));
    } else {
      nextPermIds = currentRolePermIds.filter((id) => !categoryPermIds.includes(id));
    }

    const inheritsIds = (selectedRole.inheritedRoles || []).map((ir: any) =>
      typeof ir === 'string' ? ir : ir._id
    );

    handleUpdateRolePermissions(selectedRole._id, nextPermIds, inheritsIds);
  };

  const handleSelectArchetype = (template: (typeof ROLE_TEMPLATES)[0]) => {
    setNewRoleName(template.name);
    setNewRoleDesc(template.description);
    setNewRoleHierarchy(template.hierarchyLevel);

    const matchedIds = template.perms
      .map((key) => permissions.find((p) => p.key === key)?._id)
      .filter(Boolean) as string[];

    toast.success(
      `Archetype "${template.name}" configured. ${matchedIds.length} permissions mapped!`
    );
  };

  const handleUpdateUserRole = async (memberId: string, newRoleId: string) => {
    try {
      const res = await fetch(`/api/protected/hr/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: newRoleId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Member clearance role updated successfully.');
        fetchCoreData();
      } else {
        toast.error(data.message || 'Failed to update member clearance.');
      }
    } catch (err) {
      toast.error('Network sync failure.');
    }
  };

  // --- POLICY ACTIONS ---
  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPolicyName) return toast.error('Policy name is required.');

    let conditions = {};
    try {
      conditions = JSON.parse(newPolicyConditionJson);
    } catch (err) {
      return toast.error('Invalid JSON structure in conditions field.');
    }

    try {
      const res = await fetch('/api/protected/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPolicyName,
          resource: newPolicyResource,
          actions: newPolicyActions,
          effect: newPolicyEffect,
          conditions,
          priority: 10,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`ABAC Policy "${newPolicyName}" deployed.`);
        setIsCreatingPolicy(false);
        setNewPolicyName('');
        setNewPolicyConditionJson('{\n  "isOwner": true\n}');
        fetchCoreData();
      } else {
        toast.error(data.message || 'Policy rejected.');
      }
    } catch (err) {
      toast.error('Communication error.');
    }
  };

  const handleTogglePolicy = async (policy: PolicyObj) => {
    try {
      const res = await fetch('/api/protected/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policyId: policy._id,
          enabled: !policy.enabled,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Policy "${policy.name}" ${!policy.enabled ? 'enabled' : 'disabled'}.`);
        fetchCoreData();
      } else {
        toast.error(data.message || 'Failed to toggle policy');
      }
    } catch (err) {
      toast.error('Network sync failure');
    }
  };

  const getBasicLevelForCategory = (categoryName: string, rolePermIds: string[]) => {
    const categoryLower = categoryName.toLowerCase();
    const toggleConfig = BASIC_TOGGLES.find((t) => t.category.toLowerCase() === categoryLower);
    if (!toggleConfig) return 'none';

    const adminPerms = toggleConfig.options.find((o) => o.level === 'admin')?.perms || [];
    const writePerms = toggleConfig.options.find((o) => o.level === 'write')?.perms || [];
    const readPerms = toggleConfig.options.find((o) => o.level === 'read')?.perms || [];

    const findIds = (keys: string[]) =>
      keys.map((k) => permissions.find((p) => p.key === k)?._id).filter(Boolean) as string[];

    const adminIds = findIds(adminPerms);
    const writeIds = findIds(writePerms);
    const readIds = findIds(readPerms);

    if (adminIds.length > 0 && adminIds.every((id) => rolePermIds.includes(id))) return 'admin';
    if (writeIds.length > 0 && writeIds.every((id) => rolePermIds.includes(id))) return 'write';
    if (readIds.length > 0 && readIds.every((id) => rolePermIds.includes(id))) return 'read';
    return 'none';
  };

  const handleUpdateBasicLevel = async (
    roleId: string,
    categoryName: string,
    newLevel: string,
    currentRolePermIds: string[],
    inheritedIds: string[]
  ) => {
    const categoryLower = categoryName.toLowerCase();
    const toggleConfig = BASIC_TOGGLES.find((t) => t.category.toLowerCase() === categoryLower);
    if (!toggleConfig) return;

    const categoryPerms = permissions.filter(
      (p) =>
        p.category?.toLowerCase() === categoryLower || p.module?.toLowerCase() === categoryLower
    );
    const categoryPermIds = categoryPerms.map((p) => p._id);

    let nextPermIds = currentRolePermIds.filter((id) => !categoryPermIds.includes(id));

    const option = toggleConfig.options.find((o) => o.level === newLevel);
    if (option && option.perms.length > 0) {
      const optionPermIds = option.perms
        .map((k) => permissions.find((p) => p.key === k)?._id)
        .filter(Boolean) as string[];
      nextPermIds = [...nextPermIds, ...optionPermIds];
    }

    handleUpdateRolePermissions(roleId, nextPermIds, inheritedIds);
  };

  // Helper: group permissions by Category / Module
  const groupedPermissions = React.useMemo(() => {
    const groups: Record<string, PermissionObj[]> = {};
    permissions.forEach((perm) => {
      const cat = perm.category || 'general';
      const normalizedCat = cat.charAt(0).toUpperCase() + cat.slice(1);
      if (!groups[normalizedCat]) groups[normalizedCat] = [];

      const isMatch =
        perm.key.includes(searchPermissionQuery.toLowerCase()) ||
        perm.description.toLowerCase().includes(searchPermissionQuery.toLowerCase());
      if (isMatch) {
        groups[normalizedCat].push(perm);
      }
    });

    // filter out empty categories
    return Object.fromEntries(Object.entries(groups).filter(([_, items]) => items.length > 0));
  }, [permissions, searchPermissionQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <LoaderSpinner />
        <p className="text-sm font-semibold text-muted-foreground animate-pulse">
          Loading enterprise security profiles...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
            IAM & Secure Governance
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent mt-2">
            Authorization & Roles
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
            Configure attribute-based policies (ABAC), fine-tune role permission scopes, establish
            hierarchical boundaries, and audit access parameters in real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Advanced Security Mode Toggle */}
          <div className="flex items-center gap-2 bg-muted/20 border border-border/60 px-3.5 py-1.5 rounded-2xl shadow-inner">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Advanced Security Mode
            </span>
            <button
              type="button"
              onClick={() => {
                const nextMode = !advancedMode;
                setAdvancedMode(nextMode);
                if (!nextMode && activeTab === 'policies') {
                  setActiveTab('roles');
                }
              }}
              className="text-primary hover:text-primary/95 transition-all focus:outline-none"
              title="Toggle JSON ABAC configurations & advanced system hierarchy parameters"
            >
              {advancedMode ? (
                <ToggleRight className="h-6 w-6 text-primary" />
              ) : (
                <ToggleLeft className="h-6 w-6 text-muted-foreground/60" />
              )}
            </button>
          </div>

          {activeTab === 'roles' && (
            <button
              onClick={() => {
                setIsCreatingRole(true);
                setCurrentStep(1);
                setSelectedArchetype(null);
                setEnabledModules([]);
                setModuleAccessLevels({});
                setNewRoleName('');
                setNewRoleDesc('');
                setNewRoleHierarchy(10);
                setSelectedRole(null);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_4px_20px_rgba(var(--primary-rgb),0.2)]"
            >
              <Plus className="h-4 w-4" />
              <span>Create Custom Role</span>
            </button>
          )}
          {activeTab === 'policies' && advancedMode && (
            <button
              onClick={() => setIsCreatingPolicy(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_4px_20px_rgba(var(--primary-rgb),0.2)]"
            >
              <Plus className="h-4 w-4" />
              <span>Deploy ABAC Policy</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-border/40">
        <button
          onClick={() => {
            setActiveTab('roles');
            setSelectedRole(null);
          }}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-xs font-bold transition-all ${
            activeTab === 'roles'
              ? 'border-primary text-primary font-extrabold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Roles & Matrix</span>
        </button>
        {advancedMode && (
          <button
            onClick={() => {
              setActiveTab('policies');
              setSelectedRole(null);
            }}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 text-xs font-bold transition-all ${
              activeTab === 'policies'
                ? 'border-primary text-primary font-extrabold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FolderLock className="h-4 w-4" />
            <span>Dynamic ABAC Policies</span>
          </button>
        )}
        <button
          onClick={() => {
            setActiveTab('assignments');
            setSelectedRole(null);
          }}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-xs font-bold transition-all ${
            activeTab === 'assignments'
              ? 'border-primary text-primary font-extrabold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Access Assignments</span>
        </button>
      </div>

      {/* --- TAB CONTENT AREA --- */}
      <div className="grid grid-cols-1 gap-6">
        {/* TAB 1: ROLES & MATRIX */}
        {activeTab === 'roles' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Roles Selection list */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Security Roles</span>
              </h3>
              <div className="space-y-3">
                {roles.map((role) => {
                  const isSelected = selectedRole?._id === role._id;
                  const permsCount = role.permissions?.length || 0;
                  const inheritsCount = role.inheritedRoles?.length || 0;

                  return (
                    <div
                      key={role._id}
                      onClick={() => {
                        setSelectedRole(role);
                        setIsCreatingRole(false);
                      }}
                      className={`group cursor-pointer rounded-2xl border p-4 transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? 'border-primary/50 bg-primary/5 shadow-lg'
                          : 'border-border/60 hover:border-border hover:bg-muted/10'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{role.name}</span>
                            {role.isSystem && (
                              <span className="text-[9px] font-bold uppercase bg-background border border-border text-muted-foreground px-1.5 py-0.5 rounded">
                                System
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {role.description || 'No description provided.'}
                          </p>
                        </div>
                        <ChevronRight
                          className={`h-4 w-4 text-muted-foreground/60 transition-transform ${isSelected && 'rotate-90 text-primary'}`}
                        />
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30 text-[10px] text-muted-foreground font-semibold">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            {permsCount} Rules
                          </span>
                          {inheritsCount > 0 && (
                            <span className="flex items-center gap-1 text-primary/80">
                              <GitFork className="h-3 w-3" />
                              Inherits {inheritsCount}
                            </span>
                          )}
                        </div>
                        <span className="bg-muted px-2 py-0.5 rounded-full text-foreground/80 font-bold">
                          Hierarchy {role.hierarchyLevel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Role Permissions Matrix Sheet */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence mode="wait">
                {selectedRole ? (
                  <motion.div
                    key={selectedRole._id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="rounded-3xl border border-border bg-card shadow-2xl overflow-hidden p-6 relative"
                  >
                    {/* Header operations */}
                    <div className="flex items-start justify-between border-b border-border/40 pb-5 mb-6">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold tracking-tight text-foreground">
                            {selectedRole.name} Matrix
                          </h2>
                          {selectedRole.isSystem && (
                            <span className="text-[9px] font-bold uppercase bg-background text-muted-foreground border border-border/60 px-2 py-0.5 rounded-full">
                              Immutable System Role
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 max-w-md">
                          {selectedRole.description ||
                            'Define granular module permissions and inheritance scopes.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCloneRole(selectedRole)}
                          className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                          title="Clone this Role Matrix"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        {!selectedRole.isSystem && (
                          <button
                            onClick={() => handleDeleteRole(selectedRole._id)}
                            className="p-2 rounded-lg border border-border hover:bg-rose-500/10 hover:border-rose-500/20 text-muted-foreground hover:text-rose-500 transition-all"
                            title="Delete custom role"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Role Hierarchy level editor & Inheritance selection */}
                    {advancedMode && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-background/20 border border-border/60 p-4 rounded-2xl">
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                            Role Hierarchy Level
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              disabled={selectedRole.isSystem}
                              defaultValue={selectedRole.hierarchyLevel}
                              onChange={async (e) => {
                                if (selectedRole.isSystem) return;
                                const val = Number(e.target.value);
                                try {
                                  await fetch(`/api/protected/roles/${selectedRole._id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ hierarchyLevel: val }),
                                  });
                                  toast.success(`Hierarchy shifted to level ${val}`);
                                  fetchCoreData();
                                } catch (err) {
                                  toast.error('Failed hierarchy update.');
                                }
                              }}
                              className="w-20 bg-background border border-border px-3 py-1.5 rounded-lg text-xs focus:outline-none"
                            />
                            <span className="text-[10px] text-muted-foreground">
                              (Lower numbers are superior)
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                            Inherits Permissions From
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {roles
                              .filter((r) => r._id !== selectedRole._id)
                              .map((r) => {
                                const currentInheritedIds = (selectedRole.inheritedRoles || []).map(
                                  (ir: any) => (typeof ir === 'string' ? ir : ir._id)
                                );
                                const isInherited = currentInheritedIds.includes(r._id);

                                return (
                                  <button
                                    key={r._id}
                                    disabled={selectedRole.isSystem}
                                    onClick={() => {
                                      if (selectedRole.isSystem) return;
                                      const nextInherits = isInherited
                                        ? currentInheritedIds.filter((id) => id !== r._id)
                                        : [...currentInheritedIds, r._id];

                                      const pIds = (selectedRole.permissions || []).map((p: any) =>
                                        typeof p === 'string' ? p : p._id
                                      );
                                      handleUpdateRolePermissions(
                                        selectedRole._id,
                                        pIds,
                                        nextInherits
                                      );
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                      isInherited
                                        ? 'bg-primary/20 border-primary/30 text-primary'
                                        : 'bg-background border-border text-muted-foreground hover:text-foreground'
                                    }`}
                                  >
                                    {r.name}
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* View Mode Pill Switcher */}
                    {advancedMode && (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-muted/20 border border-border/60 p-3 rounded-2xl mb-6 gap-3">
                        <div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                            Clearance Composition Mode
                          </span>
                          <span className="text-[9px] text-muted-foreground/80">
                            Toggle between business levels or custom granular scopes.
                          </span>
                        </div>
                        <div className="flex bg-background border border-border/50 rounded-xl p-0.5 self-stretch sm:self-auto justify-between">
                          <button
                            type="button"
                            onClick={() => setViewMode('basic')}
                            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              viewMode === 'basic'
                                ? 'bg-primary text-primary-foreground shadow'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Basic View</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewMode('advanced')}
                            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              viewMode === 'advanced'
                                ? 'bg-primary text-primary-foreground shadow'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <Layers className="h-3.5 w-3.5" />
                            <span>Advanced Matrix</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Progressive Disclosure Content Area */}
                    {!advancedMode || viewMode === 'basic' ? (
                      <div className="grid grid-cols-1 gap-4 max-h-[50vh] overflow-y-auto pr-2">
                        {BASIC_TOGGLES.map((toggle) => {
                          const currentRolePermIds = (selectedRole.permissions || []).map(
                            (p: any) => (typeof p === 'string' ? p : p._id)
                          );
                          const activeLevel = getBasicLevelForCategory(
                            toggle.category,
                            currentRolePermIds
                          );
                          const inheritedRoleIds = (selectedRole.inheritedRoles || []).map(
                            (ir: any) => (typeof ir === 'string' ? ir : ir._id)
                          );

                          return (
                            <div
                              key={toggle.category}
                              className="p-4 rounded-2xl border border-border/60 bg-muted/5 hover:bg-muted/10/20 transition-all flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4"
                            >
                              <div className="space-y-1">
                                <h4 className="text-xs font-extrabold text-foreground flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                  {toggle.category} Operations
                                </h4>
                                <p className="text-[10px] text-muted-foreground max-w-sm leading-relaxed">
                                  {toggle.label}
                                </p>
                              </div>

                              <div className="flex bg-background border border-border/60 p-0.5 rounded-xl self-start xl:self-auto overflow-hidden">
                                {toggle.options.map((opt) => {
                                  const isSelected = activeLevel === opt.level;
                                  return (
                                    <button
                                      key={opt.level}
                                      type="button"
                                      disabled={selectedRole.isSystem}
                                      onClick={() => {
                                        if (selectedRole.isSystem) return;
                                        handleUpdateBasicLevel(
                                          selectedRole._id,
                                          toggle.category,
                                          opt.level,
                                          currentRolePermIds,
                                          inheritedRoleIds
                                        );
                                      }}
                                      className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition-all whitespace-nowrap ${
                                        isSelected
                                          ? 'bg-primary text-primary-foreground shadow'
                                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                                      } ${selectedRole.isSystem && 'cursor-not-allowed opacity-80'}`}
                                      title={opt.label}
                                    >
                                      {opt.level === 'none' && 'No Access'}
                                      {opt.level === 'read' && 'Viewer'}
                                      {opt.level === 'write' && 'Manager'}
                                      {opt.level === 'admin' && 'Admin'}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                        {/* Search bar */}
                        <div className="relative">
                          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground/60" />
                          <input
                            type="text"
                            placeholder="Search permissions by name, key, or description..."
                            value={searchPermissionQuery}
                            onChange={(e) => setSearchPermissionQuery(e.target.value)}
                            className="w-full bg-background border border-border pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary/80"
                          />
                        </div>

                        {Object.entries(groupedPermissions).map(([categoryName, permsList]) => {
                          const currentRolePermIds = (selectedRole.permissions || []).map(
                            (p: any) => (typeof p === 'string' ? p : p._id)
                          );
                          const categoryPermIds = permsList.map((p) => p._id);
                          const selectedInCat = permsList.filter((p) =>
                            currentRolePermIds.includes(p._id)
                          );
                          const allSelectedInCat = categoryPermIds.every((id) =>
                            currentRolePermIds.includes(id)
                          );
                          const someSelectedInCat =
                            permsList.some((p) => currentRolePermIds.includes(p._id)) &&
                            !allSelectedInCat;
                          const isOpen = !!openAccordions[categoryName];

                          return (
                            <div
                              key={categoryName}
                              className="border border-border/60 bg-muted/5 hover:bg-muted/10/20 rounded-2xl overflow-hidden transition-all"
                            >
                              {/* Accordion Header */}
                              <div
                                className="flex items-center justify-between p-4 bg-muted/10 cursor-pointer select-none"
                                onClick={() => {
                                  setOpenAccordions((prev) => ({
                                    ...prev,
                                    [categoryName]: !prev[categoryName],
                                  }));
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenAccordions((prev) => ({
                                        ...prev,
                                        [categoryName]: !prev[categoryName],
                                      }));
                                    }}
                                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                                  >
                                    {isOpen ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </button>
                                  <div>
                                    <h4 className="text-xs font-extrabold text-foreground flex items-center gap-2">
                                      {categoryName} Clearances
                                      <span className="text-[9px] font-bold bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full font-mono">
                                        {selectedInCat.length}/{permsList.length} Active
                                      </span>
                                    </h4>
                                  </div>
                                </div>

                                {/* Category Level Checkbox */}
                                <div
                                  className="flex items-center gap-2 shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <label className="text-[10px] font-bold text-muted-foreground uppercase cursor-pointer hover:text-foreground transition-colors flex items-center gap-1.5">
                                    <input
                                      type="checkbox"
                                      checked={allSelectedInCat}
                                      ref={(el) => {
                                        if (el) {
                                          el.indeterminate = someSelectedInCat;
                                        }
                                      }}
                                      disabled={selectedRole.isSystem}
                                      onChange={() => {
                                        if (selectedRole.isSystem) return;
                                        handleToggleCategoryPermissions(
                                          categoryName,
                                          permsList,
                                          !allSelectedInCat
                                        );
                                      }}
                                      className="h-3.5 w-3.5 accent-emerald-500 rounded border-border/80 focus:ring-0 cursor-pointer"
                                    />
                                    <span className="hidden sm:inline">Select Category</span>
                                  </label>
                                </div>
                              </div>

                              {/* Accordion Body */}
                              {isOpen && (
                                <div className="p-4 border-t border-border/40 bg-background/50 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                  {permsList.map((perm) => {
                                    const hasPerm = currentRolePermIds.includes(perm._id);
                                    return (
                                      <div
                                        key={perm._id}
                                        onClick={() => {
                                          if (selectedRole.isSystem) return;
                                          const nextPermIds = hasPerm
                                            ? currentRolePermIds.filter((id) => id !== perm._id)
                                            : [...currentRolePermIds, perm._id];

                                          const inheritsIds = (
                                            selectedRole.inheritedRoles || []
                                          ).map((ir: any) =>
                                            typeof ir === 'string' ? ir : ir._id
                                          );
                                          handleUpdateRolePermissions(
                                            selectedRole._id,
                                            nextPermIds,
                                            inheritsIds
                                          );
                                        }}
                                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                          hasPerm
                                            ? 'border-emerald-500/30 bg-emerald-500/5 text-foreground font-semibold'
                                            : 'border-border/60 hover:bg-muted/30 text-muted-foreground hover:text-foreground'
                                        } ${selectedRole.isSystem && 'cursor-default opacity-85'}`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={hasPerm}
                                          disabled={selectedRole.isSystem}
                                          readOnly
                                          className="mt-0.5 h-3.5 w-3.5 accent-emerald-500 cursor-pointer"
                                        />
                                        <div className="space-y-0.5">
                                          <div className="text-xs">
                                            {translatePermissionKey(perm.key, perm.description)}
                                          </div>
                                          <div className="font-mono text-[9px] text-muted-foreground/80 tracking-tight">
                                            {perm.key}
                                          </div>
                                          <span className="text-[10px] text-muted-foreground/60 leading-relaxed block">
                                            {perm.description}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                ) : isCreatingRole ? (
                  <motion.div
                    key="create-role-pane"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-6"
                  >
                    {/* Stepper Header */}
                    <div className="flex items-center justify-between border-b border-border/40 pb-4">
                      <div>
                        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          <span>Custom Role Builder</span>
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Create a custom security role using our visual step-by-step assistant.
                        </p>
                      </div>

                      {/* Visual Steps Indicators */}
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4].map((step) => {
                          const isDone = currentStep > step;
                          const isActive = currentStep === step;
                          return (
                            <div key={step} className="flex items-center">
                              <div
                                className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                                  isDone
                                    ? 'bg-emerald-500 text-white'
                                    : isActive
                                      ? 'bg-primary text-primary-foreground animate-pulse'
                                      : 'bg-muted border border-border text-muted-foreground'
                                }`}
                              >
                                {isDone ? <Check className="h-3 w-3" /> : step}
                              </div>
                              {step < 4 && (
                                <div
                                  className={`h-0.5 w-6 transition-all ${
                                    isDone ? 'bg-emerald-500' : 'bg-muted border-b border-border'
                                  }`}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* STEP 1: CHOOSE ARCHETYPE */}
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-foreground">
                            Step 1: Choose Baseline Archetype
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Select a standard business archetype as a starting baseline, or choose
                            &quot;Start from Scratch&quot;.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[45vh] overflow-y-auto pr-1">
                          {/* Archetypes list */}
                          {ROLE_TEMPLATES.map((tmpl) => (
                            <button
                              key={tmpl.name}
                              type="button"
                              onClick={() => {
                                handleSelectArchetype(tmpl);
                                populateLevelsFromPerms(tmpl.perms);
                                setSelectedArchetype(tmpl.name);
                                setCurrentStep(2);
                              }}
                              className="p-4 rounded-2xl border border-border/60 text-left bg-gradient-to-br from-muted/5 to-muted/10 hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col justify-between h-32 hover:scale-[1.01] active:scale-[0.99]"
                            >
                              <div className="space-y-1">
                                <span className="text-xs font-bold text-foreground block">
                                  {tmpl.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground line-clamp-2 leading-snug">
                                  {tmpl.description}
                                </span>
                              </div>
                              <div className="flex items-center justify-between w-full border-t border-border/30 pt-2 mt-2">
                                <span className="text-[8px] bg-background/50 border border-border/40 px-1.5 py-0.5 rounded text-foreground/80 font-bold font-mono">
                                  LEVEL {tmpl.hierarchyLevel}
                                </span>
                                <span className="text-[9px] text-primary font-bold flex items-center gap-0.5">
                                  Use Baseline <ArrowRight className="h-3 w-3" />
                                </span>
                              </div>
                            </button>
                          ))}

                          {/* Start from Scratch */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedArchetype('Custom blank canvas');
                              setNewRoleName('Custom Role');
                              setNewRoleDesc('Custom workspace clearance role.');
                              setNewRoleHierarchy(10);
                              setEnabledModules([]);
                              setModuleAccessLevels({});
                              setCurrentStep(2);
                            }}
                            className="p-4 rounded-2xl border border-dashed border-primary/40 text-left bg-primary/5 hover:bg-primary/10 hover:border-primary transition-all flex flex-col justify-between h-32 hover:scale-[1.01] active:scale-[0.99]"
                          >
                            <div className="space-y-1">
                              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                                <Sparkles className="h-4 w-4" /> Start from Scratch
                              </span>
                              <span className="text-[10px] text-muted-foreground leading-snug block mt-1">
                                Initialize a clean blank canvas with zero default permissions. Build
                                completely custom rules.
                              </span>
                            </div>
                            <span className="text-[9px] text-primary font-bold flex items-center gap-0.5 self-end">
                              Create Custom <ArrowRight className="h-3 w-3" />
                            </span>
                          </button>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-border/30">
                          <button
                            type="button"
                            onClick={() => setIsCreatingRole(false)}
                            className="px-4 py-2 rounded-lg border border-border hover:bg-muted text-xs font-semibold"
                          >
                            Cancel Builder
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 2: CHOOSE MODULES */}
                    {currentStep === 2 && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-foreground">
                            Step 2: Enable Active Modules
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Toggle which product modules this custom role is cleared to access.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {[
                            {
                              name: 'CRM',
                              label: 'Customer Relations',
                              desc: 'Leads pipelines, accounts and client logs.',
                              icon: Users,
                            },
                            {
                              name: 'Projects',
                              label: 'Project Engineering',
                              desc: 'Task boards, milestone pipelines and deliverables.',
                              icon: Network,
                            },
                            {
                              name: 'HR',
                              label: 'Human Resources',
                              desc: 'Colleague directories, onboarding profiles, compensations.',
                              icon: UserCheck,
                            },
                            {
                              name: 'Finance',
                              label: 'Finance & Invoices',
                              desc: 'Expenditure audits, invoices and Stripe transactions.',
                              icon: ShieldCheck,
                            },
                            {
                              name: 'Collaboration',
                              label: 'Workspace Channels',
                              desc: 'Direct chats, channel threads and team calls.',
                              icon: Sparkles,
                            },
                            {
                              name: 'Analytics',
                              label: 'Intelligence & BI',
                              desc: 'KPI scorecards and dashboard custom graphs.',
                              icon: Layers,
                            },
                            {
                              name: 'Settings',
                              label: 'Workspace Settings',
                              desc: 'Audit logs, billing details and integration configurations.',
                              icon: FolderLock,
                            },
                          ].map((mod) => {
                            const isChecked = enabledModules.includes(mod.name);
                            const IconC = mod.icon;
                            return (
                              <button
                                key={mod.name}
                                type="button"
                                onClick={() => {
                                  if (isChecked) {
                                    setEnabledModules(enabledModules.filter((m) => m !== mod.name));
                                  } else {
                                    setEnabledModules([...enabledModules, mod.name]);
                                    if (!moduleAccessLevels[mod.name]) {
                                      setModuleAccessLevels((prev) => ({
                                        ...prev,
                                        [mod.name]: 'read',
                                      }));
                                    }
                                  }
                                }}
                                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 hover:scale-[1.01] active:scale-[0.99] ${
                                  isChecked
                                    ? 'bg-primary/5 border-primary shadow-sm'
                                    : 'bg-muted/5 border-border/60 hover:border-border hover:bg-muted/10'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  readOnly
                                  className="mt-1 h-3.5 w-3.5 accent-primary cursor-pointer shrink-0"
                                />
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <IconC
                                      className={`h-4 w-4 shrink-0 ${isChecked ? 'text-primary' : 'text-muted-foreground'}`}
                                    />
                                    <span className="text-xs font-bold text-foreground">
                                      {mod.name}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground block leading-snug">
                                    {mod.desc}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-border/30">
                          <button
                            type="button"
                            onClick={() => setCurrentStep(1)}
                            className="px-4 py-2 rounded-lg border border-border hover:bg-muted text-xs font-semibold flex items-center gap-1.5"
                          >
                            <ArrowLeft className="h-3.5 w-3.5" /> Back to Archetypes
                          </button>
                          <button
                            type="button"
                            disabled={enabledModules.length === 0}
                            onClick={() => setCurrentStep(3)}
                            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold shadow flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next: Access Levels <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 3: CONFIGURE LEVELS */}
                    {currentStep === 3 && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-foreground">
                            Step 3: Define Access Level Scopes
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Specify the operational clearance level for each of the enabled modules.
                          </p>
                        </div>

                        <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                          {enabledModules.map((modName) => {
                            const activeLvl = moduleAccessLevels[modName] || 'read';
                            return (
                              <div
                                key={modName}
                                className="p-4 rounded-2xl border border-border/60 bg-muted/5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                              >
                                <div className="space-y-1 max-w-sm">
                                  <span className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-primary" /> {modName}{' '}
                                    Module
                                  </span>
                                  <p className="text-[10px] text-muted-foreground leading-normal">
                                    Configure access restrictions for standard records, databases,
                                    and administrative keys.
                                  </p>
                                </div>

                                <div className="flex bg-background border border-border/60 p-0.5 rounded-xl self-start md:self-auto overflow-hidden">
                                  {[
                                    { key: 'read', label: 'View Only', tip: 'Read-only logs' },
                                    { key: 'edit', label: 'Edit', tip: 'Create & modify entries' },
                                    {
                                      key: 'manage',
                                      label: 'Manage',
                                      tip: 'Full modify & archive',
                                    },
                                    {
                                      key: 'admin',
                                      label: 'Full Access',
                                      tip: 'Gateway administration',
                                    },
                                  ].map((lvl) => {
                                    const isSel = activeLvl === lvl.key;
                                    return (
                                      <button
                                        key={lvl.key}
                                        type="button"
                                        onClick={() => {
                                          setModuleAccessLevels((prev) => ({
                                            ...prev,
                                            [modName]: lvl.key as any,
                                          }));
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition-all whitespace-nowrap ${
                                          isSel
                                            ? 'bg-primary text-primary-foreground shadow'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                                        }`}
                                        title={lvl.tip}
                                      >
                                        {lvl.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-border/30">
                          <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className="px-4 py-2 rounded-lg border border-border hover:bg-muted text-xs font-semibold flex items-center gap-1.5"
                          >
                            <ArrowLeft className="h-3.5 w-3.5" /> Back to Modules
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(4)}
                            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold shadow flex items-center gap-1.5"
                          >
                            Next: Save & Review <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 4: SAVE & REVIEW */}
                    {currentStep === 4 && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-foreground">
                            Step 4: Save & Review Custom Role
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Specify identity details and review baseline settings before finalizing.
                          </p>
                        </div>

                        <form onSubmit={handleCreateRole} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                                Role Name
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Sales Specialist, Project Partner"
                                value={newRoleName}
                                onChange={(e) => setNewRoleName(e.target.value)}
                                className="w-full bg-background border border-border px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                                Hierarchy Priority (1-100)
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={newRoleHierarchy}
                                onChange={(e) => setNewRoleHierarchy(Number(e.target.value))}
                                className="w-full bg-background border border-border px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                              Description
                            </label>
                            <textarea
                              required
                              placeholder="Describe workspace clearances and context."
                              value={newRoleDesc}
                              onChange={(e) => setNewRoleDesc(e.target.value)}
                              className="w-full bg-background border border-border px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary h-16 resize-none"
                            />
                          </div>

                          {/* Preview Card */}
                          <div className="border border-border/60 bg-muted/5 p-4 rounded-2xl space-y-3">
                            <h4 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest block">
                              Role Configuration Review
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                              <div className="space-y-1">
                                <span className="text-[10px] text-muted-foreground uppercase block">
                                  Baseline Preset
                                </span>
                                <p className="font-bold text-foreground">
                                  {selectedArchetype || 'Custom Blank Canvas'}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] text-muted-foreground uppercase block">
                                  Under-the-hood Mapping
                                </span>
                                <p className="font-bold text-emerald-400">
                                  {newRolePermissionIds.length} Granular Rules Selected
                                </p>
                              </div>
                            </div>

                            <div className="border-t border-border/30 pt-3">
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1.5">
                                Active Module Clearances:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {enabledModules.map((modName) => {
                                  const lvl = moduleAccessLevels[modName] || 'read';
                                  return (
                                    <span
                                      key={modName}
                                      className="px-2.5 py-1 rounded-lg text-[9px] font-extrabold bg-primary/10 border border-primary/20 text-primary uppercase"
                                    >
                                      {modName}:{' '}
                                      <span className="text-foreground/90 font-bold">{lvl}</span>
                                    </span>
                                  );
                                })}
                                {enabledModules.length === 0 && (
                                  <span className="text-[10px] text-muted-foreground italic">
                                    No modules selected.
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-border/30">
                            <button
                              type="button"
                              onClick={() => setCurrentStep(3)}
                              className="px-4 py-2 rounded-lg border border-border hover:bg-muted text-xs font-semibold flex items-center gap-1.5"
                            >
                              <ArrowLeft className="h-3.5 w-3.5" /> Back to Clearances
                            </button>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setIsCreatingRole(false)}
                                className="px-4 py-2 rounded-lg border border-border hover:bg-muted text-xs font-semibold"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-extrabold shadow-[0_4px_20px_rgba(var(--primary-rgb),0.2)] flex items-center gap-1.5"
                              >
                                <Check className="h-4 w-4" /> Save & Deploy Role
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="roles-placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border/60 rounded-3xl bg-card/25 backdrop-blur"
                  >
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                      <Layers className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-sm text-foreground">Select a Security Role</h3>
                    <p className="text-xs text-muted-foreground max-w-xs mt-1 leading-relaxed">
                      Select a role from the left list to load its permission grid, custom
                      inheritance flows, and hierarchy limits.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* TAB 2: DYNAMIC ABAC POLICIES */}
        {activeTab === 'policies' && (
          <div className="space-y-6">
            {/* Deploy policy builder */}
            {isCreatingPolicy && (
              <motion.div
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-border bg-card p-6 shadow-2xl max-w-xl mx-auto"
              >
                <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>ABAC Dynamic Policy Builder</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Define precise attribute conditions such as ownership rules, time restrictions, or
                  department scoping constraints.
                </p>

                <form onSubmit={handleCreatePolicy} className="space-y-4 mt-5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                      Policy Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Finance Invoices Self Edit Policy"
                      value={newPolicyName}
                      onChange={(e) => setNewPolicyName(e.target.value)}
                      className="w-full bg-background border border-border px-3.5 py-2 rounded-xl text-xs focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                        Target Resource Module
                      </label>
                      <Select
                        value={newPolicyResource}
                        onChange={(val) => setNewPolicyResource(val)}
                        className="w-full bg-background border border-border px-3.5 py-2 rounded-xl text-xs focus:outline-none"
                        options={PERMISSION_RESOURCES.map((res) => ({ value: res, label: res }))}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                        Policy Enforcement Effect
                      </label>
                      <Select
                        value={newPolicyEffect}
                        onChange={(val) => setNewPolicyEffect(val as 'allow' | 'deny')}
                        className="w-full bg-background border border-border px-3.5 py-2 rounded-xl text-xs focus:outline-none"
                        options={[
                          { value: 'allow', label: 'ALLOW (Explicit Privilege)' },
                          { value: 'deny', label: 'DENY (Override Restriction)' },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                      Custom Condition (JSON Schema)
                    </label>
                    <textarea
                      value={newPolicyConditionJson}
                      onChange={(e) => setNewPolicyConditionJson(e.target.value)}
                      className="w-full bg-background border border-border px-3.5 py-2 rounded-xl text-xs font-mono focus:outline-none h-24"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsCreatingPolicy(false)}
                      className="px-4 py-2 rounded-lg border border-border hover:bg-muted text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold shadow"
                    >
                      Deploy Policy Override
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Policies Cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {policies.map((policy) => (
                <div
                  key={policy._id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 ${
                    policy.enabled
                      ? 'border-border/60 bg-background/10'
                      : 'border-border/30 bg-background/5 opacity-65'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{policy.name}</span>
                          <span
                            className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                              policy.effect === 'deny'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {policy.effect}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Applies dynamically on module:{' '}
                          <strong className="text-foreground">{policy.resource}</strong>
                        </p>
                      </div>

                      <button
                        onClick={() => handleTogglePolicy(policy)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {policy.enabled ? (
                          <ToggleRight className="h-6 w-6 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-muted-foreground/60" />
                        )}
                      </button>
                    </div>

                    <div className="mt-4 p-3 rounded-xl bg-background/40 border border-border/60">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                        Active Condition Constraint
                      </span>
                      <pre className="font-mono text-[10px] text-emerald-400/90 whitespace-pre-wrap">
                        {JSON.stringify(policy.conditions, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/20 text-[10px] text-muted-foreground font-semibold">
                    <span>Priority: {policy.priority}</span>
                    <span>
                      {policy.companyId ? 'Custom Company Override' : 'Global Default Policy'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ACCESS ASSIGNMENTS */}
        {activeTab === 'assignments' && (
          <div className="rounded-3xl border border-border bg-card shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-border/40 bg-background/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-bold text-foreground">User Scoping Assignments</h3>
                <p className="text-[11px] text-muted-foreground">
                  Review and dynamically adjust granular workspace clearance privileges.
                </p>
              </div>
              <div className="flex bg-muted/30 border border-border/40 p-1.5 rounded-xl text-[10px] text-muted-foreground font-semibold items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{users.length} Active Specialists</span>
              </div>
            </div>

            {users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 animate-bounce">
                  <Users className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-sm text-foreground">No Workspace Specialists</h4>
                <p className="text-xs text-muted-foreground max-w-xs mt-1">
                  Onboard employees in settings to configure dynamic clearance scopes here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 bg-background/10">
                      <th className="px-6 py-4">Team Member</th>
                      <th className="px-6 py-4">Designation & Dept</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Scoped Clearance Role</th>
                      <th className="px-6 py-4">Access Restrictions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20 text-xs">
                    {users.map((member) => {
                      const activeRoleId = member.userId?.roles?.[0]?._id || '';
                      const initials = member.fullName
                        ? member.fullName
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()
                        : 'SP';

                      return (
                        <tr key={member._id} className="hover:bg-muted/15 transition-all group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary/20 via-primary/5 to-transparent border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shadow-sm shrink-0">
                                {initials}
                              </div>
                              <div className="space-y-0.5">
                                <div className="font-bold text-foreground group-hover:text-primary transition-colors">
                                  {member.fullName}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  {member.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-0.5">
                              <div className="font-semibold text-foreground/90">
                                {member.designation || 'Specialist'}
                              </div>
                              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Network className="h-3 w-3 shrink-0" />
                                <span>{member.departmentId?.name || 'General Operations'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide border ${
                                member.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_2px_10px_rgba(16,185,129,0.1)]'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_2px_10px_rgba(244,63,94,0.1)]'
                              }`}
                            >
                              {member.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 max-w-[200px]">
                            <Select
                              value={activeRoleId}
                              onChange={(val) => handleUpdateUserRole(member._id, val)}
                              className="w-full bg-background border border-border px-3.5 py-2 rounded-xl text-xs focus:outline-none hover:border-primary/50 transition-colors"
                              options={roles.map((r) => ({ value: r._id, label: r.name }))}
                            />
                          </td>
                          <td className="px-6 py-4 text-[11px] text-muted-foreground/80 leading-relaxed">
                            {member.status === 'suspended' ? (
                              <span className="text-rose-400 font-bold flex items-center gap-1">
                                <Lock className="h-3 w-3 shrink-0" />
                                Suspended - Access Revoked
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                                Global Tenant Access Enabled
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LoaderSpinner() {
  return (
    <div className="relative flex items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
    </div>
  );
}
