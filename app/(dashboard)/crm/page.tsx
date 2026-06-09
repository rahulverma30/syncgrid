'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  PageHeader,
  Card,
  CardContent,
  Button,
  Input,
  DropdownMenu,
  LoadingSpinner,
  Tabs,
  Badge,
  ConfirmationModal,
  Select,
  Modal,
} from '@/components/ui';
import {
  Users,
  Sparkles,
  Search,
  Filter,
  Download,
  Trash,
  Plus,
  ArrowRight,
  TrendingUp,
  FileText,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  Tag,
  Paperclip,
  CheckSquare,
  History,
  Activity,
  Send,
  Link,
  ChevronRight,
  UserPlus,
  Briefcase,
  AlertCircle,
  Pin,
  EyeOff,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { getClientError, getNetworkError, SUCCESS_MESSAGES } from '@/lib/errors';
import { useSession } from 'next-auth/react';
import { AreaChartWrapper, PieChartWrapper, BarChartWrapper } from '@/components/ui/charts';

// CRM Leads Types
interface Note {
  _id?: string;
  content: string;
  createdById: string;
  createdByName: string;
  isPinned: boolean;
  isPrivate: boolean;
  createdAt: string;
}

interface Reminder {
  _id?: string;
  title: string;
  type: 'call' | 'meeting' | 'email' | 'custom';
  dueDate: string;
  isCompleted: boolean;
}

interface Attachment {
  _id?: string;
  name: string;
  url: string;
  size: number;
  category: 'proposal' | 'contract' | 'other';
  uploadedBy: string;
  createdAt: string;
}

interface TimelineEvent {
  _id?: string;
  type: string;
  title: string;
  description: string;
  userName: string;
  createdAt: string;
}

interface Lead {
  _id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  priority: 'low' | 'medium' | 'high';
  budget: number;
  currency: string;
  workType?: string;
  techStack: string[];
  expectedCloseDate?: string;
  assignedTo?: string;
  notes: Note[];
  reminders: Reminder[];
  attachments: Attachment[];
  timeline: TimelineEvent[];
  isArchived: boolean;
  createdAt: string;
}

interface PipelineStage {
  id: string;
  label: string;
  color: string;
  order: number;
}

export default function CRMPage() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([
    { id: 'new', label: 'New Lead', color: '#3b82f6', order: 1 },
    { id: 'contacted', label: 'Contacted', color: '#a855f7', order: 2 },
    { id: 'proposal', label: 'Proposal Sent', color: '#eab308', order: 3 },
    { id: 'negotiation', label: 'Negotiating', color: '#f97316', order: 4 },
    { id: 'won', label: 'Won (Closed)', color: '#22c55e', order: 5 },
    { id: 'lost', label: 'Lost (Closed)', color: '#ef4444', order: 6 },
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  // Selected lead for detail drawer
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState('overview');

  // Multi-select bulk actions
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Drag and Drop State
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverColumnId(stageId);
  };

  const handleDragLeave = () => {
    setDragOverColumnId(null);
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverColumnId(null);

    const leadId = e.dataTransfer.getData('text/plain');
    if (!leadId) return;

    // Optimistic update
    const previousLeads = [...leads];
    setLeads(leads.map((l) => (l._id === leadId ? { ...l, status: stageId } : l)));

    try {
      const res = await fetch(`/api/protected/crm/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: stageId }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success('Lead moved successfully');
        setLeads((prev) => prev.map((l) => (l._id === leadId ? d.data : l)));
      } else {
        setLeads(previousLeads);
        toast.error('Failed to move lead. Reverted changes.');
      }
    } catch (err) {
      setLeads(previousLeads);
      toast.error('Connection error. Reverted changes.');
    }
  };

  // Create lead modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formBudget, setFormBudget] = useState(10000);
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [formSource, setFormSource] = useState('website');
  const [formWorkType, setFormWorkType] = useState('Web Development');
  const [formStack, setFormStack] = useState('');

  // Note creation inside drawer
  const [noteInput, setNoteInput] = useState('');
  const [noteIsPinned, setNoteIsPinned] = useState(false);
  const [noteIsPrivate, setNoteIsPrivate] = useState(false);

  // Reminder creation inside drawer
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderType, setReminderType] = useState<'call' | 'meeting' | 'email' | 'custom'>(
    'custom'
  );
  const [reminderDate, setReminderDate] = useState('');

  // Attachment simulator inside drawer
  const [attachName, setAttachName] = useState('');
  const [attachCategory, setAttachCategory] = useState<'proposal' | 'contract' | 'other'>(
    'proposal'
  );
  const [uploadProgress, setUploadProgress] = useState(-1);

  // Delete confirm modal states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [leadToDeleteId, setLeadToDeleteId] = useState<string | null>(null);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  const fetchLeadsAndSettings = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch settings
      const settingsRes = await fetch('/api/protected/crm/settings');
      const settingsData = await settingsRes.json();
      if (settingsData.success && settingsData.data?.pipelineStages?.length > 0) {
        setStages(settingsData.data.pipelineStages);
      }

      // 2. Fetch leads
      const leadsRes = await fetch('/api/protected/crm/leads');
      const leadsData = await leadsRes.json();
      if (leadsData.success) {
        setLeads(leadsData.data || []);
      }
    } catch (err: any) {
      toast.error('Failed to connect to database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
      fetchLeadsAndSettings();
    }, 0);
  }, []);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formContact) {
      toast.error('Company Name and Contact Person are required.');
      return;
    }

    try {
      const res = await fetch('/api/protected/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          contactPerson: formContact,
          email: formEmail,
          phone: formPhone,
          budget: formBudget,
          priority: formPriority,
          source: formSource,
          workType: formWorkType,
          techStack: formStack ? formStack.split(',').map((s) => s.trim()) : [],
        }),
      });

      const d = await res.json();
      if (d.success) {
        setLeads([d.data, ...leads]);
        setCreateModalOpen(false);
        toast.success(`Lead for "${formName}" created successfully!`);
        // Reset form
        setFormName('');
        setFormContact('');
        setFormEmail('');
        setFormPhone('');
        setFormBudget(10000);
        setFormStack('');
      } else {
        toast.error(getClientError(d).title, { description: getClientError(d).description });
      }
    } catch (e) {
      toast.error('Connection error while saving lead.');
    }
  };

  const handleMoveStage = async (leadId: string, newStage: string) => {
    const prevLead = leads.find((l) => l._id === leadId);
    if (!prevLead) return;
    const prevStatus = prevLead.status;

    // Optimistic UI Update
    setLeads((prev) => prev.map((l) => (l._id === leadId ? { ...l, status: newStage } : l)));
    if (selectedLead?._id === leadId) {
      setSelectedLead({ ...selectedLead, status: newStage });
    }

    try {
      const res = await fetch(`/api/protected/crm/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStage }),
      });
      const d = await res.json();
      if (d.success) {
        // Sync full item timeline updates
        setLeads((prev) => prev.map((l) => (l._id === leadId ? d.data : l)));
        if (selectedLead?._id === leadId) setSelectedLead(d.data);
        toast.success(`Lead moved to "${stages.find((s) => s.id === newStage)?.label}"`);
      } else {
        // Revert on API failure
        setLeads((prev) => prev.map((l) => (l._id === leadId ? { ...l, status: prevStatus } : l)));
        toast.error('Failed to update stage.');
      }
    } catch (e) {
      // Revert on network error
      setLeads((prev) => prev.map((l) => (l._id === leadId ? { ...l, status: prevStatus } : l)));
      toast.error('Network error updating stage.');
    }
  };

  const handleAddNote = async () => {
    if (!noteInput.trim() || !selectedLead) return;

    try {
      const res = await fetch(`/api/protected/crm/leads/${selectedLead._id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: noteInput,
          isPinned: noteIsPinned,
          isPrivate: noteIsPrivate,
        }),
      });

      const d = await res.json();
      if (d.success) {
        setSelectedLead(d.data);
        setLeads(leads.map((l) => (l._id === d.data._id ? d.data : l)));
        setNoteInput('');
        setNoteIsPinned(false);
        setNoteIsPrivate(false);
        toast.success('Note added successfully!');
      } else {
        toast.error('Failed to save note.');
      }
    } catch (e) {
      toast.error('Connection error adding note.');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!selectedLead) return;
    try {
      const res = await fetch(
        `/api/protected/crm/leads/${selectedLead._id}/notes?noteId=${noteId}`,
        {
          method: 'DELETE',
        }
      );
      const d = await res.json();
      if (d.success) {
        setSelectedLead(d.data);
        setLeads(leads.map((l) => (l._id === d.data._id ? d.data : l)));
        toast.success('Note deleted.');
      } else {
        toast.error('Failed to delete note.');
      }
    } catch (e) {
      toast.error('Error deleting note.');
    }
  };

  const handleAddReminder = async () => {
    if (!reminderTitle.trim() || !reminderDate || !selectedLead) {
      toast.error('Reminder Title and Date are required.');
      return;
    }

    try {
      const res = await fetch(`/api/protected/crm/leads/${selectedLead._id}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: reminderTitle,
          type: reminderType,
          dueDate: reminderDate,
        }),
      });

      const d = await res.json();
      if (d.success) {
        setSelectedLead(d.data);
        setLeads(leads.map((l) => (l._id === d.data._id ? d.data : l)));
        setReminderTitle('');
        setReminderDate('');
        toast.success('Follow-up task scheduled!');
      } else {
        toast.error('Failed to schedule reminder.');
      }
    } catch (e) {
      toast.error('Connection error scheduling reminder.');
    }
  };

  const handleSimulateUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachName.trim() || !selectedLead) return;

    setUploadProgress(100);

    try {
      const res = await fetch(`/api/protected/crm/leads/${selectedLead._id}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: attachName.endsWith('.pdf') ? attachName : `${attachName}.pdf`,
          url: 'https://syncgrid-enterprise.s3.amazonaws.com/proposals/proposal_3910.pdf',
          size: Math.round(1024 * 1024 * (1.2 + Math.random() * 2)),
          category: attachCategory,
        }),
      });

      const d = await res.json();
      if (d.success) {
        setSelectedLead(d.data);
        setLeads(leads.map((l) => (l._id === d.data._id ? d.data : l)));
        setAttachName('');
        setUploadProgress(-1);
        toast.success('Proposal file attached successfully!');
      } else {
        toast.error('Failed to attach document.');
        setUploadProgress(-1);
      }
    } catch (e) {
      toast.error('Error uploading document.');
      setUploadProgress(-1);
    }
  };

  const handleDeleteLead = (leadId: string) => {
    setLeadToDeleteId(leadId);
    setIsDeleteConfirmOpen(true);
  };

  const handleBulkDelete = () => {
    setIsBulkDeleteConfirmOpen(true);
  };

  const handleBulkReassign = async (stageId: string) => {
    let successCount = 0;
    const updatedLeads = [...leads];

    for (const leadId of selectedRows) {
      try {
        const res = await fetch(`/api/protected/crm/leads/${leadId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: stageId }),
        });
        const d = await res.json();
        if (d.success) {
          successCount++;
          const idx = updatedLeads.findIndex((l) => l._id === leadId);
          if (idx !== -1) updatedLeads[idx] = d.data;
        }
      } catch (e) {}
    }

    setLeads(updatedLeads);
    setSelectedRows([]);
    toast.success(
      `Successfully shifted ${successCount} leads to stage "${stages.find((s) => s.id === stageId)?.label}"`
    );
  };

  const handleExportCSV = () => {
    // Generate actual CSV content
    const headers = [
      'Company Name',
      'Contact Person',
      'Email',
      'Phone',
      'Stage',
      'Source',
      'Priority',
      'Budget ($)',
      'Stack',
    ];
    const rows = filteredLeads.map((l) => [
      l.name,
      l.contactPerson,
      l.email || '',
      l.phone || '',
      l.status,
      l.source,
      l.priority,
      l.budget,
      l.techStack.join(', '),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((val) => `"${val}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `syncgrid_crm_leads_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Successfully downloaded Leads report as CSV.');
  };

  // Convert lead to target project simulator -> Real business logic
  const handleConvertToProject = async () => {
    if (!selectedLead) return;

    try {
      const res = await fetch(`/api/protected/crm/leads/${selectedLead._id}/convert`, {
        method: 'POST',
      });
      const d = await res.json();

      if (d.success) {
        toast.success(
          `Lead "${selectedLead.name}" converted successfully! Account, Contact, and Deal created.`
        );
        // Refresh leads to reflect converted status
        fetchLeadsAndSettings();
        setDrawerOpen(false);
      } else {
        toast.error(getClientError(d).title, { description: getClientError(d).description });
      }
    } catch (e) {
      toast.error('Network error while converting lead.');
    }
  };

  if (!mounted) return null;

  // Search & Filter Query Execution
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter ? lead.status === statusFilter : true;
    const matchesPriority = priorityFilter ? lead.priority === priorityFilter : true;
    const matchesSource = sourceFilter ? lead.source === sourceFilter : true;

    return matchesSearch && matchesStatus && matchesPriority && matchesSource;
  });

  // KPI calculations
  const totalLeadsCount = filteredLeads.length;
  const convertedLeadsCount = filteredLeads.filter((l) => l.status === 'won').length;
  const lostLeadsCount = filteredLeads.filter((l) => l.status === 'lost').length;
  const conversionRate =
    totalLeadsCount > 0 ? Math.round((convertedLeadsCount / totalLeadsCount) * 100) : 0;
  const totalPipelineValue = filteredLeads.reduce((acc, curr) => acc + (curr.budget || 0), 0);

  // Recharts telemetry maps
  const leadVelocityData = [
    { name: 'Jan', amount: 3 },
    { name: 'Feb', amount: 5 },
    { name: 'Mar', amount: 9 },
    { name: 'Apr', amount: 12 },
    { name: 'May', amount: totalLeadsCount },
  ];

  const sourceData = [
    { name: 'LinkedIn', value: filteredLeads.filter((l) => l.source === 'linkedin').length },
    { name: 'Website', value: filteredLeads.filter((l) => l.source === 'website').length },
    { name: 'Referral', value: filteredLeads.filter((l) => l.source === 'referral').length },
    { name: 'Ads', value: filteredLeads.filter((l) => l.source === 'ads').length },
    { name: 'Outreach', value: filteredLeads.filter((l) => l.source === 'cold-reach').length },
  ].filter((s) => s.value > 0);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <PageHeader
        eyebrow="Business Intelligence System"
        title="CRM & Leads Manager"
        description="Monitor lead conversion pipelines, sales velocities, and automated communication logs."
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={fetchLeadsAndSettings}
              variant="outline"
              size="sm"
              className="h-9 hover:bg-accent/40 text-xs gap-1.5"
            >
              <Users className="h-3.5 w-3.5" />
              Sync Base
            </Button>
            <Button
              onClick={() => setCreateModalOpen(true)}
              variant="default"
              size="sm"
              className="h-9 text-xs gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Capture Lead
            </Button>
          </div>
        }
      />

      {/* Main Tabs Navigation */}
      <div className="border-b border-border/80 pb-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-wrap">
        <div className="flex gap-2">
          {['dashboard', 'pipeline', 'table'].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`pb-2.5 px-4 text-[13px] font-bold transition-colors border-b-2 relative ${
                activeTab === t
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'dashboard' && 'CRM Analytics'}
              {t === 'pipeline' && 'Sales Kanban'}
              {t === 'table' && 'Leads Ledger'}
            </button>
          ))}
        </div>

        {/* Global Filter Toolbar */}
        <div className="flex items-center flex-row gap-2 w-full md:w-auto mb-2 md:mb-0">
          <div className="w-full max-w-[200px]">
            <Select
              value={priorityFilter}
              onChange={(val) => setPriorityFilter(val)}
              className="h-8.5 min-w-[140px] rounded-[calc(var(--radius)-2px)] border border-border/80 bg-background/50 px-2 py-1 text-xs text-foreground focus:outline-none"
              placeholder="All Priorities"
              options={[
                { value: '', label: 'All Priorities' },
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
              ]}
            />
          </div>
          <div className="w-full max-w-[200px]">
            <Select
              value={sourceFilter}
              onChange={(val) => setSourceFilter(val)}
              className="h-8.5 min-w-[140px] rounded-[calc(var(--radius)-2px)] border border-border/80 bg-background/50 px-2 py-1 text-xs text-foreground focus:outline-none"
              placeholder="All Sources"
              options={[
                { value: '', label: 'All Sources' },
                { value: 'linkedin', label: 'LinkedIn' },
                { value: 'website', label: 'Website' },
                { value: 'referral', label: 'Referral' },
                { value: 'ads', label: 'Ads' },
                { value: 'cold-reach', label: 'Outreach' },
              ]}
            />
          </div>
          <div className="relative w-full max-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company..."
              className="pl-8 h-8.5 text-xs bg-background/30"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-96 flex flex-col items-center justify-center space-y-4">
          <LoadingSpinner className="h-10 w-10 text-primary" />
          <p className="text-xs text-muted-foreground animate-pulse uppercase font-bold tracking-wider">
            Loading active corporate leads database...
          </p>
        </div>
      ) : leads.length === 0 ? (
        <div className="h-96 flex flex-col items-center justify-center border border-dashed border-border/80 rounded-2xl p-8 text-center max-w-md mx-auto bg-card/10 backdrop-blur-md space-y-5">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
            <Users className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">
              No Leads Found
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
              Capture your first CRM lead to activate visual sales pipelines, deal values
              forecasting, and follow-up tracking.
            </p>
          </div>
          <Button
            onClick={() => setCreateModalOpen(true)}
            variant="default"
            size="sm"
            className="text-xs gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Capture Your First Lead
          </Button>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* TAB 1: CRM ANALYTICS */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 text-left"
            >
              {/* Telemetry Metrics Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-card/40 backdrop-blur-md border border-border/80 select-none shadow-sm hover:border-primary/20 transition-all duration-300">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Active Leads
                      </p>
                      <h3 className="text-2xl font-black font-mono">{totalLeadsCount}</h3>
                      <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-0.5">
                        <TrendingUp className="h-3 w-3" />
                        +14.8% growth
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Users className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/40 backdrop-blur-md border border-border/80 select-none shadow-sm hover:border-primary/20 transition-all duration-300">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Acquisition pipeline
                      </p>
                      <h3 className="text-2xl font-black font-mono text-primary">
                        ${totalPipelineValue.toLocaleString()}
                      </h3>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        Expected budget sum
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <DollarSign className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/40 backdrop-blur-md border border-border/80 select-none shadow-sm hover:border-primary/20 transition-all duration-300">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Close conversion rate
                      </p>
                      <h3 className="text-2xl font-black font-mono">{conversionRate}%</h3>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        {convertedLeadsCount} closed won, {lostLeadsCount} lost
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/40 backdrop-blur-md border border-border/80 select-none shadow-sm hover:border-primary/20 transition-all duration-300">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Unresolved followups
                      </p>
                      <h3 className="text-2xl font-black font-mono">
                        {leads.reduce(
                          (acc, l) =>
                            acc +
                            (l?.reminders ? l.reminders.filter((r) => !r.isCompleted).length : 0),
                          0
                        )}
                      </h3>
                      <p className="text-[10px] text-rose-500 font-semibold uppercase">
                        Requires interaction
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <Clock className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Panel */}
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                <Card className="lg:col-span-2 bg-card/25 border border-border/80">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-foreground">Lead Intake Curve</h4>
                        <p className="text-[10px] text-muted-foreground">
                          Volume of registered business prospects per interval
                        </p>
                      </div>
                    </div>
                    <AreaChartWrapper
                      data={leadVelocityData}
                      xKey="name"
                      metrics={[
                        { key: 'amount', label: 'Lead Ingestion', color: 'hsl(var(--primary))' },
                      ]}
                      height={200}
                    />
                  </CardContent>
                </Card>

                <Card className="bg-card/25 border border-border/80">
                  <CardContent className="p-5 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Lead Source Mix</h4>
                      <p className="text-[10px] text-muted-foreground">
                        Channel split of captured accounts
                      </p>
                    </div>
                    {sourceData.length === 0 ? (
                      <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">
                        No sources recorded.
                      </div>
                    ) : (
                      <PieChartWrapper data={sourceData} height={200} />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Reminders Feed & Action panel */}
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                <Card className="lg:col-span-2 bg-card/25 border border-border/80">
                  <CardContent className="p-5 space-y-3.5">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Pending Action Items</h4>
                      <p className="text-[10px] text-muted-foreground">
                        Overdue and upcoming follow-ups that need direct execution
                      </p>
                    </div>

                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                      {leads.flatMap((l) =>
                        l.reminders
                          ?.filter((r) => !r.isCompleted)
                          .map((rem) => (
                            <div
                              key={rem._id}
                              onClick={() => {
                                setSelectedLead(l);
                                setDrawerOpen(true);
                                setDrawerTab('reminders');
                              }}
                              className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card/45 hover:bg-card hover:border-border transition-colors cursor-pointer text-left"
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <span className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-0.5">
                                  {rem.type === 'call' && '📞'}
                                  {rem.type === 'meeting' && '🤝'}
                                  {rem.type === 'email' && '📧'}
                                  {rem.type === 'custom' && '📝'}
                                </span>
                                <div className="space-y-0.5 min-w-0">
                                  <h5 className="text-xs font-semibold text-foreground truncate">
                                    {rem.title}
                                  </h5>
                                  <p className="text-[10px] text-muted-foreground truncate">
                                    Lead:{' '}
                                    <span className="font-semibold text-foreground/80">
                                      {l.name}
                                    </span>{' '}
                                    ({l.contactPerson})
                                  </p>
                                </div>
                              </div>
                              <span className="text-[9px] font-mono rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 whitespace-nowrap">
                                Due: {new Date(rem.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          ))
                      )}
                      {leads.every(
                        (l) => l.reminders?.filter((r) => !r.isCompleted).length === 0
                      ) && (
                        <div className="py-12 text-center text-xs text-muted-foreground">
                          🎉 Beautiful! All pipeline reminders have been completely cleared!
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Lead Status Breakdown */}
                <Card className="bg-card/25 border border-border/80 select-none">
                  <CardContent className="p-5 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Pipeline Stage Value</h4>
                      <p className="text-[10px] text-muted-foreground">
                        Summary dollar amounts across active stages
                      </p>
                    </div>
                    <div className="space-y-2.5">
                      {stages.map((stage) => {
                        const stageLeads = filteredLeads.filter((l) => l.status === stage.id);
                        const stageSum = stageLeads.reduce(
                          (acc, curr) => acc + (curr.budget || 0),
                          0
                        );
                        return (
                          <div key={stage.id} className="flex justify-between items-center text-xs">
                            <span className="flex items-center gap-2">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: stage.color }}
                              />
                              <span className="font-semibold text-muted-foreground">
                                {stage.label}
                              </span>
                            </span>
                            <span className="font-mono font-bold text-foreground">
                              ${stageSum.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* TAB 2: VISUAL KANBAN PIPELINE */}
          {activeTab === 'pipeline' && (
            <motion.div
              key="pipeline"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4 text-left"
            >
              {/* Horizontal columns container */}
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin select-none items-start min-h-[500px]">
                {stages.map((stage) => {
                  const stageLeads = filteredLeads.filter((l) => l.status === stage.id);
                  const stageValueSum = stageLeads.reduce(
                    (acc, curr) => acc + (curr.budget || 0),
                    0
                  );

                  return (
                    <div
                      key={stage.id}
                      onDragOver={(e) => handleDragOver(e, stage.id)}
                      onDrop={(e) => handleDrop(e, stage.id)}
                      onDragLeave={handleDragLeave}
                      className={`w-72 flex-shrink-0 bg-muted/10 border border-border/80 rounded-xl p-3.5 space-y-4 self-stretch flex flex-col min-h-[480px] transition-all duration-200 ${
                        dragOverColumnId === stage.id ? 'border-primary/40 bg-primary/5' : ''
                      }`}
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <span className="flex items-center gap-2 text-xs font-black tracking-wide uppercase text-foreground">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          {stage.label}
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-black text-primary font-mono">
                            {stageLeads.length}
                          </span>
                        </span>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground">
                          ${stageValueSum.toLocaleString()}
                        </span>
                      </div>

                      {/* Cards Container */}
                      <div className="flex-grow space-y-3 overflow-y-auto max-h-[420px] pr-1">
                        {stageLeads.map((lead) => (
                          <motion.div
                            key={lead._id}
                            layoutId={lead._id}
                            draggable
                            onDragStart={(e: any) => handleDragStart(e, lead._id)}
                            onClick={() => {
                              setSelectedLead(lead);
                              setDrawerOpen(true);
                            }}
                            className="bg-card/75 border border-border/80 rounded-lg p-3.5 space-y-3 shadow-sm hover:border-primary/30 transition-all duration-300 hover:shadow-md cursor-grab active:cursor-grabbing text-left relative overflow-hidden group"
                          >
                            {/* Budget Badge */}
                            <div className="flex justify-between items-start">
                              <h4 className="text-xs font-black text-foreground group-hover:text-primary transition-colors leading-tight">
                                {lead.name}
                              </h4>
                              <span className="text-[9px] font-mono font-extrabold text-foreground tracking-tight">
                                ${lead.budget.toLocaleString()}
                              </span>
                            </div>

                            {/* Contact Name */}
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{lead.contactPerson}</span>
                            </div>

                            {/* Tech Stack pills */}
                            {lead.techStack?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {lead.techStack.slice(0, 2).map((stack) => (
                                  <span
                                    key={stack}
                                    className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-muted/60 text-muted-foreground border border-border/30"
                                  >
                                    {stack}
                                  </span>
                                ))}
                                {lead.techStack.length > 2 && (
                                  <span className="px-1 py-0.5 rounded text-[8px] font-mono font-bold bg-primary/5 text-primary">
                                    +{lead.techStack.length - 2}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Card Footer controls */}
                            <div className="flex items-center justify-between border-t border-border/30 pt-2 text-[8px] font-bold text-muted-foreground uppercase select-none">
                              <span
                                className={`px-1.5 py-0.5 rounded font-black border uppercase tracking-wider ${
                                  lead.priority === 'high'
                                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                    : lead.priority === 'medium'
                                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                      : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                }`}
                              >
                                {lead.priority} Priority
                              </span>

                              {/* Hover drop menu for accessible moving */}
                              <div className="relative">
                                <Select
                                  value={lead.status}
                                  onChange={(val) => handleMoveStage(lead._id, val)}
                                  className="h-5 rounded border border-border/80 bg-background/50 px-1 text-[8px] font-bold text-muted-foreground uppercase focus:outline-none"
                                  options={stages.map((st) => ({
                                    value: st.id,
                                    label: `Shift to: ${st.label}`,
                                  }))}
                                />
                              </div>
                            </div>
                          </motion.div>
                        ))}

                        {stageLeads.length === 0 && (
                          <div className="py-12 text-center text-[10px] text-muted-foreground select-none border border-dashed border-border/50 rounded-lg">
                            Column empty
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* TAB 3: LEADS LEDGER */}
          {activeTab === 'table' && (
            <motion.div
              key="table"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4 text-left"
            >
              {/* Ledger filters & Export header */}
              <div className="flex justify-end mb-4">
                {' '}
                <Button
                  onClick={handleExportCSV}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 hover:bg-accent/40"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export Ledger
                </Button>
              </div>

              {/* Bulk actions panel floating bar */}
              <AnimatePresence>
                {selectedRows.length > 0 && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    className="p-2 border border-border/80 bg-accent/20 backdrop-blur-md rounded-xl flex items-center justify-between gap-4 text-xs font-bold shadow-lg"
                  >
                    <span className="pl-2">{selectedRows.length} Leads selected</span>
                    <div className="flex gap-2 items-center">
                      <Select
                        onChange={(val) => handleBulkReassign(val)}
                        className="h-8 rounded border border-border/80 bg-background px-2 text-xs text-foreground"
                        placeholder="Shift Stage..."
                        options={[
                          { value: '', label: 'Shift Stage...' },
                          ...stages.map((st) => ({ value: st.id, label: st.label })),
                        ]}
                      />
                      <Button
                        onClick={handleBulkDelete}
                        variant="destructive"
                        size="sm"
                        className="h-8 text-xs gap-1.5"
                      >
                        <Trash className="h-3.5 w-3.5" />
                        Delete Bulk
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Table Ledger grid */}
              <div className="overflow-x-auto border border-border/60 rounded-xl bg-card/20">
                <table className="w-full text-left border-collapse select-none">
                  <thead>
                    <tr className="border-b border-border/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/20">
                      <th className="py-2.5 px-4 w-10">
                        <input
                          type="checkbox"
                          checked={
                            selectedRows.length === filteredLeads.length && filteredLeads.length > 0
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRows(filteredLeads.map((l) => l._id));
                            } else {
                              setSelectedRows([]);
                            }
                          }}
                        />
                      </th>
                      <th className="py-2.5 px-4">Company</th>
                      <th className="py-2.5 px-4">Contact</th>
                      <th className="py-2.5 px-4">Stage</th>
                      <th className="py-2.5 px-4">Budget</th>
                      <th className="py-2.5 px-4">Source</th>
                      <th className="py-2.5 px-4">Priority</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => (
                      <tr
                        key={lead._id}
                        onClick={() => {
                          setSelectedLead(lead);
                          setDrawerOpen(true);
                        }}
                        className="border-b border-border/40 hover:bg-muted/10 text-xs transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(lead._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRows([...selectedRows, lead._id]);
                              } else {
                                setSelectedRows(selectedRows.filter((id) => id !== lead._id));
                              }
                            }}
                          />
                        </td>
                        <td className="py-3 px-4 font-bold text-foreground hover:text-primary transition-colors">
                          {lead.name}
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-foreground/80 leading-none">
                              {lead.contactPerson}
                            </p>
                            {lead.email && (
                              <p className="text-[10px] text-muted-foreground leading-none">
                                {lead.email}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider select-none shadow-sm"
                            style={{
                              backgroundColor: `${stages.find((s) => s.id === lead.status)?.color || '#999999'}1a`,
                              borderColor: `${stages.find((s) => s.id === lead.status)?.color || '#999999'}33`,
                              color: stages.find((s) => s.id === lead.status)?.color || '#999999',
                            }}
                          >
                            {stages.find((s) => s.id === lead.status)?.label || lead.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-foreground">
                          ${lead.budget.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 uppercase text-[9px] font-bold text-muted-foreground font-mono">
                          {lead.source}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide border ${
                              lead.priority === 'high'
                                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                : lead.priority === 'medium'
                                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                  : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            }`}
                          >
                            {lead.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            onClick={() => handleDeleteLead(lead._id)}
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {filteredLeads.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="py-12 text-center text-xs text-muted-foreground font-semibold"
                        >
                          Zero registered business leads match the active search filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* LEAD PROFILE DETAIL DRAWER */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {drawerOpen && selectedLead && (
              <>
                {/* Backdrop Closer */}
                <div
                  className="fixed inset-0 z-40 bg-background/40 backdrop-blur-xs"
                  onClick={() => setDrawerOpen(false)}
                />

                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="fixed top-0 right-0 h-full w-full max-w-xl z-50 border-l border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden text-left"
                >
                  {/* Header section */}
                  <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between bg-muted/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
                    <div className="space-y-1.5 relative z-10">
                      <span className="text-[10px] font-mono font-black tracking-widest text-primary/80 uppercase">
                        Lead Intelligence Profile
                      </span>
                      <h3 className="text-xl font-black text-foreground tracking-tight">
                        {selectedLead.name}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleConvertToProject}
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1"
                      >
                        <Briefcase className="h-3.5 w-3.5" />
                        Convert
                      </Button>
                      <button
                        onClick={() => setDrawerOpen(false)}
                        className="h-8 w-8 rounded-full hover:bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {/* Sub-tabs Inside Profile Drawer */}
                  <div className="flex border-b border-border/40 px-4 py-2 flex-wrap gap-2 bg-muted/10 select-none">
                    {['overview', 'notes', 'reminders', 'attachments', 'timeline'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setDrawerTab(t)}
                        className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
                          drawerTab === t
                            ? 'bg-primary/15 text-primary shadow-sm shadow-primary/10'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* Dynamic Sub-Tab View Content */}
                  <div className="flex-grow overflow-y-auto p-6 space-y-8 scrollbar-thin">
                    {/* 1. OVERVIEW PROFILE TAB */}
                    {drawerTab === 'overview' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-5"
                      >
                        {/* Primary Grid details */}
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                              Contact Person
                            </span>
                            <p className="font-semibold text-foreground">
                              {selectedLead.contactPerson}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                              Estimated Budget
                            </span>
                            <p className="font-semibold font-mono text-primary">
                              ${selectedLead.budget.toLocaleString()}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                              Email Contact
                            </span>
                            <p className="font-semibold text-foreground/80 truncate">
                              {selectedLead.email || 'None'}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                              Phone Number
                            </span>
                            <p className="font-semibold text-foreground/80">
                              {selectedLead.phone || 'None'}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                              Ingestion Channel
                            </span>
                            <p className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground font-mono">
                              {selectedLead.source}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                              Business Scope
                            </span>
                            <p className="font-semibold text-foreground/80">
                              {selectedLead.workType || 'Standard Services'}
                            </p>
                          </div>
                        </div>

                        {/* Tech Stack list */}
                        <div className="space-y-2 border-t border-border/30 pt-4">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                            Tech Stack Tags
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedLead.techStack?.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 rounded bg-muted/60 text-muted-foreground border border-border/30 px-2 py-0.5 text-[10px] font-bold font-mono"
                              >
                                <Tag className="h-3 w-3 text-muted-foreground/60" />
                                {tag}
                              </span>
                            ))}
                            {(!selectedLead.techStack || selectedLead.techStack.length === 0) && (
                              <p className="text-xs text-muted-foreground italic">
                                No technology tags assigned.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Social networks & fields */}
                        <div className="space-y-3 border-t border-border/30 pt-4 text-xs">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                            Account Clearance
                          </span>
                          <div className="flex gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded font-black border uppercase tracking-wider ${
                                selectedLead.priority === 'high'
                                  ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                  : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                              }`}
                            >
                              {selectedLead.priority} Priority scale
                            </span>
                            <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-black uppercase tracking-wider">
                              {selectedLead.isArchived ? 'Archived Ledger' : 'Active Intake'}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* 2. NOTES PROFILE TAB */}
                    {drawerTab === 'notes' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-5 text-xs"
                      >
                        {/* Add note interface */}
                        <div className="space-y-3 p-4 rounded-xl border border-border/60 bg-muted/5 shadow-inner">
                          <textarea
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            placeholder="Draft strategic notes, executive summaries, or meeting minutes..."
                            className="w-full h-24 p-3 rounded-lg border border-border/50 bg-background focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm leading-relaxed transition-all resize-none"
                          />
                          <div className="flex items-center justify-between flex-wrap gap-3 select-none border-t border-border/30 pt-3">
                            <div className="flex gap-4 text-xs font-semibold">
                              <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                                <input
                                  type="checkbox"
                                  checked={noteIsPinned}
                                  onChange={(e) => setNoteIsPinned(e.target.checked)}
                                  className="rounded border-border bg-background accent-primary"
                                />
                                <Pin className="h-4 w-4" />
                                Pin to Top
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer text-rose-500/80 hover:text-rose-500 transition-colors">
                                <input
                                  type="checkbox"
                                  checked={noteIsPrivate}
                                  onChange={(e) => setNoteIsPrivate(e.target.checked)}
                                  className="rounded border-border bg-background accent-rose-500"
                                />
                                <EyeOff className="h-4 w-4" />
                                Internal Only
                              </label>
                            </div>
                            <Button
                              onClick={handleAddNote}
                              size="sm"
                              className="h-9 px-4 text-xs font-bold gap-2 shadow-md shadow-primary/20"
                            >
                              <Send className="h-3.5 w-3.5" />
                              Publish Note
                            </Button>
                          </div>
                        </div>
                        {/* Notes Feed items */}
                        <div className="space-y-4 pt-2">
                          {selectedLead.notes
                            ?.slice()
                            .reverse()
                            .map((note, idx) => (
                              <div
                                key={idx}
                                className="group relative p-4 border border-border/40 bg-card rounded-xl space-y-3 shadow-sm hover:shadow-md transition-shadow text-left"
                              >
                                {note.isPinned && (
                                  <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-md border-2 border-background">
                                    <Pin className="h-3 w-3 text-primary-foreground rotate-45" />
                                  </div>
                                )}
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2.5">
                                    <span className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-black text-xs border border-primary/10">
                                      {note.createdByName[0]}
                                    </span>
                                    <div>
                                      <div className="font-bold text-foreground text-[13px] leading-tight">
                                        {note.createdByName}
                                      </div>
                                      <div className="text-[10px] font-mono text-muted-foreground/80">
                                        {new Date(note.createdAt).toLocaleString()}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {note.isPrivate && (
                                      <span className="text-[9px] font-bold uppercase tracking-widest text-rose-500 font-mono bg-rose-500/10 rounded-md px-2 py-0.5 border border-rose-500/20">
                                        Internal
                                      </span>
                                    )}
                                    <button
                                      onClick={() => note._id && handleDeleteNote(note._id)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500"
                                      title="Delete Note"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                                <div className="pl-10">
                                  <p className="text-muted-foreground text-[13px] leading-relaxed whitespace-pre-line border-l-2 border-border/50 pl-3">
                                    {note.content}
                                  </p>
                                </div>
                              </div>
                            ))}

                          {(!selectedLead.notes || selectedLead.notes.length === 0) && (
                            <div className="py-12 text-center flex flex-col items-center gap-3">
                              <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-muted-foreground/50" />
                              </div>
                              <span className="text-sm font-semibold text-muted-foreground">
                                No intel logged yet
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* 3. REMINDERS PROFILE TAB */}
                    {drawerTab === 'reminders' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-5 text-xs"
                      >
                        {/* Add reminder interface */}
                        <div className="p-4 border border-border/60 bg-muted/10 rounded-xl space-y-3">
                          <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">
                            Schedule Follow-up
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-muted-foreground uppercase">
                                Reminder title
                              </label>
                              <Input
                                value={reminderTitle}
                                onChange={(e) => setReminderTitle(e.target.value)}
                                placeholder="Follow up on proposal..."
                                className="h-8.5 text-xs bg-background/50"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-muted-foreground uppercase">
                                Activity Type
                              </label>
                              <Select
                                value={reminderType}
                                onChange={(val) =>
                                  setReminderType(val as 'call' | 'meeting' | 'email' | 'custom')
                                }
                                className="w-full h-8.5 rounded-md border border-input bg-background/50 px-2 py-1 text-xs text-foreground focus:outline-none"
                                options={[
                                  { value: 'custom', label: 'Custom Task' },
                                  { value: 'call', label: 'Phone Call' },
                                  { value: 'meeting', label: 'Sales Meeting' },
                                  { value: 'email', label: 'Send Email' },
                                ]}
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-muted-foreground uppercase">
                              Deadline date
                            </label>
                            <input
                              type="date"
                              value={reminderDate}
                              onChange={(e) => setReminderDate(e.target.value)}
                              className="w-full h-8.5 rounded-md border border-input bg-background/50 px-2 py-1 text-xs text-foreground focus:outline-none"
                            />
                          </div>
                          <Button
                            onClick={handleAddReminder}
                            size="sm"
                            className="h-8.5 w-full text-xs font-bold gap-1 mt-1"
                          >
                            <Plus className="h-4 w-4" />
                            Schedule Reminder
                          </Button>
                        </div>

                        {/* Active checklist reminders */}
                        <div className="space-y-2 border-t border-border/30 pt-4">
                          {selectedLead.reminders?.map((rem, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card/35 text-left"
                            >
                              <div className="flex items-start gap-3">
                                <span className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-0.5">
                                  {rem.type === 'call' && '📞'}
                                  {rem.type === 'meeting' && '🤝'}
                                  {rem.type === 'email' && '📧'}
                                  {rem.type === 'custom' && '📝'}
                                </span>
                                <div className="space-y-0.5">
                                  <h5 className="font-semibold text-foreground truncate max-w-[200px]">
                                    {rem.title}
                                  </h5>
                                  <p className="text-[9px] text-muted-foreground font-mono">
                                    Due: {new Date(rem.dueDate).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className="text-[9px] uppercase tracking-wider font-bold"
                              >
                                {rem.type}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* 4. ATTACHMENTS PROFILE TAB */}
                    {drawerTab === 'attachments' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-5 text-xs"
                      >
                        {/* Add attachment uploader simulation */}
                        <form
                          onSubmit={handleSimulateUpload}
                          className="p-4 border border-border/60 bg-muted/10 rounded-xl space-y-3 text-left"
                        >
                          <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">
                            Attach proposal or contract
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-muted-foreground uppercase">
                                File display name
                              </label>
                              <Input
                                value={attachName}
                                onChange={(e) => setAttachName(e.target.value)}
                                placeholder="acme_proposal_v1"
                                className="h-8.5 text-xs bg-background/50"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-muted-foreground uppercase">
                                Category
                              </label>
                              <Select
                                value={attachCategory}
                                onChange={(val) =>
                                  setAttachCategory(val as 'proposal' | 'contract' | 'other')
                                }
                                className="w-full h-8.5 rounded-md border border-input bg-background/50 px-2 py-1 text-xs text-foreground focus:outline-none"
                                options={[
                                  { value: 'proposal', label: 'Sales Proposal' },
                                  { value: 'contract', label: 'Agreement/Contract' },
                                  { value: 'other', label: 'Other Document' },
                                ]}
                              />
                            </div>
                          </div>

                          {uploadProgress >= 0 ? (
                            <div className="space-y-1 pt-2">
                              <div className="flex justify-between text-[8px] font-bold uppercase tracking-wider text-primary">
                                <span>Uploading Proposal PDF...</span>
                                <span>{uploadProgress}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all duration-150"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <Button
                              type="submit"
                              size="sm"
                              className="h-8.5 w-full text-xs font-bold gap-1 mt-1"
                            >
                              <Paperclip className="h-3.5 w-3.5" />
                              Simulate Secure PDF Attachment
                            </Button>
                          )}
                        </form>

                        {/* Files list */}
                        <div className="space-y-2 border-t border-border/30 pt-4">
                          {selectedLead.attachments?.map((file, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card/35 text-left"
                            >
                              <div className="flex items-start gap-2.5 min-w-0">
                                <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                <div className="space-y-0.5 min-w-0">
                                  <h5 className="font-semibold text-foreground truncate max-w-[200px] leading-tight">
                                    {file.name}
                                  </h5>
                                  <p className="text-[9px] text-muted-foreground font-mono">
                                    Size: {Math.round(file.size / 1024)} KB • category:{' '}
                                    {file.category}
                                  </p>
                                </div>
                              </div>
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-7 w-7 rounded bg-primary/10 text-primary hover:bg-primary/20 items-center justify-center transition-colors"
                              >
                                <Link className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* 5. TIMELINE PROFILE TAB */}
                    {drawerTab === 'timeline' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                      >
                        <div className="relative border-l border-border/80 ml-3.5 space-y-6 text-left pl-4">
                          {selectedLead.timeline
                            ?.slice()
                            .reverse()
                            .map((evt, idx) => (
                              <div key={idx} className="relative space-y-1 text-xs">
                                {/* Circle dot icon */}
                                <span className="absolute -left-[25px] top-0.5 rounded-full border border-border bg-background p-1 flex items-center justify-center shadow-sm text-primary">
                                  <History className="h-3 w-3" />
                                </span>
                                <div className="flex items-center gap-2 justify-between flex-wrap">
                                  <h4 className="font-bold text-foreground">{evt.title}</h4>
                                  <span className="text-[9px] font-mono text-muted-foreground/80">
                                    {new Date(evt.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-muted-foreground leading-relaxed">
                                  {evt.description}
                                </p>
                                <span className="text-[9px] tracking-wide text-foreground/75 font-semibold">
                                  User: {evt.userName}
                                </span>
                              </div>
                            ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* CREATE LEAD DIALOG MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Capture New Account Lead"
        description="Track dynamic pipeline budgets, currencies, priority tags, and socials."
        size="md"
        footer={
          <>
            <Button
              onClick={() => setCreateModalOpen(false)}
              variant="outline"
              size="sm"
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateLead}
              variant="default"
              size="sm"
              className="h-8 text-xs font-bold"
            >
              Create Lead
            </Button>
          </>
        }
      >
        <form id="create-lead-form" onSubmit={handleCreateLead} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-muted-foreground uppercase">
                Company Name *
              </label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Acme Corp"
                className="h-8.5 bg-background/50 focus-visible:ring-1"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-muted-foreground uppercase">
                Primary Contact *
              </label>
              <Input
                value={formContact}
                onChange={(e) => setFormContact(e.target.value)}
                placeholder="John Carter"
                className="h-8.5 bg-background/50 focus-visible:ring-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-muted-foreground uppercase">
                Email Address
              </label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="carter@acme.com"
                className="h-8.5 bg-background/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-muted-foreground uppercase">
                Phone Number
              </label>
              <Input
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="415-555-0190"
                className="h-8.5 bg-background/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-muted-foreground uppercase">
                Project Budget ($)
              </label>
              <Input
                type="number"
                value={formBudget}
                onChange={(e) => setFormBudget(parseInt(e.target.value) || 0)}
                className="h-8.5 bg-background/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-muted-foreground uppercase">
                Priority
              </label>
              <Select
                value={formPriority}
                onChange={(val) => setFormPriority(val as 'low' | 'medium' | 'high')}
                className="w-full h-8.5 rounded-[calc(var(--radius)-2px)] border border-input bg-background/50 px-2 py-1 text-xs text-foreground focus:outline-none"
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                ]}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-muted-foreground uppercase">
                Source Channel
              </label>
              <Select
                value={formSource}
                onChange={(val) => setFormSource(val)}
                className="w-full h-8.5 rounded-[calc(var(--radius)-2px)] border border-input bg-background/50 px-2 py-1 text-xs text-foreground focus:outline-none"
                options={[
                  { value: 'website', label: 'Website' },
                  { value: 'linkedin', label: 'LinkedIn' },
                  { value: 'upwork', label: 'Upwork' },
                  { value: 'referral', label: 'Referral' },
                  { value: 'ads', label: 'Ads' },
                  { value: 'cold-reach', label: 'Outreach' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-muted-foreground uppercase">
                Work Category
              </label>
              <Input
                value={formWorkType}
                onChange={(e) => setFormWorkType(e.target.value)}
                placeholder="e.g. ERP Development"
                className="h-8.5 bg-background/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-muted-foreground uppercase">
                Tech Stack (comma-split)
              </label>
              <Input
                value={formStack}
                onChange={(e) => setFormStack(e.target.value)}
                placeholder="React, Next.js, Go"
                className="h-8.5 bg-background/50"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Single Lead Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={async () => {
          if (leadToDeleteId) {
            try {
              const res = await fetch(`/api/protected/crm/leads/${leadToDeleteId}`, {
                method: 'DELETE',
              });
              const d = await res.json();
              if (d.success) {
                setLeads(leads.filter((l) => l._id !== leadToDeleteId));
                if (selectedLead?._id === leadToDeleteId) setDrawerOpen(false);
                toast.success('Lead permanently deleted successfully.');
              } else {
                toast.error(getClientError(d).title, {
                  description: getClientError(d).description,
                });
              }
            } catch (e) {
              toast.error('Error deleting lead record.');
            } finally {
              setIsDeleteConfirmOpen(false);
            }
          }
        }}
        title="Delete CRM Lead"
        message="Are you absolutely sure you want to permanently delete this corporate lead profile? This action cannot be undone."
        confirmLabel="Delete Lead"
        cancelLabel="Cancel"
        type="danger"
      />

      {/* Bulk Leads Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isBulkDeleteConfirmOpen}
        onClose={() => setIsBulkDeleteConfirmOpen(false)}
        onConfirm={async () => {
          let successCount = 0;
          for (const leadId of selectedRows) {
            try {
              const res = await fetch(`/api/protected/crm/leads/${leadId}`, { method: 'DELETE' });
              const d = await res.json();
              if (d.success) successCount++;
            } catch (e) {}
          }

          setLeads(leads.filter((l) => !selectedRows.includes(l._id)));
          setSelectedRows([]);
          setIsBulkDeleteConfirmOpen(false);
          toast.success(`Successfully deleted ${successCount} leads!`);
        }}
        title="Delete Selected Leads"
        message={`Are you sure you want to permanently delete all ${selectedRows.length} selected lead records from the acquisition pipeline?`}
        confirmLabel="Delete All Selected"
        cancelLabel="Cancel"
        type="danger"
      />
    </div>
  );
}
