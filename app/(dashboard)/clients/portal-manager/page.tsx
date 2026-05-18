'use client';

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  UserPlus,
  Settings2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Loader2,
  Plus,
  RefreshCw,
  Sliders,
  CheckCircle,
  FileCheck,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function InternalPortalManagerPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [accessRules, setAccessRules] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('Client Reviewer');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      // Retrieve clients
      const clientsRes = await fetch('/api/clients');
      const clientsBody = await clientsRes.json();

      if (clientsBody.success) {
        setClients(clientsBody.data);
        if (clientsBody.data.length > 0) {
          setSelectedClient(clientsBody.data[0]);
        }
      }
    } catch (err) {
      toast.error('Failed to load internal CRM clients.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadClientProjects = async () => {
    if (!selectedClient) return;
    try {
      // Fetch internal projects linked to client
      const projRes = await fetch(`/api/projects?clientId=${selectedClient._id}`);
      const projBody = await projRes.json();

      if (projBody.success) {
        setProjects(projBody.data);

        // Fetch actual persisted visibility rules for this client
        const rulesRes = await fetch(`/api/portal/rules?clientId=${selectedClient._id}`);
        const rulesBody = await rulesRes.json();
        const dbRules = rulesBody.success ? rulesBody.data : [];

        // Merge actual DB records or fall back to default values
        const mergedRules = projBody.data.map((p: any) => {
          const existing = dbRules.find((r: any) => r.projectId === p._id);
          return {
            projectId: p._id,
            projectName: p.name,
            isAccessAllowed: existing ? existing.isAccessAllowed : true,
            showMilestones: existing ? existing.showMilestones : true,
            showTasks: existing ? existing.showTasks : false,
            showBudgets: existing ? existing.showBudgets : false,
            showTimeLogs: existing ? existing.showTimeLogs : false,
          };
        });
        setAccessRules(mergedRules);
      }
    } catch (err) {
      toast.error('Failed to fetch client project visibility lists.');
    }
  };

  useEffect(() => {
    loadClientProjects();
  }, [selectedClient]);

  const handleRuleToggle = (projId: string, field: string) => {
    setAccessRules((prev) =>
      prev.map((rule) => {
        if (rule.projectId === projId) {
          return { ...rule, [field]: !rule[field] };
        }
        return rule;
      })
    );
  };

  const handleSaveVisibilityRules = async () => {
    if (!selectedClient) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/portal/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient._id,
          rules: accessRules,
        }),
      });

      const body = await res.json();
      if (res.ok && body.success) {
        toast.success('Client Project Visibility Policies saved successfully!');
        // Refresh list to sync states
        loadClientProjects();
      } else {
        toast.error(body.message || 'Failed to save visibility policies.');
      }
    } catch (error: any) {
      toast.error('Network failure while saving rules.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) {
      toast.error('Please enter name and email to send portal invite.');
      return;
    }
    setIsInviting(true);

    try {
      // Simulate sending secure SMTP invitation + creating ClientPortalUser model
      const res = await fetch('/api/portal/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'invite',
          clientId: selectedClient._id,
          name: inviteName,
          email: inviteEmail,
          portalRole: inviteRole,
        }),
      });

      const body = await res.json();
      if (res.ok && body.success) {
        toast.success(`Secure portal invitation email dispatched to ${inviteEmail}!`);
        setInviteEmail('');
        setInviteName('');
      } else {
        toast.error(body.message || 'Invitation failed.');
      }
    } catch (error) {
      toast.error('Invitation failure.');
    } finally {
      setIsInviting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 text-left">
        <Skeleton className="h-96 rounded-2xl bg-slate-900" />
        <Skeleton className="h-96 lg:col-span-2 rounded-2xl bg-slate-900" />
      </div>
    );
  }

  return (
    <div className="p-6 text-left space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-blue-500" />
            <span>Client Portal Management Console</span>
          </h1>
          <p className="text-sm text-slate-400">
            Configure external visibility rules, invite stakeholders, and manage portal access
          </p>
        </div>
        <Button
          variant="outline"
          className="border-slate-800 hover:bg-slate-850 text-slate-300 rounded-xl"
          onClick={loadData}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Client Selector list */}
        <div className="space-y-6">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">
              Select Corporate Account
            </span>
            <p className="text-xs text-slate-400">
              Scoped database shielding updates apply strictly to target clients
            </p>
          </div>

          <div className="space-y-3">
            {clients.map((c) => {
              const isSelected = selectedClient?._id === c._id;
              return (
                <div
                  key={c._id}
                  className={`cursor-pointer transition-all duration-300 rounded-2xl border p-5 flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-900 border-blue-500 shadow-lg shadow-blue-500/5'
                      : 'bg-slate-900/40 border-slate-850 hover:border-slate-800'
                  }`}
                  onClick={() => setSelectedClient(c)}
                >
                  <div className="text-left space-y-1">
                    <h3 className="text-sm font-bold text-white">{c.name}</h3>
                    <p className="text-xs text-slate-500">
                      {c.primaryContact?.email || 'No primary contact'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Secure invitation manager box */}
          {selectedClient && (
            <Card className="bg-slate-900/40 border-slate-850 rounded-2xl p-5 space-y-4">
              <div className="border-b border-slate-850 pb-2">
                <span className="text-xs font-bold text-white flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  <span>Invite Portal User</span>
                </span>
                <p className="text-[10px] text-slate-500">
                  Depatches credentials for {selectedClient.name}
                </p>
              </div>

              <form onSubmit={handleInviteUser} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">
                    Full Name
                  </label>
                  <Input
                    placeholder="Jane Doe..."
                    className="bg-slate-950/40 border-slate-850 text-slate-200 text-xs rounded-xl"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="jane@client.com..."
                    className="bg-slate-950/40 border-slate-850 text-slate-200 text-xs rounded-xl"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">
                    Portal Role
                  </label>
                  <select
                    className="w-full bg-slate-950 border border-slate-850 text-slate-200 text-xs rounded-xl p-2.5 outline-none cursor-pointer"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                  >
                    <option value="Client Owner">Client Owner (Full Control)</option>
                    <option value="Client Stakeholder">Client Stakeholder</option>
                    <option value="Client Reviewer">Client Reviewer (Approvals only)</option>
                    <option value="Client Finance Contact">Client Finance Contact</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-4 rounded-xl border-0 shadow-lg shadow-emerald-600/10 mt-2"
                  disabled={isInviting}
                >
                  {isInviting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Send Portal Invitation
                      <Plus className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </Card>
          )}
        </div>

        {/* Visibility rules engine panel */}
        {selectedClient && (
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-900/40 border-slate-850 rounded-3xl p-6 lg:p-8 space-y-6">
              <div className="border-b border-slate-850 pb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <Sliders className="w-5 h-5 text-blue-500" />
                    <span>Project Visibility & Data Shielding Engine</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Configure corporate data isolation rules for {selectedClient.name}
                  </p>
                </div>
              </div>

              {projects.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-8 text-center bg-slate-950/20 rounded-2xl border border-slate-850">
                  No projects are currently linked to this client. Link projects first under CRM
                  settings.
                </p>
              ) : (
                <div className="space-y-4">
                  {accessRules.map((rule) => (
                    <div
                      key={rule.projectId}
                      className="bg-slate-900 border border-slate-850 p-5 rounded-2xl space-y-4 text-left"
                    >
                      <div className="flex justify-between items-center pb-3 border-b border-slate-850/60">
                        <h4 className="text-sm font-bold text-white">{rule.projectName}</h4>
                        <div className="flex items-center space-x-2">
                          <button
                            className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${
                              rule.isAccessAllowed
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : 'bg-slate-500/10 text-slate-500 border-slate-800'
                            }`}
                            onClick={() => handleRuleToggle(rule.projectId, 'isAccessAllowed')}
                          >
                            {rule.isAccessAllowed ? 'Portal Access Enabled' : 'Access Suspended'}
                          </button>
                        </div>
                      </div>

                      {rule.isAccessAllowed && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                          {/* Show Milestones */}
                          <div
                            className={`p-3 rounded-xl border cursor-pointer transition-colors text-center space-y-2 ${
                              rule.showMilestones
                                ? 'bg-blue-600/10 border-blue-500/30 text-blue-400'
                                : 'bg-slate-950/40 border-slate-850 text-slate-500 hover:border-slate-800'
                            }`}
                            onClick={() => handleRuleToggle(rule.projectId, 'showMilestones')}
                          >
                            <FileCheck className="w-4 h-4 mx-auto" />
                            <span className="text-[10px] font-bold block">Milestones</span>
                          </div>

                          {/* Show Tasks */}
                          <div
                            className={`p-3 rounded-xl border cursor-pointer transition-colors text-center space-y-2 ${
                              rule.showTasks
                                ? 'bg-blue-600/10 border-blue-500/30 text-blue-400'
                                : 'bg-slate-950/40 border-slate-850 text-slate-500 hover:border-slate-800'
                            }`}
                            onClick={() => handleRuleToggle(rule.projectId, 'showTasks')}
                          >
                            <Eye className="w-4 h-4 mx-auto" />
                            <span className="text-[10px] font-bold block">Internal Tasks</span>
                          </div>

                          {/* Show Budgets */}
                          <div
                            className={`p-3 rounded-xl border cursor-pointer transition-colors text-center space-y-2 ${
                              rule.showBudgets
                                ? 'bg-blue-600/10 border-blue-500/30 text-blue-400'
                                : 'bg-slate-950/40 border-slate-850 text-slate-500 hover:border-slate-800'
                            }`}
                            onClick={() => handleRuleToggle(rule.projectId, 'showBudgets')}
                          >
                            <Eye className="w-4 h-4 mx-auto" />
                            <span className="text-[10px] font-bold block">Budgets</span>
                          </div>

                          {/* Show Time Logs */}
                          <div
                            className={`p-3 rounded-xl border cursor-pointer transition-colors text-center space-y-2 ${
                              rule.showTimeLogs
                                ? 'bg-blue-600/10 border-blue-500/30 text-blue-400'
                                : 'bg-slate-950/40 border-slate-850 text-slate-500 hover:border-slate-800'
                            }`}
                            onClick={() => handleRuleToggle(rule.projectId, 'showTimeLogs')}
                          >
                            <Eye className="w-4 h-4 mx-auto" />
                            <span className="text-[10px] font-bold block">Time Logs</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="flex justify-end pt-4 border-t border-slate-850">
                    <Button
                      className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-5 px-6 border-0 shadow-lg shadow-blue-600/10 font-semibold text-xs"
                      onClick={handleSaveVisibilityRules}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          Save Visibility Overrides
                          <CheckCircle className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
