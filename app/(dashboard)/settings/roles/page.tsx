'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader, Card, CardContent, Button, Input, LoadingSpinner } from '@/components/ui';
import {
  Shield,
  Search,
  Filter,
  Plus,
  Trash2,
  Eye,
  Edit2,
  Download,
  Users,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Role {
  _id: string;
  name: string;
  level: number;
  assignedUsers: number;
  permissionsCount: number;
  description: string;
  createdAt: string;
}

export default function SettingsRolesPage() {
  const [mounted, setMounted] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setRoles([
        {
          _id: 'r1',
          name: 'Super Admin',
          level: 100,
          assignedUsers: 1,
          permissionsCount: 45,
          description:
            'Full administrative rights across all modules, tenants, settings, and database configurations.',
          createdAt: new Date().toISOString(),
        },
        {
          _id: 'r2',
          name: 'Project Manager',
          level: 75,
          assignedUsers: 4,
          permissionsCount: 28,
          description:
            'Manage client accounts, view and approve scoping deals, run project timelines, and allocate resources.',
          createdAt: new Date().toISOString(),
        },
        {
          _id: 'r3',
          name: 'Client Partner',
          level: 40,
          assignedUsers: 8,
          permissionsCount: 15,
          description:
            'External collaborator role with limited read permissions to scoped assets, channels, and portals.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      toast.error('Failed to sync roles schema.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    fetchRoles();
  }, []);

  const handleRowSelect = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === filteredRoles.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredRoles.map((r) => r._id));
    }
  };

  const handleDeleteRole = (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this RBAC security role?')) return;
    setRoles(roles.filter((r) => r._id !== id));
    toast.success('Role permanently deleted.');
  };

  const handleBulkDelete = () => {
    if (!confirm(`Delete ${selectedRows.length} selected roles permanently?`)) return;
    setRoles(roles.filter((r) => !selectedRows.includes(r._id)));
    setSelectedRows([]);
    toast.success('Selected roles deleted.');
  };

  const filteredRoles = roles.filter((r) => {
    return (
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Security Governance Suite"
        title="Settings Roles Directory"
        description="Verify corporate RBAC directories, organize security parameters, adjust access bounds, and assign roles."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/settings/permissions">
              <Button
                variant="outline"
                size="sm"
                className="h-9 hover:bg-accent/40 text-xs gap-1.5"
              >
                <Shield className="h-3.5 w-3.5" />
                Permissions Master
              </Button>
            </Link>
            <Link href="/settings/access">
              <Button
                variant="outline"
                size="sm"
                className="h-9 hover:bg-accent/40 text-xs gap-1.5"
              >
                <Shield className="h-3.5 w-3.5" />
                Access Keys
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI stats */}
      <div className="grid gap-4 sm:grid-cols-3 select-none">
        <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl backdrop-blur-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Roles</span>
            <Shield className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-2xl font-black font-mono text-white mt-1.5">{roles.length}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Configured security layers</p>
        </Card>

        <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl backdrop-blur-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Total Handled Rules
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black font-mono text-emerald-400 mt-1.5">
            {roles.reduce((acc, curr) => acc + (curr.permissionsCount || 0), 0)}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Active permission rules</p>
        </Card>

        <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl backdrop-blur-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Assigned Members</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <h3 className="text-2xl font-black font-mono text-purple-400 mt-1.5">
            {roles.reduce((acc, curr) => acc + (curr.assignedUsers || 0), 0)}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Members bound to RBAC layers</p>
        </Card>
      </div>

      {/* Control bar */}
      <Card className="bg-card/30 border border-border/60 p-4 rounded-2xl backdrop-blur-sm">
        <div className="relative w-full md:max-w-xs text-left">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search role name or description..."
            className="pl-8 h-9 text-xs bg-background/40"
          />
        </div>
      </Card>

      {/* Roles grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <LoadingSpinner className="h-8 w-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground animate-pulse font-bold tracking-wider uppercase">
            Syncing RBAC schema...
          </p>
        </div>
      ) : (
        <Card className="bg-card/40 border border-border/60 rounded-2xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-background/20 select-none text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        selectedRows.length === filteredRoles.length && filteredRoles.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-border/60 text-primary focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Role Title</th>
                  <th className="py-3.5 px-4">Security Level</th>
                  <th className="py-3.5 px-4">Active Members</th>
                  <th className="py-3.5 px-4">Rules Density</th>
                  <th className="py-3.5 px-4">Description notes</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                <AnimatePresence mode="popLayout">
                  {filteredRoles.map((r) => (
                    <motion.tr
                      key={r._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`hover:bg-slate-900/10 transition-colors ${
                        selectedRows.includes(r._id) ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(r._id)}
                          onChange={() => handleRowSelect(r._id)}
                          className="rounded border-border/60 text-primary focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-4 font-bold text-white tracking-wider">{r.name}</td>
                      <td className="py-4 px-4 font-mono font-bold text-blue-400">Lv {r.level}</td>
                      <td className="py-4 px-4 font-semibold text-slate-300">
                        {r.assignedUsers} users bound
                      </td>
                      <td className="py-4 px-4 text-emerald-400 font-bold font-mono">
                        {r.permissionsCount} rules
                      </td>
                      <td className="py-4 px-4 text-slate-400 max-w-sm truncate leading-relaxed">
                        {r.description}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/settings/roles/${r._id}`}>
                            <button
                              title="View details"
                              className="p-1.5 rounded-lg border border-border/60 hover:bg-primary/10 text-slate-400 hover:text-primary transition-all"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDeleteRole(r._id)}
                            title="Delete role record"
                            className="p-1.5 rounded-lg border border-border/60 hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Bulk actions */}
      <AnimatePresence>
        {selectedRows.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-slate-900 border border-border p-3.5 rounded-2xl shadow-2xl select-none"
          >
            <span className="text-xs font-bold text-slate-300">
              {selectedRows.length} roles selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleBulkDelete}
                variant="destructive"
                size="sm"
                className="h-8 text-xs gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Selected
              </Button>
              <Button
                onClick={() => setSelectedRows([])}
                variant="outline"
                size="sm"
                className="h-8 text-xs"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
