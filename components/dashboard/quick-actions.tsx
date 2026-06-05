'use client';

import React from 'react';
import { Plus, UserPlus, FileText, CheckCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { hasRole } from '@/lib/auth/permission-checks';

export function QuickActions() {
  const { data: session } = useSession();

  // Guard admin actions
  const isAdmin = session?.user?.roles
    ? hasRole(session.user.roles, ['super-admin', 'admin'])
    : false;

  const router = useRouter();

  const handleAction = (route: string) => {
    router.push(route);
  };

  const handleAdminOnlyAction = (route: string) => {
    if (!isAdmin) {
      toast.error('Permission Denied: Admin role required to perform this action.');
      return;
    }
    router.push(route);
  };

  return (
    <div className="rounded-xl border border-border/80 bg-card/40 backdrop-blur-sm p-4 text-left space-y-3.5 select-none shadow-sm">
      <div className="flex items-center gap-2">
        <Zap className="h-4.5 w-4.5 text-primary animate-pulse" />
        <h3 className="text-sm font-bold tracking-tight text-foreground">Quick Core Actions</h3>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction('/projects?action=create')}
          className="h-8.5 text-[13px] gap-1.5 hover:bg-accent/40"
        >
          <Plus className="h-4 w-4 text-primary" />
          Create Project
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction('/tasks?action=create')}
          className="h-8.5 text-[13px] gap-1.5 hover:bg-accent/40"
        >
          <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
          Add Task
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAdminOnlyAction('/team?action=invite')}
          className="h-8.5 text-[13px] gap-1.5 hover:bg-accent/40"
        >
          <UserPlus className="h-3.5 w-3.5 text-violet-500" />
          Invite Member
          {!isAdmin && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" title="Admin only" />}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction('/analytics')}
          className="h-8.5 text-[13px] gap-1.5 hover:bg-accent/40"
        >
          <FileText className="h-3.5 w-3.5 text-emerald-500" />
          Generate Report
        </Button>
      </div>
    </div>
  );
}
