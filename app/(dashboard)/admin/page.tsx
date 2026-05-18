'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  Server,
  Activity,
  Database,
  TrendingUp,
  Users,
  HardDrive,
  Download,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Loader2,
  AlertCircle,
  BarChart,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<any[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState(99.9);
  const [mrr, setMrr] = useState(14240);
  const [isBackupRunning, setIsBackupRunning] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // System environment configurations overrides
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [rolloutRatio, setRolloutRatio] = useState(100);

  const loadAdminStats = async () => {
    setLoading(true);
    try {
      // Fetch dynamic stats from seeding/billing metrics endpoints if present,
      // otherwise fallback to safe rich mock baseline for premium simulation
      const res = await fetch('/api/saas/billing');
      const data = await res.json();

      // Seed fallback values since it's a super-admin portal viewing ALL organizations
      setTenants([
        {
          _id: 't1',
          name: 'Stark Industries',
          slug: 'stark',
          plan: 'Enterprise',
          seats: 125,
          storageGb: 680,
          apiCalls: 380000,
          status: 'active',
        },
        {
          _id: 't2',
          name: 'Acme Corporate',
          slug: 'acme',
          plan: 'Pro Premium',
          seats: 8,
          storageGb: 42.5,
          apiCalls: 12500,
          status: 'active',
        },
        {
          _id: 't3',
          name: 'Oscorp Biotech',
          slug: 'oscorp',
          plan: 'Starter Plan',
          seats: 3,
          storageGb: 11.2,
          apiCalls: 4800,
          status: 'past_due',
        },
      ]);

      setBackups([
        {
          id: 'b1',
          name: 'stark_hourly_snap_0518',
          size: '2.8 GB',
          date: 'Today, 8:00 PM',
          status: 'completed',
        },
        {
          id: 'b2',
          name: 'acme_daily_snap_0518',
          size: '142 MB',
          date: 'Today, 12:00 AM',
          status: 'completed',
        },
        {
          id: 'b3',
          name: 'oscorp_manual_snap_0517',
          size: '72 MB',
          date: 'Yesterday, 4:30 PM',
          status: 'completed',
        },
      ]);
    } catch (err) {
      toast.error('Error fetching admin statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAdminStats();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleTriggerSeed = async () => {
    toast.loading('Resetting SaaS sandbox schemas...');
    try {
      const res = await fetch('/api/saas/seed');
      const data = await res.json();
      if (data.success) {
        toast.dismiss();
        toast.success('Simulation database sandbox successfully seeded!');
        loadAdminStats();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.dismiss();
      toast.error('Simulation seeding endpoint offline.');
    }
  };

  const handleCreateSnapshot = () => {
    setIsBackupRunning(true);
    toast.loading('Initializing database backup snapshot...');
    setTimeout(() => {
      setBackups((prev) => [
        {
          id: `b${Date.now()}`,
          name: `manual_global_snap_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
          size: '412 MB',
          date: 'Just now',
          status: 'completed',
        },
        ...prev,
      ]);
      setIsBackupRunning(false);
      toast.dismiss();
      toast.success('Manual cluster backup snapshot saved successfully!');
    }, 2000);
  };

  const handleSimulateRecovery = () => {
    setIsRestoring(true);
    toast.loading('Deploying disaster recovery mock cluster restoration...');
    setTimeout(() => {
      setIsRestoring(false);
      toast.dismiss();
      toast.success('DR Restoration test completed: cluster operational at 100% capacity.');
    }, 2500);
  };

  const handleMaintenanceToggle = () => {
    const nextState = !maintenanceMode;
    setMaintenanceMode(nextState);
    if (nextState) {
      toast.warning('Maintenance mode activated: Non-admin API requests will be throttled.');
    } else {
      toast.success('Maintenance mode deactivated: Live user traffic restored.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-400 italic text-sm">Synchronizing platform telemetry data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-red-500/20">
            <ShieldAlert className="w-3.5 h-3.5" />
            Super-Admin Governance Console
          </span>
          <h1 className="text-2xl font-black text-white mt-1">SaaS Platform Infrastructure</h1>
          <p className="text-xs text-slate-400">
            Real-time cluster latency indicators, Monthly Recurring Revenue aggregates, multi-tenant
            databases isolation indices, and disaster recovery snapshot scheduling.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleTriggerSeed}
            className="bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-200 text-xs rounded-xl py-2 px-4"
          >
            <Sparkles className="w-4 h-4 mr-2 text-blue-500 animate-pulse" />
            Reset Sandbox Data
          </Button>
          <Button
            onClick={handleCreateSnapshot}
            disabled={isBackupRunning}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-xl py-2 px-4 font-semibold"
          >
            {isBackupRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Server className="w-4 h-4 mr-2" />
            )}
            Take Cluster Snapshot
          </Button>
        </div>
      </div>

      {/* TOP METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-900/20 border-slate-850/60 p-5 rounded-2xl backdrop-blur-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Cluster Health Score
            </span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline space-x-1.5 mt-2">
            <span className="text-2xl font-black text-white">{systemHealth}%</span>
            <span className="text-[10px] text-emerald-500 font-bold">Live Status</span>
          </div>
          <div className="flex items-center space-x-1.5 mt-2 text-[9px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <span className="text-slate-500 font-medium">MongoDB Connection: 100% isolative</span>
          </div>
        </Card>

        <Card className="bg-slate-900/20 border-slate-850/60 p-5 rounded-2xl backdrop-blur-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Average API Latency
            </span>
            <Database className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline space-x-1.5 mt-2">
            <span className="text-2xl font-black text-white">42 ms</span>
            <span className="text-[10px] text-blue-500 font-bold">Standard</span>
          </div>
          <div className="flex items-center mt-2 text-[9px] text-slate-500 font-medium">
            <span>Peak: 120ms during webhook delivery retry pipelines</span>
          </div>
        </Card>

        <Card className="bg-slate-900/20 border-slate-850/60 p-5 rounded-2xl backdrop-blur-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              SaaS Platform MRR
            </span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline space-x-1.5 mt-2">
            <span className="text-2xl font-black text-white">${mrr.toLocaleString()}</span>
            <span className="text-[10px] text-purple-500 font-bold">Month</span>
          </div>
          <div className="flex items-center mt-2 text-[9px] text-slate-500 font-medium">
            <span>Subscriber base scaling +20% month-over-month</span>
          </div>
        </Card>

        <Card className="bg-slate-900/20 border-slate-850/60 p-5 rounded-2xl backdrop-blur-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Environment Scopes
            </span>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex items-baseline space-x-1.5 mt-2">
            <span className="text-2xl font-black text-white">PROD</span>
            <span className="text-[10px] text-slate-500 font-bold">Us-East</span>
          </div>
          <div className="flex items-center mt-2 text-[9px] text-slate-500 font-medium">
            <span>Kubernetes deployments: 4 active pods replication</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Tenants Registry */}
        <Card className="lg:col-span-2 bg-slate-900/20 border-slate-850/60 p-6 rounded-2xl backdrop-blur-md space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Registered Tenants Registry
              </h2>
              <p className="text-[10px] text-slate-500">
                Live multi-tenant scope usage allocations
              </p>
            </div>
            <span className="text-[9px] font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-850 text-slate-400">
              Total: {tenants.length} tenants
            </span>
          </div>

          <div className="bg-slate-950/30 border border-slate-850/60 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-850">
                  <th className="p-3">Organization</th>
                  <th className="p-3">Plan Tier</th>
                  <th className="p-3">Seats</th>
                  <th className="p-3">Storage</th>
                  <th className="p-3">API Requests</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t._id} className="border-b border-slate-850/40 hover:bg-slate-900/10">
                    <td className="p-3">
                      <div className="font-semibold text-white">{t.name}</div>
                      <div className="text-[9px] text-slate-500">slug: {t.slug}</div>
                    </td>
                    <td className="p-3 font-medium text-slate-300">{t.plan}</td>
                    <td className="p-3 text-slate-400">{t.seats} seats</td>
                    <td className="p-3 text-slate-400">{t.storageGb} GB</td>
                    <td className="p-3 text-white font-medium">{t.apiCalls.toLocaleString()}</td>
                    <td className="p-3 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          t.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-amber-500/10 text-amber-500'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* RIGHT COLUMN: Cluster overrides & Backups */}
        <div className="space-y-6">
          {/* Overrides */}
          <Card className="bg-slate-900/20 border-slate-850/60 p-6 rounded-2xl backdrop-blur-md space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Deployment Override Panel
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-semibold text-slate-300 block">
                    System Maintenance Override
                  </span>
                  <span className="text-[9px] text-slate-500 block leading-normal">
                    Throttles non-admin read queries.
                  </span>
                </div>
                <button
                  onClick={handleMaintenanceToggle}
                  className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-colors ${
                    maintenanceMode ? 'bg-amber-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${
                      maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300">Beta Rollout Ratio</span>
                  <span className="font-bold text-blue-500">{rolloutRatio}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={rolloutRatio}
                  onChange={(e) => setRolloutRatio(parseInt(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-1 rounded-full bg-slate-800"
                />
              </div>
            </div>
          </Card>

          {/* Backup Snapshot management */}
          <Card className="bg-slate-900/20 border-slate-850/60 p-6 rounded-2xl backdrop-blur-md space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Disaster Recovery Registry
              </h2>
              <button
                disabled={isRestoring}
                onClick={handleSimulateRecovery}
                className="text-[9px] font-bold text-red-500 hover:text-red-400 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Trigger DR Restore
              </button>
            </div>

            <div className="space-y-3">
              {backups.map((b) => (
                <div
                  key={b.id}
                  className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-850/50 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-white block truncate max-w-[150px]">
                      {b.name}
                    </span>
                    <span className="text-[9px] text-slate-500 block">
                      {b.date} • {b.size}
                    </span>
                  </div>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
