'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader, Card, EmptyState, Select } from '@/components/ui';
import { HelpCircle, Clock, CheckCircle2, User, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminHelpdeskTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const url =
        filter === 'all'
          ? '/api/protected/crm/tickets'
          : `/api/protected/crm/tickets?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTickets(data.data);
      } else {
        toast.error('Failed to load tickets');
      }
    } catch (e) {
      toast.error('Network error loading tickets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/protected/crm/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Ticket marked as ${newStatus}`);
        fetchTickets();
      } else {
        toast.error('Failed to update ticket');
      }
    } catch (e) {
      toast.error('Network error updating ticket');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'high':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'low':
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
      default:
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'in-progress':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Helpdesk Tickets"
          description="Manage and resolve client support requests from the portal."
        />
        <div className="flex items-center gap-4">
          <Select
            value={filter}
            onChange={(val: any) => setFilter(val)}
            options={[
              { value: 'all', label: 'All Tickets' },
              { value: 'open', label: 'Open' },
              { value: 'in-progress', label: 'In Progress' },
              { value: 'resolved', label: 'Resolved' },
            ]}
          />
          <button
            onClick={fetchTickets}
            className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isLoading && tickets.length === 0 ? (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="w-8 h-8 text-slate-600 animate-spin" />
        </div>
      ) : tickets.length === 0 ? (
        <Card className="p-12 text-center bg-slate-900/40">
          <EmptyState
            title="No Tickets Found"
            description="There are no helpdesk tickets matching the current filter."
            icon={<HelpCircle className="w-12 h-12 text-slate-600" />}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card
              key={ticket._id}
              className="p-6 bg-slate-900/60 border-slate-800 flex flex-col space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getPriorityColor(ticket.priority)}`}
                    >
                      {ticket.priority} Priority
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusColor(ticket.status)}`}
                    >
                      {ticket.status}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                      {ticket.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{ticket.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <User className="w-3.5 h-3.5" />
                    <span>
                      {ticket.portalUserId?.name} ({ticket.clientId?.name})
                    </span>
                    <span>•</span>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {ticket.status === 'open' && (
                    <button
                      onClick={() => updateStatus(ticket._id, 'in-progress')}
                      className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-lg text-xs font-bold transition-colors"
                    >
                      Start Investigation
                    </button>
                  )}
                  {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                    <button
                      onClick={() => updateStatus(ticket._id, 'resolved')}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolve Ticket
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/60">
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {ticket.description}
                </p>
              </div>

              {ticket.assigneeId && (
                <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-2 border-t border-slate-800/40">
                  <User className="w-3 h-3" />
                  <span>
                    Assigned to: <strong className="text-slate-300">{ticket.assigneeName}</strong>
                  </span>
                  {ticket.resolvedAt && (
                    <span className="ml-4 text-emerald-500/80">
                      Resolved on {new Date(ticket.resolvedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
