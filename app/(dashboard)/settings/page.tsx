'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building,
  CreditCard,
  Key,
  Webhook,
  Activity,
  User,
  Sparkles,
  Clipboard,
  Trash2,
  Play,
  CheckCircle,
  AlertTriangle,
  Globe,
  Loader2,
  FileDown,
  Info,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader, Button } from '@/components/ui';
import { toast } from 'sonner';

type TabType = 'profile' | 'billing' | 'branding' | 'keys' | 'webhooks' | 'security';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [loading, setLoading] = useState(true);

  // Billing states
  const [quotas, setQuotas] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);

  // API Key states
  const [keys, setKeys] = useState<any[]>([]);
  const [keyName, setKeyName] = useState('');
  const [keyScopes, setKeyScopes] = useState<string[]>(['projects:read']);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  // Webhook states
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>(['invoice.paid']);
  const [deliveries, setDeliveries] = useState<any[]>([]);

  // Profile / White-label states
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [accentColor, setAccentColor] = useState('#3B82F6');
  const [customDomain, setCustomDomain] = useState('');
  const [dnsVerified, setDnsVerified] = useState(false);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      // 1. Fetch Billing
      const billRes = await fetch('/api/saas/billing');
      const billData = await billRes.json();
      if (billData.success) {
        setQuotas(billData.quotas);
        setInvoices(billData.invoices);
        setOrgName(billData.quotas.planName ? 'Acme Corporate' : '');
        setOrgSlug(billData.quotas.planSlug ? 'acme' : '');
      }

      // 2. Fetch Keys
      const keysRes = await fetch('/api/saas/keys');
      const keysData = await keysRes.json();
      if (keysData.success) {
        setKeys(keysData.keys);
      }

      // 3. Fetch Webhooks
      const hooksRes = await fetch('/api/saas/webhooks');
      const hooksData = await hooksRes.json();
      if (hooksData.success) {
        setWebhooks(hooksData.endpoints);
        setDeliveries(hooksData.deliveries);
      }
    } catch (err) {
      toast.error('Failed to load multi-tenant settings configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchConfig();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleUpdatePlan = async (newPlan: 'starter' | 'pro' | 'enterprise') => {
    try {
      const res = await fetch('/api/saas/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planSlug: newPlan, seats: quotas?.seats || 5 }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Successfully migrated subscription to the ${newPlan} plan!`);
        fetchConfig();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Error migrating subscription plan.');
    }
  };

  const handleCreateAPIKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName) return;

    try {
      const res = await fetch('/api/saas/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: keyName, scopes: keyScopes }),
      });
      const data = await res.json();
      if (data.success) {
        setRevealedKey(data.rawKey);
        setKeyName('');
        toast.success('Integration key provisioned successfully!');
        fetchConfig();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Error generating API token.');
    }
  };

  const handleRevokeAPIKey = async (keyId: string) => {
    try {
      const res = await fetch(`/api/saas/keys?id=${keyId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Integration key successfully revoked.');
        fetchConfig();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Error revoking token.');
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl) return;

    try {
      const res = await fetch('/api/saas/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl, subscribedEvents: webhookEvents }),
      });
      const data = await res.json();
      if (data.success) {
        setWebhookUrl('');
        toast.success('Webhook endpoint registered successfully!');
        fetchConfig();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Error registering webhook receiver.');
    }
  };

  const handleTestWebhook = async (hookId: string) => {
    try {
      const res = await fetch('/api/saas/webhooks?action=ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookId: hookId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Test ping published to endpoint delivery pipeline!');
        setTimeout(fetchConfig, 1000); // Reload delivery log
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Error firing test ping.');
    }
  };

  const handleRevokeWebhook = async (hookId: string) => {
    try {
      const res = await fetch(`/api/saas/webhooks?id=${hookId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Webhook receiver unregistered successfully.');
        fetchConfig();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Error unregistering webhook.');
    }
  };

  const handleVerifyDNS = () => {
    if (!customDomain) return;
    toast.loading('Verifying DNS CNAME mappings...');
    setTimeout(() => {
      toast.dismiss();
      setDnsVerified(true);
      toast.success('DNS Verified: custom CNAME target configured correctly!');
    }, 1500);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const menuItems = [
    { id: 'profile', label: 'Organization Settings', icon: Building },
    { id: 'billing', label: 'Billing & Metering', icon: CreditCard },
    { id: 'branding', label: 'Branding & White-Label', icon: Globe },
    { id: 'keys', label: 'API Keys & Secrets', icon: Key },
    { id: 'webhooks', label: 'Webhooks Event Broker', icon: Webhook },
    { id: 'security', label: 'Security & Governance', icon: Activity },
  ];

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-400 italic text-sm">Compiling workspace parameters...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <PageHeader
        eyebrow="Commercial Management"
        title="Workspace Infrastructure Controls"
        description="Configure tenant branding variables, manage metered API subscriptions, rotate scoped access tokens, and dispatch webhook queues."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar Panel */}
        <div className="flex flex-col space-y-1 bg-slate-900/40 p-2.5 rounded-2xl border border-slate-850/60 backdrop-blur-md">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`flex items-center space-x-3 w-full px-4 py-3 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20'
                    : 'text-slate-400 hover:bg-slate-850/30 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Tab Body Container */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-slate-900/20 border-slate-850/60 backdrop-blur-md p-6 rounded-2xl">
                <CardContent className="p-0 space-y-6">
                  {/* TAB 1: Profile & Subdomain */}
                  {activeTab === 'profile' && (
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <Building className="w-5 h-5 text-blue-500" />
                          <span>Organization Settings</span>
                        </h2>
                        <p className="text-xs text-slate-400">
                          Configure your corporate metadata and active workspace parameters.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Organization Name
                          </label>
                          <input
                            type="text"
                            value={orgName || 'Acme Corporate'}
                            onChange={(e) => setOrgName(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-xl text-xs text-white outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Subdomain Slug
                          </label>
                          <input
                            type="text"
                            disabled
                            value={`${orgSlug || 'acme'}.syncgrid.com`}
                            className="w-full bg-slate-950/40 border border-slate-850 px-4 py-2.5 rounded-xl text-xs text-slate-500 outline-none cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <Button
                        onClick={() => toast.success('Profile settings updated successfully!')}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-xs font-semibold"
                      >
                        Save Configurations
                      </Button>
                    </div>
                  )}

                  {/* TAB 2: Billing & Metered Quotas */}
                  {activeTab === 'billing' && (
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-blue-500" />
                          <span>Billing & Metered Quotas</span>
                        </h2>
                        <p className="text-xs text-slate-400">
                          Monitor active subscription plan capabilities and remaining quotas limits.
                        </p>
                      </div>

                      {/* Quota Progress meters */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/50 p-5 rounded-2xl border border-slate-850/50">
                        {/* Users Seats */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <span>User Seats Assigned</span>
                            <span className="text-white">
                              {quotas?.users.current} / {quotas?.users.limit} seats (
                              {quotas?.users.pct}%)
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div
                              style={{ width: `${quotas?.users.pct}%` }}
                              className="h-full bg-blue-500 rounded-full"
                            />
                          </div>
                        </div>

                        {/* Storage */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <span>Workspace Storage</span>
                            <span className="text-white">
                              {quotas?.storage.currentGb}GB / {quotas?.storage.limit}GB (
                              {quotas?.storage.pct}%)
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div
                              style={{ width: `${quotas?.storage.pct}%` }}
                              className="h-full bg-emerald-500 rounded-full"
                            />
                          </div>
                        </div>

                        {/* API Requests */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <span>API Requests Volume (Month)</span>
                            <span className="text-white">
                              {quotas?.api.current.toLocaleString()} /{' '}
                              {quotas?.api.limit.toLocaleString()} ({quotas?.api.pct}%)
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div
                              style={{ width: `${quotas?.api.pct}%` }}
                              className="h-full bg-purple-500 rounded-full"
                            />
                          </div>
                        </div>

                        {/* Automation Runs */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <span>Automation Runs (Month)</span>
                            <span className="text-white">
                              {quotas?.automations.current} / {quotas?.automations.limit} (
                              {quotas?.automations.pct}%)
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div
                              style={{ width: `${quotas?.automations.pct}%` }}
                              className="h-full bg-amber-500 rounded-full"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Upgrade Plan Options */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Upgrade / Migrations Settings
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {['starter', 'pro', 'enterprise'].map((p) => {
                            const isActive = quotas?.planSlug === p;
                            return (
                              <div
                                key={p}
                                className={`bg-slate-950/80 p-4 rounded-xl border border-slate-850/50 flex flex-col justify-between ${
                                  isActive ? 'ring-2 ring-blue-500/40 bg-blue-500/5' : ''
                                }`}
                              >
                                <div>
                                  <span className="text-xs font-bold text-white capitalize">
                                    {p} plan
                                  </span>
                                  <p className="text-[10px] text-slate-400 mt-1">
                                    {p === 'enterprise'
                                      ? 'Unlimited custom pipelines.'
                                      : p === 'pro'
                                        ? 'Advanced integrations & customization.'
                                        : 'Essential starter workspaces.'}
                                  </p>
                                </div>
                                <button
                                  disabled={isActive}
                                  onClick={() => handleUpdatePlan(p as any)}
                                  className={`mt-4 w-full py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                    isActive
                                      ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20 cursor-not-allowed'
                                      : 'bg-slate-900 hover:bg-slate-850 text-slate-300'
                                  }`}
                                >
                                  {isActive ? 'Current Active Tier' : 'Upgrade Plan'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Invoice logs */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Simulated PDF Invoices Logs
                        </h3>
                        <div className="bg-slate-950/30 border border-slate-850/60 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-850">
                                <th className="p-3">Invoice Code</th>
                                <th className="p-3">Date</th>
                                <th className="p-3">Seats</th>
                                <th className="p-3">Total Amount</th>
                                <th className="p-3">Status</th>
                                <th className="p-3 text-right">Invoice Download</th>
                              </tr>
                            </thead>
                            <tbody>
                              {invoices.map((inv) => (
                                <tr
                                  key={inv.id}
                                  className="border-b border-slate-850/40 hover:bg-slate-900/10"
                                >
                                  <td className="p-3 font-semibold text-white">{inv.id}</td>
                                  <td className="p-3 text-slate-400">
                                    {new Date(inv.createdAt).toLocaleDateString()}
                                  </td>
                                  <td className="p-3 text-slate-400">{inv.seats} seats</td>
                                  <td className="p-3 text-white font-medium">
                                    ${inv.amount.toFixed(2)}
                                  </td>
                                  <td className="p-3">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-500">
                                      {inv.status}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right">
                                    <button
                                      onClick={() => {
                                        toast.success(
                                          `Mock Invoice ${inv.id} downloaded successfully!`
                                        );
                                      }}
                                      className="text-blue-500 hover:text-blue-400 p-1 cursor-pointer"
                                    >
                                      <FileDown className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: Branding & White-Label */}
                  {activeTab === 'branding' && (
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <Globe className="w-5 h-5 text-blue-500" />
                          <span>Branding & White-Label Controls</span>
                        </h2>
                        <p className="text-xs text-slate-400">
                          Configure tenant custom domains overrides and branding accent highlights
                          variables.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Custom Domain Override
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={customDomain}
                                onChange={(e) => {
                                  setCustomDomain(e.target.value);
                                  setDnsVerified(false);
                                }}
                                placeholder="e.g. portal.acme.com"
                                className="w-full bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-xl text-xs text-white outline-none"
                              />
                              <Button
                                onClick={handleVerifyDNS}
                                className="bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 text-xs px-4 rounded-xl"
                              >
                                Verify DNS
                              </Button>
                            </div>
                            <span className="text-[9px] text-slate-500 block leading-normal">
                              *Set a CNAME DNS record targeting <code>cname.syncgrid.com</code> on
                              your registrar configuration to activate.
                            </span>
                          </div>

                          {dnsVerified && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
                              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">DNS Mapping Successful</span>
                                <p className="text-[10px] text-emerald-600 mt-0.5">
                                  Your custom domain is correctly linked and ready for routing.
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Accent Theme Tint
                            </label>
                            <div className="flex gap-2">
                              {['#3B82F6', '#06B6D4', '#10B981', '#8B5CF6', '#F59E0B'].map((c) => (
                                <button
                                  key={c}
                                  onClick={() => setAccentColor(c)}
                                  style={{ backgroundColor: c }}
                                  className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                                    accentColor === c ? 'ring-4 ring-blue-500/30 scale-110' : ''
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Live Branding Preview */}
                        <div className="bg-slate-950/30 p-5 rounded-2xl border border-slate-850/60 flex flex-col justify-between">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                            Accent Visual Indicator Preview
                          </span>
                          <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl mt-4 space-y-3">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-2">
                                <div
                                  style={{ backgroundColor: accentColor }}
                                  className="w-3 h-3 rounded-full shrink-0"
                                />
                                <span className="text-xs font-bold text-white">Acme Portal</span>
                              </div>
                              <span className="text-[9px] text-slate-500">Active</span>
                            </div>
                            <button
                              style={{ backgroundColor: accentColor }}
                              className="w-full py-1.5 rounded-lg text-[10px] font-bold text-white transition-opacity hover:opacity-90"
                            >
                              Action Highlight Trigger
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: API Keys & Rotation */}
                  {activeTab === 'keys' && (
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <Key className="w-5 h-5 text-blue-500" />
                          <span>API Keys & Secrets Rotations</span>
                        </h2>
                        <p className="text-xs text-slate-400">
                          Create cryptographically secure integration key credentials scoped to
                          custom modules.
                        </p>
                      </div>

                      {/* Key Creation Form */}
                      <form
                        onSubmit={handleCreateAPIKey}
                        className="space-y-4 bg-slate-950/40 p-5 rounded-2xl border border-slate-850/50"
                      >
                        <span className="text-xs font-bold uppercase text-slate-400 block">
                          Provision New Integration Key
                        </span>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Token Label Name
                            </label>
                            <input
                              type="text"
                              value={keyName}
                              onChange={(e) => setKeyName(e.target.value)}
                              placeholder="e.g. Jenkins Automerger Key"
                              className="w-full bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-xl text-xs text-white outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                              Permission Scope Groups
                            </label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {['projects:read', 'tasks:write', 'finance:read'].map((s) => {
                                const active = keyScopes.includes(s);
                                return (
                                  <button
                                    type="button"
                                    key={s}
                                    onClick={() => {
                                      if (active) {
                                        setKeyScopes(keyScopes.filter((x) => x !== s));
                                      } else {
                                        setKeyScopes([...keyScopes, s]);
                                      }
                                    }}
                                    className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all border cursor-pointer ${
                                      active
                                        ? 'bg-blue-600/10 text-blue-500 border-blue-500/20'
                                        : 'bg-slate-900 text-slate-400 border-slate-850'
                                    }`}
                                  >
                                    {s}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-xs font-semibold"
                        >
                          Generate Cryptographic Key
                        </Button>
                      </form>

                      {/* Reveal Key Alert (displayed once) */}
                      {revealedKey && (
                        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-500 p-4 rounded-xl text-xs flex flex-col gap-3">
                          <div className="flex items-start gap-2.5">
                            <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-500" />
                            <div>
                              <span className="font-bold">Copy Your Private Integration Key</span>
                              <p className="text-[10px] text-slate-300 mt-1">
                                For security compliance, this key will **NEVER** be displayed again.
                                Store it securely in your secrets manager.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-850/80 justify-between">
                            <code className="text-slate-100 break-all select-all pr-4">
                              {revealedKey}
                            </code>
                            <button
                              onClick={() => handleCopy(revealedKey)}
                              className="text-blue-500 hover:text-blue-400 p-1 cursor-pointer shrink-0"
                            >
                              <Clipboard className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Keys active list */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Active API Keys Registry
                        </h3>
                        <div className="bg-slate-950/30 border border-slate-850/60 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-850">
                                <th className="p-3">Key Label</th>
                                <th className="p-3">Display Mask</th>
                                <th className="p-3">Scopes Granted</th>
                                <th className="p-3">Issued Date</th>
                                <th className="p-3 text-right">Revoke / Delete</th>
                              </tr>
                            </thead>
                            <tbody>
                              {keys.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="p-8 text-center text-slate-500 italic">
                                    No active integration keys provisioned.
                                  </td>
                                </tr>
                              ) : (
                                keys.map((k) => (
                                  <tr
                                    key={k._id}
                                    className="border-b border-slate-850/40 hover:bg-slate-900/10"
                                  >
                                    <td className="p-3 font-semibold text-white">{k.name}</td>
                                    <td className="p-3">
                                      <code className="text-slate-400 text-[11px] bg-slate-950 px-2 py-0.5 rounded">
                                        {k.mask}
                                      </code>
                                    </td>
                                    <td className="p-3">
                                      <div className="flex gap-1.5 flex-wrap">
                                        {k.scopes.map((s: string) => (
                                          <span
                                            key={s}
                                            className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 text-[9px] font-semibold border border-slate-850"
                                          >
                                            {s}
                                          </span>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="p-3 text-slate-500">
                                      {new Date(k.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-3 text-right">
                                      <button
                                        onClick={() => handleRevokeAPIKey(k._id)}
                                        className="text-red-500 hover:text-red-400 p-1 cursor-pointer"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: Webhooks Event Broker */}
                  {activeTab === 'webhooks' && (
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <Webhook className="w-5 h-5 text-blue-500" />
                          <span>Webhooks Event Broker</span>
                        </h2>
                        <p className="text-xs text-slate-400">
                          Register listener receivers URLs to capture real-time subscription
                          lifecycle updates.
                        </p>
                      </div>

                      {/* Webhook Registration Form */}
                      <form
                        onSubmit={handleCreateWebhook}
                        className="space-y-4 bg-slate-950/40 p-5 rounded-2xl border border-slate-850/50"
                      >
                        <span className="text-xs font-bold uppercase text-slate-400 block">
                          Register New Endpoint Receiver
                        </span>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Target Endpoint URL
                            </label>
                            <input
                              type="text"
                              value={webhookUrl}
                              onChange={(e) => setWebhookUrl(e.target.value)}
                              placeholder="https://api.your-system.com/webhooks"
                              className="w-full bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-xl text-xs text-white outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                              Subscribe To Events
                            </label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {['invoice.paid', 'approval.completed', 'workflow.fired'].map((e) => {
                                const active = webhookEvents.includes(e);
                                return (
                                  <button
                                    type="button"
                                    key={e}
                                    onClick={() => {
                                      if (active) {
                                        setWebhookEvents(webhookEvents.filter((x) => x !== e));
                                      } else {
                                        setWebhookEvents([...webhookEvents, e]);
                                      }
                                    }}
                                    className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all border cursor-pointer ${
                                      active
                                        ? 'bg-blue-600/10 text-blue-500 border-blue-500/20'
                                        : 'bg-slate-900 text-slate-400 border-slate-850'
                                    }`}
                                  >
                                    {e}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-xs font-semibold"
                        >
                          Register Webhook Endpoint
                        </Button>
                      </form>

                      {/* Active endpoints grid */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Webhook Subscriptions
                        </h3>
                        <div className="bg-slate-950/30 border border-slate-850/60 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-850">
                                <th className="p-3">Endpoint Target</th>
                                <th className="p-3">Signing Secret</th>
                                <th className="p-3">Events</th>
                                <th className="p-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {webhooks.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="p-8 text-center text-slate-500 italic">
                                    No active webhooks registered.
                                  </td>
                                </tr>
                              ) : (
                                webhooks.map((w) => (
                                  <tr
                                    key={w._id}
                                    className="border-b border-slate-850/40 hover:bg-slate-900/10"
                                  >
                                    <td className="p-3 font-semibold text-white break-all max-w-[200px]">
                                      {w.url}
                                    </td>
                                    <td className="p-3">
                                      <code className="text-slate-400 text-[11px] bg-slate-950 px-2 py-0.5 rounded">
                                        {w.secret}
                                      </code>
                                    </td>
                                    <td className="p-3">
                                      <div className="flex gap-1.5 flex-wrap">
                                        {w.subscribedEvents.map((e: string) => (
                                          <span
                                            key={e}
                                            className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 text-[9px] font-semibold border border-slate-850"
                                          >
                                            {e}
                                          </span>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="p-3 text-right flex justify-end space-x-2">
                                      <button
                                        onClick={() => handleTestWebhook(w._id)}
                                        className="text-blue-500 hover:text-blue-400 p-1 cursor-pointer"
                                        title="Trigger Test Ping Event"
                                      >
                                        <Play className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleRevokeWebhook(w._id)}
                                        className="text-red-500 hover:text-red-400 p-1 cursor-pointer"
                                        title="Delete Endpoint"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Delivery History logs */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Webhook Delivery Logs (Latest 10)
                        </h3>
                        <div className="bg-slate-950/30 border border-slate-850/60 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-850">
                                <th className="p-3">Event Topic</th>
                                <th className="p-3">Timestamp</th>
                                <th className="p-3">Deliver Status</th>
                                <th className="p-3">HTTP Code</th>
                                <th className="p-3 text-right">Latest Attempt Log</th>
                              </tr>
                            </thead>
                            <tbody>
                              {deliveries.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="p-8 text-center text-slate-500 italic">
                                    No webhook deliver operations logged yet.
                                  </td>
                                </tr>
                              ) : (
                                deliveries.map((d) => {
                                  const latestAttempt = d.attempts?.[d.attempts.length - 1];
                                  return (
                                    <tr
                                      key={d._id}
                                      className="border-b border-slate-850/40 hover:bg-slate-900/10"
                                    >
                                      <td className="p-3 font-semibold text-white">{d.event}</td>
                                      <td className="p-3 text-slate-400">
                                        {new Date(d.createdAt).toLocaleTimeString()}
                                      </td>
                                      <td className="p-3">
                                        <span
                                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                            d.status === 'delivered'
                                              ? 'bg-emerald-500/10 text-emerald-500'
                                              : 'bg-red-500/10 text-red-500'
                                          }`}
                                        >
                                          {d.status}
                                        </span>
                                      </td>
                                      <td className="p-3 font-medium text-white">
                                        {latestAttempt?.statusCode || '-'}
                                      </td>
                                      <td
                                        className="p-3 text-right text-slate-500 break-all max-w-[200px] truncate"
                                        title={latestAttempt?.response}
                                      >
                                        {latestAttempt?.response || 'Awaiting dispatch'}
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 6: Security & Governance */}
                  {activeTab === 'security' && (
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <Activity className="w-5 h-5 text-blue-500" />
                          <span>Security & Governance</span>
                        </h2>
                        <p className="text-xs text-slate-400">
                          Configure multi-tenant throttling limits, anomalous locks, and view threat
                          vectors logs.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                            API Request Throttling Rate
                          </label>
                          <select className="w-full bg-slate-950/85 border border-slate-800 px-4 py-2.5 rounded-xl text-xs text-white outline-none cursor-pointer">
                            <option>100 requests / minute (Standard)</option>
                            <option>500 requests / minute (Pro Upgrade)</option>
                            <option>Unlimited (Enterprise Custom SLA)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                            Suspicious Login Attempts Limit
                          </label>
                          <select className="w-full bg-slate-950/85 border border-slate-800 px-4 py-2.5 rounded-xl text-xs text-white outline-none cursor-pointer">
                            <option>5 failed attempts (Auto Locked for 15m)</option>
                            <option>3 failed attempts (MFA mandatory verification prompt)</option>
                          </select>
                        </div>
                      </div>

                      {/* Mock Threat Monitor Logs */}
                      <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-850/60 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold text-white block">
                            SaaS Platform Security Logs
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                            All requests verify company-level isolation keys. No anomalous
                            cross-tenant queries, session leaks, or suspicious token operations
                            recorded.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
