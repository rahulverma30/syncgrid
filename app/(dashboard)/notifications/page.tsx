'use client';

import React, { useState } from 'react';
import { PageHeader, Card, Button } from '@/components/ui';
import {
  Bell,
  Sparkles,
  ShieldAlert,
  Webhook,
  DollarSign,
  CheckCircle2,
  Trash2,
  Filter,
  Calendar,
  Settings,
  Clock,
  ArrowRight,
  ChevronDown,
  Sliders,
  X,
  Activity,
  UserPlus,
  Eye,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  category: 'security' | 'webhook' | 'billing' | 'system';
  title: string;
  description: string;
  time: string;
  date: string;
  read: boolean;
  meta?: {
    ip?: string;
    actor?: string;
    payload?: string;
    duration?: string;
  };
}

export default function NotificationsPage() {
  const [activeCategory, setActiveCategory] = useState<
    'all' | 'security' | 'webhook' | 'billing' | 'system'
  >('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Mock enterprise log feed
  const [logs, setLogs] = useState<AuditLog[]>([
    {
      id: 'log1',
      category: 'security',
      title: 'New API Access Key Generated',
      description:
        'API credential client pair "sg_live_79a2..." was successfully provisioned by Super Admin.',
      time: '14:24:05',
      date: 'Today',
      read: false,
      meta: {
        actor: 'Rahul Verma (Super Admin)',
        ip: '192.168.1.144',
        payload:
          '{\n  "name": "Corporate Webhook Sync Key",\n  "scope": "read-write",\n  "expiresAt": "2027-05-01"\n}',
      },
    },
    {
      id: 'log2',
      category: 'webhook',
      title: 'Webhook Event Fired: invoice.paid',
      description:
        'Dispatched outbound event receiver payload to https://api.stripe.com/v3/webhooks.',
      time: '13:02:11',
      date: 'Today',
      read: false,
      meta: {
        duration: '182ms',
        payload:
          '{\n  "event": "invoice.paid",\n  "recipient": "Stripe Receiver",\n  "statusCode": 200,\n  "body": "{\\"received\\": true}"\n}',
      },
    },
    {
      id: 'log3',
      category: 'billing',
      title: 'Subscription Invoice Settled',
      description:
        'Payment processed successfully for Enterprise Tier Custom SLA plan. Invoice #INV-2026-9041.',
      time: '10:45:00',
      date: 'Today',
      read: true,
      meta: {
        actor: 'Billing Engine',
        payload:
          '{\n  "amount": "$4,250.00",\n  "status": "cleared",\n  "method": "ACH Direct Debit"\n}',
      },
    },
    {
      id: 'log4',
      category: 'system',
      title: 'Multi-Tenant Throttling Guard Triggered',
      description:
        'Automatic anomaly detection temporarily rate-limited IP block 185.220.101.4 due to high burst activity.',
      time: '08:12:33',
      date: 'Today',
      read: false,
      meta: {
        actor: 'Shield Guard AI',
        ip: '185.220.101.4',
        payload:
          '{\n  "reason": "Request rate limit exceeded",\n  "burstRequests": 412,\n  "limit": 100,\n  "window": "60s"\n}',
      },
    },
    {
      id: 'log5',
      category: 'security',
      title: 'Team Specialist Invitation Accepted',
      description:
        'Member invitation for engineer.pro@syncgrid.io successfully verified and added to the CRM Operations unit.',
      time: 'Yesterday at 17:40',
      date: 'Yesterday',
      read: true,
      meta: {
        actor: 'System Auth',
        payload:
          '{\n  "email": "engineer.pro@syncgrid.io",\n  "role": "Project Manager",\n  "status": "active"\n}',
      },
    },
    {
      id: 'log6',
      category: 'system',
      title: 'Automated CRM Sync Pipeline Completed',
      description:
        'Sync pipeline executed: 1,480 contact parameters successfully matched across target databases.',
      time: 'Yesterday at 04:00',
      date: 'Yesterday',
      read: true,
      meta: {
        duration: '14.2s',
        payload:
          '{\n  "syncedRecords": 1480,\n  "duplicatesRemoved": 12,\n  "status": "completed"\n}',
      },
    },
  ]);

  // Preference Settings States
  const [prefBrowserAlerts, setPrefBrowserAlerts] = useState(true);
  const [prefWebhookAlerts, setPrefWebhookAlerts] = useState(true);
  const [prefSecurityAlerts, setPrefSecurityAlerts] = useState(true);

  // Filter logic
  const filteredLogs = logs.filter(
    (l) => activeCategory === 'all' || l.category === activeCategory
  );

  const unreadCount = logs.filter((l) => !l.read).length;

  const handleMarkAllRead = () => {
    setLogs(logs.map((l) => ({ ...l, read: true })));
    toast.success('All notifications marked as read.');
  };

  const handleClearLogs = () => {
    setLogs([]);
    toast.success('Timeline database log buffer cleared.');
  };

  const handleToggleRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLogs(logs.map((l) => (l.id === id ? { ...l, read: !l.read } : l)));
  };

  const handleSavePreferences = () => {
    toast.success('Security alert channels settings updated.');
  };

  // Helper icons and styles
  const getCategoryDetails = (category: string) => {
    switch (category) {
      case 'security':
        return {
          icon: <ShieldAlert className="h-4 w-4" />,
          color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
          label: 'Security & Auth',
        };
      case 'webhook':
        return {
          icon: <Webhook className="h-4 w-4" />,
          color: 'text-primary bg-primary/10 border-primary/20',
          label: 'Webhook Broker',
        };
      case 'billing':
        return {
          icon: <DollarSign className="h-4 w-4" />,
          color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
          label: 'Finance Billing',
        };
      default:
        return {
          icon: <Activity className="h-4 w-4" />,
          color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
          label: 'System Engine',
        };
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
            Security Intelligence Suite
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent mt-2">
            Activity Timeline & Audits
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
            Monitor real-time system logs, dispatch metrics, critical authorization attempts, and
            compliance signals across your enterprise workspace.
          </p>
        </div>

        <div className="flex items-center gap-2 select-none">
          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllRead}
              variant="outline"
              size="sm"
              className="h-9 hover:bg-accent/40 text-xs gap-1.5"
            >
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              Mark All Read
            </Button>
          )}
          {logs.length > 0 && (
            <Button
              onClick={handleClearLogs}
              variant="outline"
              size="sm"
              className="h-9 text-xs gap-1.5 border-red-500/20 hover:bg-red-500/10 hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Log Buffer
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Timeline Feed Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Timeline Filter Badges */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
            {[
              { id: 'all', label: 'All Operations' },
              { id: 'security', label: 'Security & Auth' },
              { id: 'webhook', label: 'Webhooks Broker' },
              { id: 'billing', label: 'Finance Billing' },
              { id: 'system', label: 'System Engine' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveCategory(tab.id as any);
                  setExpandedLogId(null);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                  activeCategory === tab.id
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/10'
                    : 'bg-card text-muted-foreground border-border/60 hover:border-border hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Audit Logs list */}
          <Card className="bg-card/40 border border-border/60 p-6 rounded-3xl backdrop-blur-md relative overflow-hidden">
            {filteredLogs.length === 0 ? (
              <div className="py-24 text-center space-y-4 select-none">
                <div className="h-14 w-14 rounded-full bg-primary/5 flex items-center justify-center text-primary/60 mx-auto border border-border/40">
                  <Bell className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">Zero Incidents Registered</h3>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Your real-time sync networks and multi-tenant security layers are fully
                    operational and uncompromised.
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative border-l-2 border-border/40 pl-5 ml-3 space-y-6">
                <AnimatePresence initial={false}>
                  {filteredLogs.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    const details = getCategoryDetails(log.category);

                    return (
                      <motion.div
                        key={log.id}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`group relative rounded-2xl border p-4 transition-all duration-300 ${
                          isExpanded
                            ? 'border-primary/40 bg-background/50 shadow-md'
                            : log.read
                              ? 'border-border/40 bg-background/10 hover:border-border hover:bg-background/25'
                              : 'border-primary/10 bg-primary/5 hover:border-primary/20'
                        }`}
                      >
                        {/* Timeline Connector Dot Node */}
                        <div
                          className={`absolute -left-[31px] top-5 h-4 w-4 rounded-full border-2 bg-card flex items-center justify-center transition-all ${
                            log.read
                              ? 'border-border/60 text-muted-foreground'
                              : 'border-primary text-primary animate-pulse shadow-md shadow-primary/20'
                          }`}
                        >
                          <div
                            className={`h-1.5 w-1.5 rounded-full ${log.read ? 'bg-muted-foreground/60' : 'bg-primary'}`}
                          />
                        </div>

                        {/* Log Item Header */}
                        <div
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="flex items-start justify-between gap-4 cursor-pointer"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${details.color}`}
                              >
                                {details.icon}
                                {details.label}
                              </span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                                <Clock className="h-3 w-3" />
                                {log.time}
                              </span>
                            </div>
                            <h4
                              className={`text-sm font-bold tracking-tight mt-1 transition-colors ${log.read ? 'text-foreground/80' : 'text-foreground font-black'}`}
                            >
                              {log.title}
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed pr-6">
                              {log.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 select-none">
                            <button
                              onClick={(e) => handleToggleRead(log.id, e)}
                              className={`p-1.5 rounded-lg border border-border/60 hover:bg-accent/40 text-muted-foreground hover:text-foreground transition-all`}
                              title={log.read ? 'Mark as Unread' : 'Mark as Read'}
                            >
                              {log.read ? (
                                <Clock className="h-3.5 w-3.5" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              )}
                            </button>
                            <ChevronDown
                              className={`h-4 w-4 text-muted-foreground/60 transition-transform ${isExpanded && 'rotate-180 text-primary'}`}
                            />
                          </div>
                        </div>

                        {/* Expanded Payload Data Details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden mt-4 pt-4 border-t border-border/40 space-y-3.5"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] font-semibold text-muted-foreground">
                                {log.meta?.actor && (
                                  <div className="bg-background/40 p-2.5 rounded-xl border border-border/40">
                                    <span className="text-[8px] uppercase tracking-wider block mb-0.5">
                                      Authorization Actor
                                    </span>
                                    <span className="text-foreground font-bold">
                                      {log.meta.actor}
                                    </span>
                                  </div>
                                )}
                                {log.meta?.ip && (
                                  <div className="bg-background/40 p-2.5 rounded-xl border border-border/40">
                                    <span className="text-[8px] uppercase tracking-wider block mb-0.5">
                                      IP Address
                                    </span>
                                    <span className="text-foreground font-mono font-bold">
                                      {log.meta.ip}
                                    </span>
                                  </div>
                                )}
                                {log.meta?.duration && (
                                  <div className="bg-background/40 p-2.5 rounded-xl border border-border/40">
                                    <span className="text-[8px] uppercase tracking-wider block mb-0.5">
                                      Execution Speed
                                    </span>
                                    <span className="text-foreground font-bold">
                                      {log.meta.duration}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {log.meta?.payload && (
                                <div className="bg-background/60 p-3 rounded-xl border border-border/60">
                                  <span className="text-[8px] font-extrabold uppercase tracking-widest text-muted-foreground block mb-2">
                                    JSON Payload Parameter Log
                                  </span>
                                  <pre className="font-mono text-[10px] text-emerald-400/90 whitespace-pre overflow-x-auto leading-relaxed select-all">
                                    {log.meta.payload}
                                  </pre>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar settings panel */}
        <div className="space-y-6 text-left select-none">
          {/* Summary stats card */}
          <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl backdrop-blur-md space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border/40 pb-2 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-primary" />
              <span>Workspace Audit Summary</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-background/40 p-3.5 rounded-xl border border-border/40">
                <span className="text-[9px] font-bold text-muted-foreground uppercase block leading-none">
                  Unread Events
                </span>
                <span className="text-foreground text-2xl font-black block mt-1.5 font-mono">
                  {unreadCount}
                </span>
              </div>
              <div className="bg-background/40 p-3.5 rounded-xl border border-border/40">
                <span className="text-[9px] font-bold text-muted-foreground uppercase block leading-none">
                  Total Logs
                </span>
                <span className="text-foreground text-2xl font-black block mt-1.5 font-mono">
                  {logs.length}
                </span>
              </div>
            </div>
          </Card>

          {/* Alert Channel Configurations Card */}
          <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl backdrop-blur-md space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border/40 pb-2 flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-primary" />
              <span>Notification Channels</span>
            </h3>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground block">
                    Browser Push Alerts
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    Show instant real-time browser flags.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPrefBrowserAlerts(!prefBrowserAlerts)}
                  className={`w-9 h-5 rounded-full transition-all border relative flex items-center p-0.5 cursor-pointer ${
                    prefBrowserAlerts
                      ? 'bg-primary border-primary justify-end'
                      : 'bg-background border-border/60 justify-start'
                  }`}
                >
                  <motion.div layout className="w-3.5 h-3.5 rounded-full bg-card shadow" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground block">
                    Webhook Operations Logs
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    Log dispatch history payloads.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPrefWebhookAlerts(!prefWebhookAlerts)}
                  className={`w-9 h-5 rounded-full transition-all border relative flex items-center p-0.5 cursor-pointer ${
                    prefWebhookAlerts
                      ? 'bg-primary border-primary justify-end'
                      : 'bg-background border-border/60 justify-start'
                  }`}
                >
                  <motion.div layout className="w-3.5 h-3.5 rounded-full bg-card shadow" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground block">
                    Critical Security Notices
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    Receive automatic email block warnings.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPrefSecurityAlerts(!prefSecurityAlerts)}
                  className={`w-9 h-5 rounded-full transition-all border relative flex items-center p-0.5 cursor-pointer ${
                    prefSecurityAlerts
                      ? 'bg-primary border-primary justify-end'
                      : 'bg-background border-border/60 justify-start'
                  }`}
                >
                  <motion.div layout className="w-3.5 h-3.5 rounded-full bg-card shadow" />
                </button>
              </div>

              <Button
                onClick={handleSavePreferences}
                variant="default"
                size="sm"
                className="w-full text-xs h-9 mt-2"
              >
                Save Channels Profile
              </Button>
            </div>
          </Card>

          {/* Developer integration advice */}
          <Card className="bg-primary/5 border border-primary/20 p-5 rounded-2xl backdrop-blur-md space-y-3">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Sparkles className="h-4 w-4" />
              Compliance Log Streaming
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Workspace activity events are stream-cached into your secure tenant partition and kept
              for 90 days. Need SIEM / Datadog integration? Contact enterprise support to provision
              syslog streaming credentials.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
