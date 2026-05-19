'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader, Card, CardContent, Button, LoadingSpinner } from '@/components/ui';
import { Shield, ArrowLeft, CheckCircle, Users, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface PermissionRule {
  module: string;
  read: boolean;
  write: boolean;
  delete: boolean;
}

export default function RoleDetailsPage() {
  const params = useParams();
  const roleId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : '';
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // States
  const [name, setName] = useState('Project Manager');
  const [level, setLevel] = useState(75);
  const [description, setDescription] = useState(
    'Manage client accounts, view and approve scoping deals, run project timelines, and allocate resources.'
  );
  const [assignedUsers, setAssignedUsers] = useState(4);

  const [permissions, setPermissions] = useState<PermissionRule[]>([
    { module: 'CRM System (Contacts, Accounts)', read: true, write: true, delete: false },
    { module: 'Finance Operations (Invoices, Expenses)', read: true, write: false, delete: false },
    { module: 'Human Resources (Employees, Payroll)', read: true, write: true, delete: false },
    { module: 'Project Workspaces', read: true, write: true, delete: true },
  ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (!roleId) return;
    const fetchRoleDetails = async () => {
      setIsLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (roleId === 'r1') {
          setName('Super Admin');
          setLevel(100);
          setDescription(
            'Full administrative rights across all modules, tenants, settings, and database configurations.'
          );
          setAssignedUsers(1);
          setPermissions([
            { module: 'CRM System (Contacts, Accounts)', read: true, write: true, delete: true },
            {
              module: 'Finance Operations (Invoices, Expenses)',
              read: true,
              write: true,
              delete: true,
            },
            {
              module: 'Human Resources (Employees, Payroll)',
              read: true,
              write: true,
              delete: true,
            },
            { module: 'Project Workspaces', read: true, write: true, delete: true },
          ]);
        } else if (roleId === 'r3') {
          setName('Client Partner');
          setLevel(40);
          setDescription(
            'External collaborator role with limited read permissions to scoped assets, channels, and portals.'
          );
          setAssignedUsers(8);
          setPermissions([
            { module: 'CRM System (Contacts, Accounts)', read: true, write: false, delete: false },
            {
              module: 'Finance Operations (Invoices, Expenses)',
              read: false,
              write: false,
              delete: false,
            },
            {
              module: 'Human Resources (Employees, Payroll)',
              read: false,
              write: false,
              delete: false,
            },
            { module: 'Project Workspaces', read: true, write: false, delete: false },
          ]);
        }
      } catch (err) {
        toast.error('Failed to sync role details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoleDetails();
  }, [roleId]);

  const handleTogglePermission = (idx: number, field: keyof Omit<PermissionRule, 'module'>) => {
    setPermissions(permissions.map((p, i) => (i === idx ? { ...p, [field]: !p[field] } : p)));
    toast.success('Granular permission rule updated.');
  };

  const handleSaveSchema = () => {
    toast.success(`RBAC security schema for role "${name}" successfully updated.`);
    router.push('/settings/roles');
  };

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground animate-pulse font-bold tracking-wider uppercase">
          Synthesizing RBAC permission rules...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 select-none">
        <Link href="/settings/roles">
          <Button variant="outline" size="sm" className="h-8 hover:bg-accent/40 text-xs gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Roles
          </Button>
        </Link>
        <Button
          onClick={handleSaveSchema}
          variant="default"
          size="sm"
          className="h-8 text-xs gap-1"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          Save RBAC Schema
        </Button>
      </div>

      {/* Role Profile Header Widget */}
      <Card className="bg-gradient-to-r from-card/40 to-background/40 border border-border/60 p-6 rounded-2xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 text-left">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 text-2xl font-black font-mono shadow-inner select-none">
              {name.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-foreground">{name}</h1>
                <span className="inline-flex px-2 py-0.5 rounded text-[8px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider select-none">
                  Security Level {level}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-xl">
                {description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-semibold select-none">
            <div className="text-right">
              <span className="text-[9px] font-bold text-muted-foreground/80 uppercase block leading-none">
                Bound Members
              </span>
              <span className="text-foreground text-lg font-black block mt-0.5 flex items-center gap-1.5 justify-end">
                <Users className="h-4.5 w-4.5 text-muted-foreground" />
                {assignedUsers}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Permissions matrix */}
      <Card className="bg-card/40 border border-border/60 rounded-3xl overflow-hidden backdrop-blur-md text-left">
        <div className="p-5 border-b border-border/40 select-none">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Granular Permission Rules Matrix
          </h2>
        </div>

        <div className="overflow-x-auto select-none">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-background/20 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                <th className="py-3.5 px-5">System Module</th>
                <th className="py-3.5 px-4 text-center w-24">Read Access</th>
                <th className="py-3.5 px-4 text-center w-24">Write / Edit</th>
                <th className="py-3.5 px-5 text-center w-24">Perm Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-muted-foreground">
              {permissions.map((rule, idx) => (
                <tr key={idx} className="hover:bg-accent/20 transition-colors">
                  <td className="py-4 px-5 font-semibold text-foreground">{rule.module}</td>
                  <td className="py-4 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={rule.read}
                      onChange={() => handleTogglePermission(idx, 'read')}
                      className="rounded border-border/60 text-primary h-4.5 w-4.5 focus:ring-0 cursor-pointer"
                    />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={rule.write}
                      onChange={() => handleTogglePermission(idx, 'write')}
                      className="rounded border-border/60 text-primary h-4.5 w-4.5 focus:ring-0 cursor-pointer"
                    />
                  </td>
                  <td className="py-4 px-5 text-center">
                    <input
                      type="checkbox"
                      checked={rule.delete}
                      onChange={() => handleTogglePermission(idx, 'delete')}
                      className="rounded border-border/60 text-primary h-4.5 w-4.5 focus:ring-0 cursor-pointer"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* RBAC notice */}
      <Card className="bg-yellow-500/5 border border-yellow-500/25 p-5 rounded-2xl text-left backdrop-blur-md flex items-start gap-3 select-none">
        <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
            Scope Restrictions Safeguard
          </h4>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Adjusting permission columns directly impacts all bound tenant user sessions. Make sure
            you confirm these shifts before saving.
          </p>
        </div>
      </Card>
    </div>
  );
}
