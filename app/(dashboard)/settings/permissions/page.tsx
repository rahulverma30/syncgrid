'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader, Card, CardContent, Button, Input, LoadingSpinner } from '@/components/ui';
import { Shield, ArrowLeft, Search, Filter, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface MasterPermission {
  _id: string;
  name: string;
  category: string;
  scope: string;
  description: string;
  isActive: boolean;
}

export default function SettingsPermissionsPage() {
  const [mounted, setMounted] = useState(false);
  const [permissions, setPermissions] = useState<MasterPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const fetchPermissions = async () => {
      setIsLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setPermissions([
          {
            _id: 'p1',
            name: 'crm.contacts.read',
            category: 'CRM',
            scope: 'View stakeholders directory lists and timeline communication logs.',
            description: 'Core permissions to monitor external corporate contacts.',
            isActive: true,
          },
          {
            _id: 'p2',
            name: 'crm.contacts.write',
            category: 'CRM',
            scope: 'Onboard and edit corporate stakeholders details forms.',
            description: 'Grant to sales and customer relationship leads.',
            isActive: true,
          },
          {
            _id: 'p3',
            name: 'finance.invoices.write',
            category: 'Finance',
            scope: 'Draft new sales billing invoices, apply tax percentages.',
            description: 'Financial operations and accounts receivable access.',
            isActive: true,
          },
          {
            _id: 'p4',
            name: 'hr.payroll.run',
            category: 'HR',
            scope: 'Draft and release employee compensation distribution runs.',
            description: 'High-risk security level, restrict to HR leads.',
            isActive: true,
          },
        ]);
      } catch (err) {
        toast.error('Failed to sync permission schemas.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPermissions();
  }, []);

  const filteredPerms = permissions.filter((p) => {
    return (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 select-none font-semibold">
        <Link href="/settings/roles">
          <Button variant="outline" size="sm" className="h-8 hover:bg-accent/40 text-xs gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Roles
          </Button>
        </Link>
      </div>

      <PageHeader
        eyebrow="Security Governance Suite"
        title="Settings Permissions Master"
        description="Verify active permission policy schemas, track category layers, and audit high-risk administrative rules."
      />

      {/* Control bar */}
      <Card className="bg-card/30 border border-border/60 p-4 rounded-2xl backdrop-blur-sm">
        <div className="relative w-full md:max-w-xs text-left">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search permission rule or category..."
            className="pl-8 h-9 text-xs bg-background/40"
          />
        </div>
      </Card>

      {/* Permissions List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <LoadingSpinner className="h-8 w-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground animate-pulse font-bold tracking-wider uppercase">
            Syncing permissions master...
          </p>
        </div>
      ) : (
        <Card className="bg-card/40 border border-border/60 rounded-3xl overflow-hidden backdrop-blur-md text-left">
          <div className="overflow-x-auto select-none">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/60 bg-background/20 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-5">Permission Rule Name</th>
                  <th className="py-3.5 px-4">System Category</th>
                  <th className="py-3.5 px-4">Policy Scope Description</th>
                  <th className="py-3.5 px-5">Active Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-slate-300">
                {filteredPerms.map((rule) => (
                  <tr key={rule._id} className="hover:bg-slate-900/10 transition-colors">
                    <td className="py-4 px-5">
                      <span className="font-mono font-bold text-white text-sm bg-background/50 border border-border/60 px-2 py-0.5 rounded">
                        {rule.name}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">
                        {rule.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-400 leading-relaxed max-w-md">
                      <div className="font-semibold text-slate-200">{rule.scope}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{rule.description}</div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Enabled
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
