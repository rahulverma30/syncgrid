'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  ShieldCheck,
  Download,
  HelpCircle,
  FileCheck,
  Globe,
  Monitor,
  ListFilter,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { VirtualList } from '@/components/ui/virtual-list';
import { toast } from 'sonner';

export default function PortalActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLogs = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/portal/activity');
      const body = await res.json();
      if (body.success) {
        setLogs(body.data);
      } else {
        toast.error('Failed to retrieve security log feed.');
      }
    } catch (err) {
      toast.error('Failed to fetch activity timelines.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Filter logs whenever filterType or logs changes (Optimized using useMemo to avoid cascading renders)
  const filteredLogs = useMemo(() => {
    if (filterType === 'all') {
      return logs;
    }
    return logs.filter((log) => {
      if (filterType === 'login') return log.action.startsWith('login');
      if (filterType === 'file') return log.action === 'download_doc';
      if (filterType === 'ticket') return log.action === 'create_ticket';
      if (filterType === 'approval') return log.action === 'approve_deliverable';
      return true;
    });
  }, [filterType, logs]);

  const getActionIcon = (action: string) => {
    if (action.startsWith('login_fail')) {
      return <AlertTriangle className="w-5 h-5 text-rose-500" />;
    }
    if (action.startsWith('login')) {
      return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
    }
    if (action === 'download_doc') {
      return <Download className="w-5 h-5 text-blue-500" />;
    }
    if (action === 'create_ticket') {
      return <HelpCircle className="w-5 h-5 text-amber-500" />;
    }
    if (action === 'approve_deliverable') {
      return <FileCheck className="w-5 h-5 text-purple-500" />;
    }
    return <Clock className="w-5 h-5 text-slate-500" />;
  };

  const getActionClass = (action: string) => {
    if (action.startsWith('login_fail')) {
      return 'from-rose-500/10 to-transparent border-rose-500/15';
    }
    if (action.startsWith('login')) {
      return 'from-emerald-500/10 to-transparent border-emerald-500/15';
    }
    if (action === 'download_doc') {
      return 'from-blue-500/10 to-transparent border-blue-500/15';
    }
    if (action === 'create_ticket') {
      return 'from-amber-500/10 to-transparent border-amber-500/15';
    }
    if (action === 'approve_deliverable') {
      return 'from-purple-500/10 to-transparent border-purple-500/15';
    }
    return 'from-slate-500/10 to-transparent border-slate-500/15';
  };

  const renderTimelineItem = (log: any, index: number) => {
    return (
      <div className="px-1 py-1 h-[120px] w-full" key={log._id || index}>
        <Card
          className={`bg-gradient-to-r ${getActionClass(log.action)} border-slate-850 p-4 h-full rounded-2xl flex items-start justify-between shadow-sm relative overflow-hidden text-left`}
        >
          <div className="flex items-start space-x-3 min-w-0">
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-850 flex-shrink-0 mt-0.5">
              {getActionIcon(log.action)}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                {log.action.replace('_', ' ')} • {log.resource}
              </span>
              <p className="text-xs font-medium text-slate-200 mt-1 pr-4 leading-relaxed line-clamp-2">
                {log.details}
              </p>
              <div className="flex items-center space-x-4 mt-2 text-[9px] text-slate-500">
                <span className="flex items-center space-x-1">
                  <Globe className="w-3 h-3" />
                  <span>IP: {log.ipAddress}</span>
                </span>
                <span className="hidden sm:flex items-center space-x-1 truncate max-w-xs">
                  <Monitor className="w-3 h-3" />
                  <span className="truncate">{log.userAgent || 'Unknown Agent'}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <span className="text-[10px] font-bold text-slate-400 bg-slate-950 border border-slate-850 px-2 py-0.5 rounded">
              {log.portalUserName}
            </span>
            <span className="text-[9px] text-slate-550 block mt-2">
              {new Date(log.createdAt).toLocaleTimeString()}
            </span>
            <span className="text-[9px] text-slate-550 block">
              {new Date(log.createdAt).toLocaleDateString()}
            </span>
          </div>
        </Card>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 text-left">
        <Skeleton className="h-10 w-64 bg-slate-900 rounded-xl" />
        <Skeleton className="h-12 w-full bg-slate-900 rounded-xl" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full bg-slate-900 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Top Title Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <span>External Collaboration Timeline</span>
          </h1>
          <p className="text-xs text-slate-500">
            Enterprise audit-trail showing logins, document downloads, and approval actions
          </p>
        </div>

        <Button
          variant="outline"
          disabled={isRefreshing}
          className="border-slate-800 hover:bg-slate-850 text-slate-300 rounded-xl py-5"
          onClick={fetchLogs}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Timeline
        </Button>
      </div>

      {/* Filter Panel */}
      <div className="flex flex-wrap gap-2 items-center bg-slate-900/40 border border-slate-850 p-3 rounded-2xl">
        <div className="flex items-center space-x-2 text-xs text-slate-400 mr-2">
          <ListFilter className="w-3.5 h-3.5 text-blue-500" />
          <span>Category Filter:</span>
        </div>

        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors outline-none ${
            filterType === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-850'
          }`}
        >
          All Activities
        </button>

        <button
          onClick={() => setFilterType('login')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors outline-none ${
            filterType === 'login'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-850'
          }`}
        >
          Logins & Locks
        </button>

        <button
          onClick={() => setFilterType('file')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors outline-none ${
            filterType === 'file'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-850'
          }`}
        >
          Document Downloads
        </button>

        <button
          onClick={() => setFilterType('ticket')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors outline-none ${
            filterType === 'ticket'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-850'
          }`}
        >
          Helpdesk Tickets
        </button>

        <button
          onClick={() => setFilterType('approval')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors outline-none ${
            filterType === 'approval'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-850'
          }`}
        >
          Milestone Reviews
        </button>
      </div>

      {/* Main Virtual Timeline component */}
      {filteredLogs.length === 0 ? (
        <Card className="bg-slate-900/25 border-slate-850 p-12 rounded-3xl text-center">
          <p className="text-xs text-slate-500 italic">
            No activity matching selected category filter.
          </p>
        </Card>
      ) : (
        <div className="relative">
          <VirtualList
            items={filteredLogs}
            itemHeight={120}
            renderItem={(log, index) => renderTimelineItem(log, index)}
            containerHeight={550}
          />
        </div>
      )}
    </div>
  );
}
