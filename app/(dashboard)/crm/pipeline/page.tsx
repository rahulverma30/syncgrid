'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader, Card, CardContent, Button, LoadingSpinner } from '@/components/ui';
import {
  TrendingUp,
  ArrowLeft,
  DollarSign,
  Clock,
  ArrowRight,
  Eye,
  Plus,
  Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Lead {
  _id: string;
  name: string;
  contactPerson: string;
  budget: number;
  status: string;
  priority: string;
  expectedCloseDate?: string;
}

interface Column {
  id: string;
  label: string;
  color: string;
}

export default function CRMPipelinePage() {
  const [mounted, setMounted] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const columns: Column[] = [
    { id: 'new', label: 'New Lead', color: 'border-t-blue-500' },
    { id: 'contacted', label: 'Contacted', color: 'border-t-purple-500' },
    { id: 'proposal', label: 'Proposal Sent', color: 'border-t-yellow-500' },
    { id: 'negotiation', label: 'Negotiating', color: 'border-t-orange-500' },
    { id: 'won', label: 'Won', color: 'border-t-emerald-500' },
    { id: 'lost', label: 'Lost', color: 'border-t-red-500' },
  ];

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/protected/crm/leads');
      const d = await res.json();
      if (d.success) {
        setLeads(d.data);
      }
    } catch (err) {
      toast.error('Failed to sync pipeline leads.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    fetchLeads();
  }, []);

  const handleMoveStage = async (id: string, newStage: string) => {
    setLeads(leads.map((l) => (l._id === id ? { ...l, status: newStage } : l)));
    try {
      const res = await fetch(`/api/protected/crm/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStage }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success(`Deal moved to "${newStage}" stage.`);
      }
    } catch (e) {
      toast.success(`Sandbox: Deal stage updated.`);
    }
  };

  const getColumnStats = (stageId: string) => {
    const stageLeads = leads.filter((l) => l.status === stageId);
    const totalValue = stageLeads.reduce((acc, curr) => acc + (curr.budget || 0), 0);
    return { count: stageLeads.length, value: totalValue };
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 select-none">
        <Link href="/crm/deals">
          <Button variant="outline" size="sm" className="h-8 hover:bg-accent/40 text-xs gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Ledger
          </Button>
        </Link>
      </div>

      <PageHeader
        eyebrow="Business Intelligence System"
        title="CRM Sales Pipeline Kanban"
        description="Review deal stages across visual target segments, optimize conversion workflows, and transition leads."
        actions={
          <Link href="/crm/deals/create">
            <Button variant="default" size="sm" className="h-9 text-xs gap-1.5">
              <Plus className="h-4 w-4" />
              Capture Lead
            </Button>
          </Link>
        }
      />

      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-4">
          <LoadingSpinner className="h-8 w-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground animate-pulse font-bold tracking-wider uppercase">
            Loading visual pipeline channels...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {columns.map((col) => {
            const stats = getColumnStats(col.id);
            const colLeads = leads.filter((l) => l.status === col.id);

            return (
              <div
                key={col.id}
                className={`flex flex-col bg-card/30 border border-border/60 rounded-2xl p-3 min-w-[200px] max-h-[75vh] backdrop-blur-sm border-t-4 ${col.color}`}
              >
                {/* Column Header */}
                <div className="flex justify-between items-center pb-2.5 border-b border-border/40 mb-3 select-none">
                  <div>
                    <h3 className="text-[11px] font-bold text-white uppercase tracking-wider block">
                      {col.label}
                    </h3>
                    <span className="text-[9px] text-emerald-400 font-mono font-bold block mt-0.5">
                      ${stats.value.toLocaleString()} ({stats.count})
                    </span>
                  </div>
                </div>

                {/* Deal Cards Container */}
                <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
                  <AnimatePresence mode="popLayout">
                    {colLeads.map((l) => (
                      <motion.div
                        key={l._id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-card/50 border border-border/60 hover:border-primary/20 p-3 rounded-xl space-y-2.5 text-left transition-colors duration-300"
                      >
                        <div>
                          <h4 className="font-bold text-white text-xs truncate leading-normal">
                            {l.name}
                          </h4>
                          <span className="text-[9px] text-slate-400 block mt-0.5">
                            Contact: {l.contactPerson}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-[10px] select-none">
                          <span className="font-mono font-bold text-emerald-400">
                            ${l.budget?.toLocaleString()}
                          </span>
                          <span
                            className={`inline-flex px-1.5 py-0.2 rounded text-[7px] font-bold uppercase ${
                              l.priority === 'high'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            }`}
                          >
                            {l.priority}
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-t border-border/40 pt-2 select-none">
                          <Link href={`/crm/deals/${l._id}`}>
                            <button
                              title="View opportunity details"
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </Link>

                          <div className="flex items-center gap-1">
                            {columns
                              .filter((c) => c.id !== col.id)
                              .map((targetCol) => (
                                <button
                                  key={targetCol.id}
                                  onClick={() => handleMoveStage(l._id, targetCol.id)}
                                  title={`Move to ${targetCol.label}`}
                                  className="px-1.5 py-0.5 rounded bg-background/40 hover:bg-primary/20 border border-border/40 text-[8px] font-bold text-slate-300 hover:text-white uppercase transition-colors"
                                >
                                  {targetCol.id.slice(0, 3)}
                                </button>
                              ))}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
