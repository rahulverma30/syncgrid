'use client';

import React, { useState, useEffect } from 'react';
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
        if (leadsData.data.length === 0) {
          // Trigger automatic seed
          await seedInitialLeads();
        } else {
          setLeads(leadsData.data);
        }
      }
    } catch (err: any) {
      toast.error('Failed to connect to database. Showing offline sandbox.');
    } finally {
      setIsLoading(false);
    }
  };

  // Seed 8 realistic, premium enterprise leads
  const seedInitialLeads = async () => {
    const seedData = [
      {
        name: 'Acme Corp',
        contactPerson: 'John Carter',
        email: 'carter@acme.com',
        phone: '415-555-0190',
        budget: 45000,
        status: 'new',
        priority: 'high',
        source: 'linkedin',
        workType: 'Custom ERP Build',
        techStack: ['React', 'Next.js', 'MongoDB'],
      },
      {
        name: 'Globex Inc',
        contactPerson: 'Samantha Vance',
        email: 'vance@globex.co',
        phone: '650-555-0143',
        budget: 25000,
        status: 'contacted',
        priority: 'medium',
        source: 'website',
        workType: 'Corporate Landing',
        techStack: ['TypeScript', 'Tailwind'],
      },
      {
        name: 'Initech LLC',
        contactPerson: 'Peter Gibbons',
        email: 'gibbons@initech.com',
        phone: '206-555-0182',
        budget: 60000,
        status: 'proposal',
        priority: 'high',
        source: 'referral',
        workType: 'E-commerce Redesign',
        techStack: ['React', 'Next.js', 'PostgreSQL'],
      },
      {
        name: 'Umbrella Corp',
        contactPerson: 'Albert Wesker',
        email: 'wesker@umbrella.com',
        phone: '312-555-0105',
        budget: 120000,
        status: 'negotiation',
        priority: 'high',
        source: 'ads',
        workType: 'Bioinformatics Telemetry',
        techStack: ['Node.js', 'Rust', 'Docker'],
      },
      {
        name: 'Veer Enterprise',
        contactPerson: 'Raj Verma',
        email: 'raj@veer.in',
        phone: '91-98765-43210',
        budget: 85000,
        status: 'won',
        priority: 'high',
        source: 'referral',
        workType: 'App Development',
        techStack: ['React Native', 'Firebase'],
      },
      {
        name: 'Hooli Systems',
        contactPerson: 'Gavin Belson',
        email: 'gavin@hooli.xyz',
        phone: '408-555-0129',
        budget: 90000,
        status: 'lost',
        priority: 'low',
        source: 'cold-reach',
        workType: 'Nucleus Cloud Interface',
        techStack: ['Go', 'Kubernetes'],
      },
      {
        name: 'Stark Industries',
        contactPerson: 'Pepper Potts',
        email: 'potts@stark.com',
        phone: '212-555-0177',
        budget: 200000,
        status: 'new',
        priority: 'high',
        source: 'website',
        workType: 'SaaS Dashboard Platform',
        techStack: ['Next.js', 'AWS', 'TensorFlow'],
      },
      {
        name: 'Wayne Enterprises',
        contactPerson: 'Lucius Fox',
        email: 'fox@wayne.co',
        phone: 'Gotham-555-99',
        budget: 150000,
        status: 'proposal',
        priority: 'high',
        source: 'linkedin',
        workType: 'Secured Analytics Portal',
        techStack: ['Next.js', 'PostgreSQL'],
      },
    ];

    try {
      const createdLeads: Lead[] = [];
      for (const item of seedData) {
        const res = await fetch('/api/protected/crm/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
        const d = await res.json();
        if (d.success) createdLeads.push(d.data);
      }
      setLeads(createdLeads);
      toast.success('Successfully auto-seeded CRM database with 8 premium demo leads!');
    } catch (e) {
      toast.error('Failed to seed backend leads.');
    }
  };

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
      fetchLeadsAndSettings();
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        toast.error(d.message || 'Failed to save lead.');
      }
    } catch (e) {
      toast.error('Connection error while saving lead.');
    }
  };

  const handleMoveStage = async (leadId: string, newStage: string) => {
    const originalLeads = [...leads];
    // Optimistic UI Update
    setLeads(leads.map((l) => (l._id === leadId ? { ...l, status: newStage } : l)));
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
        setLeads(leads.map((l) => (l._id === leadId ? d.data : l)));
        if (selectedLead?._id === leadId) setSelectedLead(d.data);
        toast.success(`Lead moved to "${stages.find((s) => s.id === newStage)?.label}"`);
      } else {
        setLeads(originalLeads);
        toast.error('Failed to update stage.');
      }
    } catch (e) {
      setLeads(originalLeads);
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

    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          completeSimulatedUpload();
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  const completeSimulatedUpload = async () => {
    if (!selectedLead) return;

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

  // Convert lead to target project simulator
  const handleConvertToProject = () => {
    if (!selectedLead) return;
    toast.success(
      `CRITICAL ACTION SUCCESSFUL: Lead "${selectedLead.name}" converted to standard Workspace Project! Syncing details...`
    );
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
      <div className="border-b border-border/80 pb-0 flex justify-between items-center gap-4 flex-wrap">
        <div className="flex gap-2">
          {['dashboard', 'pipeline', 'table'].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 relative ${
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

        {/* Quick Search across views */}
        <div className="relative w-full max-w-[200px] mb-2 sm:mb-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company..."
            className="pl-8 h-8 text-xs bg-background/30"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="h-96 flex flex-col items-center justify-center space-y-4">
          <LoadingSpinner className="h-10 w-10 text-primary" />
          <p className="text-xs text-muted-foreground animate-pulse uppercase font-bold tracking-wider">
            Loading active corporate leads database...
          </p>
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
                          (acc, l) => acc + l.reminders.filter((r) => !r.isCompleted).length,
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
                          .filter((r) => !r.isCompleted)
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
                        (l) => l.reminders.filter((r) => !r.isCompleted).length === 0
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
              {/* Kanban filter options */}
              <div className="flex gap-2 flex-wrap pb-2 border-b border-border/40">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="h-8.5 rounded-lg border border-border/80 bg-background/50 px-2 py-1 text-xs text-foreground focus:outline-none"
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="h-8.5 rounded-lg border border-border/80 bg-background/50 px-2 py-1 text-xs text-foreground focus:outline-none"
                >
                  <option value="">All Sources</option>
                  {stages.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.label}
                    </option>
                  ))}
                  <option value="linkedin">LinkedIn</option>
                  <option value="website">Website</option>
                  <option value="referral">Referral</option>
                  <option value="ads">Ads</option>
                  <option value="cold-reach">Outreach</option>
                </select>
              </div>

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
                      className="w-72 flex-shrink-0 bg-muted/10 border border-border/80 rounded-xl p-3.5 space-y-4 self-stretch flex flex-col min-h-[480px]"
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
                            onClick={() => {
                              setSelectedLead(lead);
                              setDrawerOpen(true);
                            }}
                            className="bg-card/75 border border-border/80 rounded-lg p-3.5 space-y-3 shadow-sm hover:border-primary/30 transition-all duration-300 hover:shadow-md cursor-pointer text-left relative overflow-hidden group"
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
                                <select
                                  onClick={(e) => e.stopPropagation()}
                                  value={lead.status}
                                  onChange={(e) => handleMoveStage(lead._id, e.target.value)}
                                  className="h-5 rounded border border-border/80 bg-background/50 px-1 text-[8px] font-bold text-muted-foreground uppercase focus:outline-none"
                                >
                                  {stages.map((st) => (
                                    <option key={st.id} value={st.id}>
                                      Shift to: {st.label}
                                    </option>
                                  ))}
                                </select>
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
              <div className="flex justify-between items-center flex-wrap gap-2 pb-2 border-b border-border/40">
                <div className="flex gap-2 flex-wrap items-center">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-8 rounded-lg border border-border/80 bg-background/50 px-2 text-xs text-foreground focus:outline-none"
                  >
                    <option value="">All Pipeline Stages</option>
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="h-8 rounded-lg border border-border/80 bg-background/50 px-2 text-xs text-foreground focus:outline-none"
                  >
                    <option value="">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="h-8 rounded-lg border border-border/80 bg-background/50 px-2 text-xs text-foreground focus:outline-none"
                  >
                    <option value="">All Sources</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="website">Website</option>
                    <option value="referral">Referral</option>
                    <option value="ads">Ads</option>
                    <option value="cold-reach">Outreach</option>
                  </select>
                </div>

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
                      <select
                        onChange={(e) => handleBulkReassign(e.target.value)}
                        className="h-8 rounded border border-border/80 bg-background px-2 text-xs text-foreground"
                      >
                        <option value="">Shift Stage...</option>
                        {stages.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.label}
                          </option>
                        ))}
                      </select>
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
                            className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white select-none"
                            style={{
                              backgroundColor:
                                stages.find((s) => s.id === lead.status)?.color || '#999',
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
              className="fixed top-0 right-0 h-full w-full max-w-lg z-50 border-l border-border bg-popover/95 backdrop-blur-md shadow-2xl flex flex-col overflow-hidden text-left"
            >
              {/* Header section */}
              <div className="p-5 border-b border-border/40 flex items-center justify-between bg-muted/10">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-black tracking-wide text-primary uppercase">
                    Lead profile
                  </span>
                  <h3 className="text-base font-black text-foreground">{selectedLead.name}</h3>
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
              <div className="flex border-b border-border/40 px-3 py-1.5 flex-wrap gap-1 bg-card/20 select-none">
                {['overview', 'notes', 'reminders', 'attachments', 'timeline'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setDrawerTab(t)}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      drawerTab === t
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted/20 hover:text-foreground'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Dynamic Sub-Tab View Content */}
              <div className="flex-grow overflow-y-auto p-5 space-y-6">
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
                    <div className="space-y-2">
                      <textarea
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="Type threaded notes, close comments, or meeting minutes..."
                        className="w-full h-20 p-2.5 rounded-lg border border-border bg-background/50 focus:outline-none focus:ring-2 focus:ring-ring text-xs leading-relaxed"
                      />
                      <div className="flex items-center justify-between flex-wrap gap-2 select-none">
                        <div className="flex gap-3">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={noteIsPinned}
                              onChange={(e) => setNoteIsPinned(e.target.checked)}
                            />
                            <Pin className="h-3.5 w-3.5 text-muted-foreground" />
                            Pin Note
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer text-rose-500/80">
                            <input
                              type="checkbox"
                              checked={noteIsPrivate}
                              onChange={(e) => setNoteIsPrivate(e.target.checked)}
                            />
                            <EyeOff className="h-3.5 w-3.5" />
                            Private (Internal)
                          </label>
                        </div>
                        <Button onClick={handleAddNote} size="sm" className="h-8 text-xs gap-1">
                          <Send className="h-3 w-3" />
                          Log Note
                        </Button>
                      </div>
                    </div>

                    {/* Notes Feed items */}
                    <div className="space-y-3 border-t border-border/30 pt-4">
                      {selectedLead.notes
                        ?.slice()
                        .reverse()
                        .map((note, idx) => (
                          <div
                            key={idx}
                            className="p-3 border border-border/40 bg-card/30 rounded-xl space-y-2 relative text-left"
                          >
                            {note.isPinned && (
                              <span className="absolute top-3 right-3 text-[10px] font-bold text-primary flex items-center gap-0.5">
                                <Pin className="h-3 w-3 rotate-45" />
                                Pinned
                              </span>
                            )}
                            <div className="flex items-center gap-1.5">
                              <span className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-[8px]">
                                {note.createdByName[0]}
                              </span>
                              <span className="font-bold text-foreground">
                                {note.createdByName}
                              </span>
                              <span className="text-[9px] font-mono text-muted-foreground/80">
                                • {new Date(note.createdAt).toLocaleDateString()}
                              </span>
                              {note.isPrivate && (
                                <span className="text-[8px] font-bold uppercase tracking-wider text-rose-500 font-mono bg-rose-500/10 rounded px-1">
                                  Internal
                                </span>
                              )}
                            </div>
                            <p className="text-muted-foreground leading-relaxed pl-1 whitespace-pre-line">
                              {note.content}
                            </p>
                          </div>
                        ))}

                      {(!selectedLead.notes || selectedLead.notes.length === 0) && (
                        <div className="py-10 text-center text-muted-foreground select-none">
                          No notes have been logged for this lead.
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
                          <select
                            value={reminderType}
                            onChange={(e) => setReminderType(e.target.value as any)}
                            className="w-full h-8.5 rounded-md border border-input bg-background/50 px-2 py-1 text-xs text-foreground focus:outline-none"
                          >
                            <option value="custom">Custom Task</option>
                            <option value="call">Phone Call</option>
                            <option value="meeting">Sales Meeting</option>
                            <option value="email">Send Email</option>
                          </select>
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
                          <select
                            value={attachCategory}
                            onChange={(e) => setAttachCategory(e.target.value as any)}
                            className="w-full h-8.5 rounded-md border border-input bg-background/50 px-2 py-1 text-xs text-foreground focus:outline-none"
                          >
                            <option value="proposal">Sales Proposal</option>
                            <option value="contract">Agreement/Contract</option>
                            <option value="other">Other Document</option>
                          </select>
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
                                Size: {Math.round(file.size / 1024)} KB • category: {file.category}
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
      </AnimatePresence>

      {/* CREATE LEAD DIALOG MODAL */}
      <AnimatePresence>
        {createModalOpen && (
          <>
            {/* Backdrop click closer */}
            <div
              className="fixed inset-0 z-50 bg-background/50 backdrop-blur-sm"
              onClick={() => setCreateModalOpen(false)}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl z-50 text-left space-y-4"
            >
              <div className="space-y-1 border-b border-border/40 pb-3 select-none">
                <h4 className="text-sm font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Sparkles className="h-4.5 w-4.5 text-primary animate-pulse" />
                  Capture New Account Lead
                </h4>
                <p className="text-[10px] text-muted-foreground">
                  Track dynamic pipeline budgets, currencies, priority tags, and socials.
                </p>
              </div>

              <form onSubmit={handleCreateLead} className="space-y-3.5 text-xs">
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
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value as any)}
                      className="w-full h-8.5 rounded-md border border-input bg-background/50 px-2 py-1 text-xs text-foreground focus:outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">
                      Source Channel
                    </label>
                    <select
                      value={formSource}
                      onChange={(e) => setFormSource(e.target.value)}
                      className="w-full h-8.5 rounded-md border border-input bg-background/50 px-2 py-1 text-xs text-foreground focus:outline-none"
                    >
                      <option value="website">Website</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="upwork">Upwork</option>
                      <option value="referral">Referral</option>
                      <option value="ads">Ads</option>
                      <option value="cold-reach">Outreach</option>
                    </select>
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

                <div className="flex justify-end gap-2 pt-4 border-t border-border/40 select-none">
                  <Button
                    onClick={() => setCreateModalOpen(false)}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="default"
                    size="sm"
                    className="h-8 text-xs font-bold"
                  >
                    Ingest Lead
                  </Button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
                toast.error(d.message || 'Unauthorized delete request.');
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
