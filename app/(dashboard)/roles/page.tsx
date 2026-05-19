'use client';

import React, { useState, useEffect } from 'react';
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
  UserCheck,
  Network,
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

  // New Custom Role Builder Form State
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleHierarchy, setNewRoleHierarchy] = useState(10);
  const [newRolePermissionIds, setNewRolePermissionIds] = useState<string[]>([]);
  const [newRoleInherits, setNewRoleInherits] = useState<string[]>([]);

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
      const uRes = await fetch('/api/protected/settings/invite'); // invite displays colleagues and details
      const uData = await uRes.json();
      if (uData.success) {
        setUsers(uData.data?.employees || []);
      }
    } catch (err) {
      toast.error('Failed to resolve enterprise access contexts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchCoreData();
    });
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
        setNewRolePermissionIds([]);
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

    const permissionIds = (role.permissions || []).map((p: any) =>
      typeof p === 'string' ? p : p._id
    );
    const inheritedIds = (role.inheritedRoles || []).map((ir: any) =>
      typeof ir === 'string' ? ir : ir._id
    );

    setNewRolePermissionIds(permissionIds);
    setNewRoleInherits(inheritedIds);
    setIsCreatingRole(true);
    toast.info(`Cloned matrix configuration from "${role.name}".`);
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

        <div className="flex items-center gap-3">
          {activeTab === 'roles' && (
            <button
              onClick={() => setIsCreatingRole(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_4px_20px_rgba(var(--primary-rgb),0.2)]"
            >
              <Plus className="h-4 w-4" />
              <span>Create Custom Role</span>
            </button>
          )}
          {activeTab === 'policies' && (
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
                              <span className="text-[9px] font-bold uppercase bg-slate-900 border border-slate-800 text-muted-foreground px-1.5 py-0.5 rounded">
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
                            <span className="text-[9px] font-bold uppercase bg-slate-950/80 text-muted-foreground border border-border/50 px-2 py-0.5 rounded-full">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-slate-950/20 border border-border/40 p-4 rounded-2xl">
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

                    {/* Permissions search bar */}
                    <div className="relative mb-6">
                      <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground/60" />
                      <input
                        type="text"
                        placeholder="Search permissions keys..."
                        value={searchPermissionQuery}
                        onChange={(e) => setSearchPermissionQuery(e.target.value)}
                        className="w-full bg-background border border-border pl-10 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary/80"
                      />
                    </div>

                    {/* Category matrix checklist */}
                    <div className="space-y-6 max-h-[45vh] overflow-y-auto pr-2">
                      {Object.entries(groupedPermissions).map(([categoryName, permsList]) => (
                        <div
                          key={categoryName}
                          className="space-y-2 border-b border-border/20 pb-4 last:border-b-0 last:pb-0"
                        >
                          <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                            <Plus className="h-3 w-3" />
                            {categoryName}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {permsList.map((perm) => {
                              const currentRolePermIds = (selectedRole.permissions || []).map(
                                (p: any) => (typeof p === 'string' ? p : p._id)
                              );
                              const hasPerm = currentRolePermIds.includes(perm._id);

                              return (
                                <div
                                  key={perm._id}
                                  onClick={() => {
                                    if (selectedRole.isSystem) return;
                                    const nextPermIds = hasPerm
                                      ? currentRolePermIds.filter((id) => id !== perm._id)
                                      : [...currentRolePermIds, perm._id];

                                    const inheritsIds = (selectedRole.inheritedRoles || []).map(
                                      (ir: any) => (typeof ir === 'string' ? ir : ir._id)
                                    );
                                    handleUpdateRolePermissions(
                                      selectedRole._id,
                                      nextPermIds,
                                      inheritsIds
                                    );
                                  }}
                                  className={`flex items-start gap-2.5 p-2 rounded-xl border cursor-pointer transition-all ${
                                    hasPerm
                                      ? 'border-emerald-500/30 bg-emerald-500/5 text-foreground'
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
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono text-[10px] font-bold uppercase tracking-wide">
                                        {perm.key}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground/80 line-clamp-1 block mt-0.5">
                                      {perm.description}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : isCreatingRole ? (
                  <motion.div
                    key="create-role-pane"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl border border-border bg-card p-6 shadow-2xl"
                  >
                    <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <span>Custom Role Builder</span>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Compose a new granular access group, assign its priority value, and clone
                      configurations easily.
                    </p>

                    <form onSubmit={handleCreateRole} className="space-y-4 mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                            Role Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Sales Director, Client Auditor"
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value)}
                            className="w-full bg-background border border-border px-3.5 py-2 rounded-xl text-xs focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                            Hierarchy Level Priority
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={newRoleHierarchy}
                            onChange={(e) => setNewRoleHierarchy(Number(e.target.value))}
                            className="w-full bg-background border border-border px-3.5 py-2 rounded-xl text-xs focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                          Role Description
                        </label>
                        <textarea
                          placeholder="Provide summary of access limitations and business context."
                          value={newRoleDesc}
                          onChange={(e) => setNewRoleDesc(e.target.value)}
                          className="w-full bg-background border border-border px-3.5 py-2 rounded-xl text-xs focus:outline-none h-20 resize-none"
                        />
                      </div>

                      <div className="space-y-2 border-t border-border/30 pt-4">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          Cloned Permissions list ({newRolePermissionIds.length} loaded)
                        </h4>
                        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-950/20 text-[10px] text-muted-foreground">
                          <Info className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>
                            We have populated permission keys dynamically. Click Save Role below to
                            persist.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 border-t border-border/30 pt-4">
                        <button
                          type="button"
                          onClick={() => setIsCreatingRole(false)}
                          className="px-4 py-2 rounded-lg border border-border hover:bg-muted text-xs font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold shadow"
                        >
                          Save Custom Role
                        </button>
                      </div>
                    </form>
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
                      <select
                        value={newPolicyResource}
                        onChange={(e) => setNewPolicyResource(e.target.value)}
                        className="w-full bg-background border border-border px-3.5 py-2 rounded-xl text-xs focus:outline-none"
                      >
                        {PERMISSION_RESOURCES.map((res) => (
                          <option key={res} value={res}>
                            {res}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                        Policy Enforcement Effect
                      </label>
                      <select
                        value={newPolicyEffect}
                        onChange={(e) => setNewPolicyEffect(e.target.value as any)}
                        className="w-full bg-background border border-border px-3.5 py-2 rounded-xl text-xs focus:outline-none"
                      >
                        <option value="allow">ALLOW (Explicit Privilege)</option>
                        <option value="deny">DENY (Override Restriction)</option>
                      </select>
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
                      ? 'border-border/60 bg-slate-950/10'
                      : 'border-border/30 bg-slate-950/5 opacity-65'
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

                    <div className="mt-4 p-3 rounded-xl bg-slate-950/40 border border-border/20">
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
            <div className="px-6 py-4 border-b border-border/40 bg-slate-950/20 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground">User Scoping Assignments</h3>
                <p className="text-[11px] text-muted-foreground">
                  Review and customize active security roles assigned to each team member.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/40 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 bg-slate-950/10">
                    <th className="px-6 py-3">Team Member</th>
                    <th className="px-6 py-3">Designation</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Scoped Security Roles</th>
                    <th className="px-6 py-3">Access Restrictions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20 text-xs">
                  {users.map((member) => (
                    <tr key={member._id} className="hover:bg-muted/15 transition-all">
                      <td className="px-6 py-3.5 font-bold text-foreground">{member.fullName}</td>
                      <td className="px-6 py-3.5 text-muted-foreground">
                        {member.designation || 'Specialist'}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                            member.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          <span className="px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold">
                            Default {member.userId?.roles?.[0]?.name || 'Developer'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-muted-foreground/70">
                        {member.status === 'suspended' ? 'Disabled Account' : 'Global tenant scope'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
