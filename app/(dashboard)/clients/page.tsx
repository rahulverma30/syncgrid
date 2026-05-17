'use client';

import React, { useState, useEffect } from 'react';
import {
  PageHeader,
  Card,
  CardContent,
  Button,
  Input,
  LoadingSpinner,
  Badge,
} from '@/components/ui';
import {
  Users,
  Search,
  Download,
  Trash,
  Plus,
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
  Send,
  Link,
  ChevronRight,
  UserPlus,
  Briefcase,
  AlertCircle,
  Pin,
  EyeOff,
  User,
  Heart,
  ShieldCheck,
  Building,
  ArrowUpRight,
  RefreshCw,
  FolderMinus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { AreaChartWrapper, PieChartWrapper, BarChartWrapper } from '@/components/ui/charts';

// Client Management Types
interface ClientContact {
  _id?: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  communicationPref: 'email' | 'phone' | 'slack' | 'zoom';
}

interface ClientNote {
  _id?: string;
  content: string;
  createdByName: string;
  isPinned: boolean;
  isPrivate: boolean;
  createdAt: string;
}

interface ClientDocument {
  _id?: string;
  name: string;
  category: 'contract' | 'proposal' | 'NDA' | 'invoice' | 'onboarding' | 'legal';
  url: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
}

interface ClientContract {
  _id?: string;
  title: string;
  value: number;
  startDate?: string;
  endDate?: string;
  status: 'active' | 'expired' | 'renewal-pending';
}

interface ClientMeeting {
  _id?: string;
  title: string;
  dueDate: string;
  attendees: string[];
  notes?: string;
  isCompleted: boolean;
}

interface ClientCommLog {
  _id?: string;
  type: 'call' | 'email' | 'meeting' | 'other';
  summary: string;
  loggedBy: string;
  createdAt: string;
}

interface ClientTimelineEvent {
  _id?: string;
  type: string;
  title: string;
  description: string;
  userName: string;
  createdAt: string;
}

interface ClientAccount {
  _id: string;
  name: string;
  clientType: 'VIP' | 'Enterprise' | 'Startup' | 'High Value' | 'Retainer' | 'Inactive';
  industry: string;
  emails: string[];
  phones: string[];
  address?: string;
  timezone: string;
  website?: string;
  socialLinks: Record<string, string>;
  companySize: '1-10' | '11-50' | '51-200' | '201+';
  revenueContribution: number;
  accountManager: string;
  onboardingStatus: 'pending' | 'in-progress' | 'completed';
  retentionStatus: 'retained' | 'churn-risk' | 'churned';
  healthScore: number;
  customFields: Record<string, string>;
  isArchived: boolean;
  contacts: ClientContact[];
  notes: ClientNote[];
  documents: ClientDocument[];
  contracts: ClientContract[];
  meetings: ClientMeeting[];
  communicationLogs: ClientCommLog[];
  timeline: ClientTimelineEvent[];
  createdAt: string;
}

export default function ClientsPage() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analytics');

  // Advanced Ledger filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [onboardingFilter, setOnboardingFilter] = useState('');
  const [retentionFilter, setRetentionFilter] = useState('');
  const [managerFilter, setManagerFilter] = useState('');

  // Selected row checkbox states
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Sliding Account detail drawer state
  const [selectedClient, setSelectedClient] = useState<ClientAccount | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState('overview');

  // Account Ingestion dialog modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<
    'VIP' | 'Enterprise' | 'Startup' | 'High Value' | 'Retainer' | 'Inactive'
  >('Startup');
  const [formIndustry, setFormIndustry] = useState('Technology');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formTimezone, setFormTimezone] = useState('UTC');
  const [formWebsite, setFormWebsite] = useState('');
  const [formSize, setFormSize] = useState<'1-10' | '11-50' | '51-200' | '201+'>('1-10');
  const [formRevenue, setFormRevenue] = useState(25000);
  const [formManager, setFormManager] = useState('');

  // Dynamic Contact Form inside drawer
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactPrimary, setContactPrimary] = useState(false);
  const [contactPref, setContactPref] = useState<'email' | 'phone' | 'slack' | 'zoom'>('email');

  // Threaded Note inputs
  const [noteInput, setNoteInput] = useState('');
  const [notePinned, setNotePinned] = useState(false);
  const [notePrivate, setNotePrivate] = useState(false);

  // Contract Creator inputs
  const [contractTitle, setContractTitle] = useState('');
  const [contractValue, setContractValue] = useState(5000);
  const [contractStart, setContractStart] = useState('');
  const [contractEnd, setContractEnd] = useState('');

  // Meetings scheduler inputs
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingAttendees, setMeetingAttendees] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');

  // Communication logs input
  const [commType, setCommType] = useState<'call' | 'email' | 'meeting' | 'other'>('email');
  const [commSummary, setCommSummary] = useState('');

  // Secure File upload progress bar uploader
  const [fileName, setFileName] = useState('');
  const [fileCat, setFileCat] = useState<
    'contract' | 'proposal' | 'NDA' | 'invoice' | 'onboarding' | 'legal'
  >('proposal');
  const [uploadPercentage, setUploadPercentage] = useState(-1);

  async function seedDemoClients() {
    const demoAccounts = [
      {
        name: 'Stark Industries',
        clientType: 'VIP',
        industry: 'Advanced Energy',
        emails: ['potts@stark.com'],
        phones: ['212-555-0177'],
        address: 'Stark Tower, New York, NY',
        timezone: 'EST',
        website: 'starkindustries.com',
        companySize: '201+',
        revenueContribution: 250000,
        accountManager: 'Pepper Potts',
        onboardingStatus: 'completed',
        retentionStatus: 'retained',
        healthScore: 95,
      },
      {
        name: 'Wayne Enterprises',
        clientType: 'VIP',
        industry: 'Security & Logistics',
        emails: ['fox@wayne.co'],
        phones: ['Gotham-555-10'],
        address: 'Wayne Tower, Gotham City',
        timezone: 'EST',
        website: 'waynecorp.com',
        companySize: '201+',
        revenueContribution: 180000,
        accountManager: 'Lucius Fox',
        onboardingStatus: 'completed',
        retentionStatus: 'retained',
        healthScore: 92,
      },
      {
        name: 'Globex Corp',
        clientType: 'Enterprise',
        industry: 'High Tech',
        emails: ['scorpio@globex.com'],
        phones: ['650-555-0120'],
        address: 'Cypress Creek, OR',
        timezone: 'PST',
        website: 'globex.co',
        companySize: '51-200',
        revenueContribution: 75000,
        accountManager: 'Samantha Vance',
        onboardingStatus: 'in-progress',
        retentionStatus: 'retained',
        healthScore: 84,
      },
      {
        name: 'Hooli Systems',
        clientType: 'Retainer',
        industry: 'Search & Cloud',
        emails: ['belson@hooli.xyz'],
        phones: ['408-555-0129'],
        address: 'Hooli Campus, Mountain View, CA',
        timezone: 'PST',
        website: 'hooli.xyz',
        companySize: '201+',
        revenueContribution: 90000,
        accountManager: 'Pepper Potts',
        onboardingStatus: 'completed',
        retentionStatus: 'churn-risk',
        healthScore: 60,
      },
      {
        name: 'Initech LLC',
        clientType: 'Startup',
        industry: 'Software Quality',
        emails: ['gibbons@initech.com'],
        phones: ['206-555-0182'],
        address: '4120 Freemont Ave, Seattle, WA',
        timezone: 'PST',
        website: 'initech.com',
        companySize: '11-50',
        revenueContribution: 35000,
        accountManager: 'Lucius Fox',
        onboardingStatus: 'in-progress',
        retentionStatus: 'retained',
        healthScore: 78,
      },
      {
        name: 'Veer Enterprise',
        clientType: 'High Value',
        industry: 'Fintech Solutions',
        emails: ['raj@veer.in'],
        phones: ['91-98765-43210'],
        address: 'Connaught Place, New Delhi',
        timezone: 'IST',
        website: 'veer.in',
        companySize: '51-200',
        revenueContribution: 120000,
        accountManager: 'Samantha Vance',
        onboardingStatus: 'completed',
        retentionStatus: 'retained',
        healthScore: 89,
      },
    ];

    try {
      const created: ClientAccount[] = [];
      for (const item of demoAccounts) {
        const res = await fetch('/api/protected/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
        const d = await res.json();
        if (d.success) created.push(d.data);
      }
      setClients(created);
      toast.success('Successfully auto-seeded Client Vault with 6 high-value accounts!');
    } catch (e) {
      toast.error('Failed to auto-seed demo accounts.');
    }
  }

  async function fetchClients() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/protected/clients');
      const d = await res.json();
      if (d.success) {
        if (d.data.length === 0) {
          await seedDemoClients();
        } else {
          setClients(d.data);
        }
      }
    } catch (e) {
      toast.error('DB Connection error. Running offline sandbox.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
      fetchClients();
    }, 0);
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      toast.error('Client Company Name is required.');
      return;
    }

    try {
      const res = await fetch('/api/protected/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          clientType: formType,
          industry: formIndustry,
          emails: formEmail ? [formEmail] : [],
          phones: formPhone ? [formPhone] : [],
          address: formAddress,
          timezone: formTimezone,
          website: formWebsite,
          companySize: formSize,
          revenueContribution: formRevenue,
          accountManager: formManager || session?.user?.name || 'Pepper Potts',
        }),
      });

      const d = await res.json();
      if (d.success) {
        setClients([d.data, ...clients]);
        setCreateModalOpen(false);
        toast.success(`Client account "${formName}" onboarded successfully!`);
        // Reset form fields
        setFormName('');
        setFormEmail('');
        setFormPhone('');
        setFormAddress('');
        setFormWebsite('');
      } else {
        toast.error(d.message || 'Validation error while saving account.');
      }
    } catch (e) {
      toast.error('API connection error.');
    }
  };

  const handleUpdateStatus = async (clientId: string, field: string, value: any) => {
    const original = [...clients];
    // Optimistic UI Shift
    setClients(clients.map((c) => (c._id === clientId ? { ...c, [field]: value } : c)));
    if (selectedClient?._id === clientId) {
      setSelectedClient({ ...selectedClient, [field]: value });
    }

    try {
      const res = await fetch(`/api/protected/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      const d = await res.json();
      if (d.success) {
        setClients(clients.map((c) => (c._id === clientId ? d.data : c)));
        if (selectedClient?._id === clientId) setSelectedClient(d.data);
        toast.success(`Client ${field} updated successfully!`);
      } else {
        setClients(original);
        toast.error('Failed to synchronize status.');
      }
    } catch (e) {
      setClients(original);
      toast.error('Network sync error.');
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !selectedClient) return;

    try {
      const res = await fetch(`/api/protected/clients/${selectedClient._id}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          role: contactRole,
          email: contactEmail,
          phone: contactPhone,
          isPrimary: contactPrimary,
          communicationPref: contactPref,
        }),
      });

      const d = await res.json();
      if (d.success) {
        setSelectedClient(d.data);
        setClients(clients.map((c) => (c._id === d.data._id ? d.data : c)));
        setContactName('');
        setContactRole('');
        setContactEmail('');
        setContactPhone('');
        setContactPrimary(false);
        toast.success('New customer point of contact registered!');
      } else {
        toast.error('Failed to append contact.');
      }
    } catch (e) {
      toast.error('API connection error.');
    }
  };

  const handleAddNote = async () => {
    if (!noteInput.trim() || !selectedClient) return;

    try {
      const res = await fetch(`/api/protected/clients/${selectedClient._id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: noteInput,
          isPinned: notePinned,
          isPrivate: notePrivate,
        }),
      });

      const d = await res.json();
      if (d.success) {
        setSelectedClient(d.data);
        setClients(clients.map((c) => (c._id === d.data._id ? d.data : c)));
        setNoteInput('');
        setNotePinned(false);
        setNotePrivate(false);
        toast.success('Internal relationship note logged!');
      } else {
        toast.error('Failed to append note.');
      }
    } catch (e) {
      toast.error('API connection error.');
    }
  };

  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractTitle || !selectedClient) return;

    try {
      const res = await fetch(`/api/protected/clients/${selectedClient._id}/contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: contractTitle,
          value: contractValue,
          startDate: contractStart,
          endDate: contractEnd,
          status: 'active',
        }),
      });

      const d = await res.json();
      if (d.success) {
        setSelectedClient(d.data);
        setClients(clients.map((c) => (c._id === d.data._id ? d.data : c)));
        setContractTitle('');
        setContractValue(5000);
        toast.success('Contract pricing agreement registered!');
      } else {
        toast.error('Failed to log contract.');
      }
    } catch (e) {
      toast.error('API connection error.');
    }
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle || !meetingDate || !selectedClient) return;

    try {
      const res = await fetch(`/api/protected/clients/${selectedClient._id}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: meetingTitle,
          dueDate: meetingDate,
          attendees: meetingAttendees ? meetingAttendees.split(',').map((s) => s.trim()) : [],
          notes: meetingNotes,
        }),
      });

      const d = await res.json();
      if (d.success) {
        setSelectedClient(d.data);
        setClients(clients.map((c) => (c._id === d.data._id ? d.data : c)));
        setMeetingTitle('');
        setMeetingDate('');
        setMeetingAttendees('');
        setMeetingNotes('');
        toast.success('Relationship sync-up meeting scheduled!');
      } else {
        toast.error('Failed to log meeting.');
      }
    } catch (e) {
      toast.error('API connection error.');
    }
  };

  const handleLogCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commSummary.trim() || !selectedClient) return;

    try {
      const res = await fetch(`/api/protected/clients/${selectedClient._id}/communication`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: commType,
          summary: commSummary,
        }),
      });

      const d = await res.json();
      if (d.success) {
        setSelectedClient(d.data);
        setClients(clients.map((c) => (c._id === d.data._id ? d.data : c)));
        setCommSummary('');
        toast.success('Client contact trace communication logged!');
      } else {
        toast.error('Failed to log communication.');
      }
    } catch (e) {
      toast.error('API connection error.');
    }
  };

  const handleSimulateUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim() || !selectedClient) return;

    setUploadPercentage(0);
    const interval = setInterval(() => {
      setUploadPercentage((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          completeSimulatedUpload();
          return 100;
        }
        return prev + 20;
      });
    }, 150);
  };

  const completeSimulatedUpload = async () => {
    if (!selectedClient) return;

    try {
      const res = await fetch(`/api/protected/clients/${selectedClient._id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
          url: 'https://syncgrid-enterprise.s3.amazonaws.com/contracts/NDA_signed_993.pdf',
          size: Math.round(1024 * 1024 * (1.5 + Math.random() * 3)),
          category: fileCat,
        }),
      });

      const d = await res.json();
      if (d.success) {
        setSelectedClient(d.data);
        setClients(clients.map((c) => (c._id === d.data._id ? d.data : c)));
        setFileName('');
        setUploadPercentage(-1);
        toast.success('Onboarding agreement NDA attached to vaults!');
      } else {
        toast.error('Failed to save file references.');
        setUploadPercentage(-1);
      }
    } catch (e) {
      toast.error('Secure uploader connection error.');
      setUploadPercentage(-1);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Permanently purge this client account from ERP databases?')) return;

    try {
      const res = await fetch(`/api/protected/clients/${clientId}`, { method: 'DELETE' });
      const d = await res.json();
      if (d.success) {
        setClients(clients.filter((c) => c._id !== clientId));
        if (selectedClient?._id === clientId) setDrawerOpen(false);
        toast.success('Client permanently purged successfully.');
      } else {
        toast.error(d.message || 'Access restricted.');
      }
    } catch (e) {
      toast.error('Error executing delete.');
    }
  };

  const handleBulkReassign = async (mgrName: string) => {
    let count = 0;
    const original = [...clients];

    for (const cId of selectedRows) {
      try {
        const res = await fetch(`/api/protected/clients/${cId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountManager: mgrName }),
        });
        const d = await res.json();
        if (d.success) count++;
      } catch (e) {}
    }

    fetchClients();
    setSelectedRows([]);
    toast.success(`Successfully shifted ${count} accounts to manager "${mgrName}"`);
  };

  const handleExportCSV = () => {
    const headers = [
      'Client Name',
      'Type',
      'Industry',
      'Manager',
      'Health Score',
      'Onboarding',
      'Revenue Contribution ($)',
      'Created At',
    ];
    const rows = filteredClients.map((c) => [
      c.name,
      c.clientType,
      c.industry,
      c.accountManager,
      c.healthScore,
      c.onboardingStatus,
      c.revenueContribution,
      new Date(c.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((v) => `"${v}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `syncgrid_client_ledger_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Successfully downloaded Client report as CSV.');
  };

  if (!mounted) return null;

  // Filter accounts
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.accountManager.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter ? client.clientType === typeFilter : true;
    const matchesOnboarding = onboardingFilter
      ? client.onboardingStatus === onboardingFilter
      : true;
    const matchesRetention = retentionFilter ? client.retentionStatus === retentionFilter : true;
    const matchesManager = managerFilter ? client.accountManager === managerFilter : true;

    return matchesSearch && matchesType && matchesOnboarding && matchesRetention && matchesManager;
  });

  // KPI math
  const clientCount = filteredClients.length;
  const totalARR = filteredClients.reduce((sum, c) => sum + (c.revenueContribution || 0), 0);
  const avgHealth =
    clientCount > 0
      ? Math.round(filteredClients.reduce((sum, c) => sum + c.healthScore, 0) / clientCount)
      : 0;
  const onboardingCompletion =
    clientCount > 0
      ? Math.round(
          (filteredClients.filter((c) => c.onboardingStatus === 'completed').length / clientCount) *
            100
        )
      : 0;

  // Recharts structures
  const arrGrowthData = [
    { month: 'Jan', revenue: Math.round(totalARR * 0.75) },
    { month: 'Feb', revenue: Math.round(totalARR * 0.85) },
    { month: 'Mar', revenue: Math.round(totalARR * 0.9) },
    { month: 'Apr', revenue: Math.round(totalARR * 0.95) },
    { month: 'May', revenue: totalARR },
  ];

  const typeChartData = [
    { name: 'VIP Accounts', value: filteredClients.filter((c) => c.clientType === 'VIP').length },
    {
      name: 'Enterprises',
      value: filteredClients.filter((c) => c.clientType === 'Enterprise').length,
    },
    { name: 'Retainers', value: filteredClients.filter((c) => c.clientType === 'Retainer').length },
    { name: 'Startups', value: filteredClients.filter((c) => c.clientType === 'Startup').length },
    {
      name: 'High Value',
      value: filteredClients.filter((c) => c.clientType === 'High Value').length,
    },
  ].filter((d) => d.value > 0);

  const managerDistribution = [
    {
      name: 'Pepper Potts',
      clients: filteredClients.filter((c) => c.accountManager === 'Pepper Potts').length,
    },
    {
      name: 'Lucius Fox',
      clients: filteredClients.filter((c) => c.accountManager === 'Lucius Fox').length,
    },
    {
      name: 'Samantha Vance',
      clients: filteredClients.filter((c) => c.accountManager === 'Samantha Vance').length,
    },
  ].filter((d) => d.clients > 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        eyebrow="Relationship Intelligence System"
        title="Client lifecycle vault"
        description="Monitor signed contract valuations, customer churn indicators, onboarding checklists, and NDAs."
        actions={
          <div className="flex items-center gap-2 select-none">
            <Button
              onClick={fetchClients}
              variant="outline"
              size="sm"
              className="h-9 hover:bg-accent/40 text-xs gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Tally ledger
            </Button>
            <Button
              onClick={() => setCreateModalOpen(true)}
              variant="default"
              size="sm"
              className="h-9 text-xs gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Onboard Client
            </Button>
          </div>
        }
      />

      {/* Tabs selectors */}
      <div className="border-b border-border/85 pb-0 flex justify-between items-center gap-4 flex-wrap select-none">
        <div className="flex gap-2">
          {['analytics', 'ledger'].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 relative ${
                activeTab === t
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'analytics' ? 'Account Analytics' : 'Client Accounts Ledger'}
            </button>
          ))}
        </div>

        {/* Global filter box */}
        <div className="relative w-full max-w-[200px] mb-2 sm:mb-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search accounts..."
            className="pl-8 h-8 text-xs bg-background/30"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="h-96 flex flex-col items-center justify-center space-y-4">
          <LoadingSpinner className="h-10 w-10 text-primary" />
          <p className="text-xs text-muted-foreground animate-pulse uppercase font-bold tracking-wider">
            Loading dynamic customer accounts vault...
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* TAB 1: ANALYTICS */}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 text-left"
            >
              {/* Scorecard KPIs */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 select-none">
                <Card className="bg-card/40 backdrop-blur-md border border-border/80 hover:border-primary/20 transition-all duration-300">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Active Clients
                      </p>
                      <h3 className="text-2xl font-black font-mono">{clientCount}</h3>
                      <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-0.5">
                        <TrendingUp className="h-3 w-3" />
                        +8.2% retention
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Users className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/40 backdrop-blur-md border border-border/80 hover:border-primary/20 transition-all duration-300">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Aggregate ARR
                      </p>
                      <h3 className="text-2xl font-black font-mono text-primary">
                        ${totalARR.toLocaleString()}
                      </h3>
                      <p className="text-[10px] text-muted-foreground">Contract sum value</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <DollarSign className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/40 backdrop-blur-md border border-border/80 hover:border-primary/20 transition-all duration-300">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Avg Health Index
                      </p>
                      <h3 className="text-2xl font-black font-mono">{avgHealth}%</h3>
                      <p className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider">
                        Stable relationship
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <Heart className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/40 backdrop-blur-md border border-border/80 hover:border-primary/20 transition-all duration-300">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Onboard Progress
                      </p>
                      <h3 className="text-2xl font-black font-mono">{onboardingCompletion}%</h3>
                      <p className="text-[10px] text-rose-500 font-semibold uppercase tracking-wider">
                        Fully converted
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Graphical grids */}
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                <Card className="lg:col-span-2 bg-card/25 border border-border/80">
                  <CardContent className="p-5 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">ARR Contribution Curve</h4>
                      <p className="text-[10px] text-muted-foreground">
                        Aggregated client recurring contract metrics per interval
                      </p>
                    </div>
                    <AreaChartWrapper
                      data={arrGrowthData}
                      xKey="month"
                      metrics={[
                        { key: 'revenue', label: 'ARR Yield ($)', color: 'hsl(var(--primary))' },
                      ]}
                      height={200}
                    />
                  </CardContent>
                </Card>

                <Card className="bg-card/25 border border-border/80">
                  <CardContent className="p-5 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Account Classification</h4>
                      <p className="text-[10px] text-muted-foreground">
                        Contract category breakdown ratio
                      </p>
                    </div>
                    {typeChartData.length === 0 ? (
                      <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">
                        No clients registered.
                      </div>
                    ) : (
                      <PieChartWrapper data={typeChartData} height={200} />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Bottom splits */}
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                <Card className="bg-card/25 border border-border/80">
                  <CardContent className="p-5 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Workload Distribution</h4>
                      <p className="text-[10px] text-muted-foreground">
                        Number of accounts managed per staff leader
                      </p>
                    </div>
                    <BarChartWrapper
                      data={managerDistribution}
                      xKey="name"
                      metrics={[
                        { key: 'clients', label: 'Clients Managed', color: 'hsl(var(--primary))' },
                      ]}
                      height={180}
                    />
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2 bg-card/25 border border-border/80">
                  <CardContent className="p-5 space-y-3.5">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        Active Churn Chokepoints
                      </h4>
                      <p className="text-[10px] text-muted-foreground">
                        Accounts displaying churn risk indicators or low health indices
                      </p>
                    </div>

                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {clients
                        .filter((c) => c.healthScore < 80 || c.retentionStatus === 'churn-risk')
                        .map((acc) => (
                          <div
                            key={acc._id}
                            onClick={() => {
                              setSelectedClient(acc);
                              setDrawerOpen(true);
                              setDrawerTab('overview');
                            }}
                            className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card/45 hover:bg-card hover:border-border transition-colors cursor-pointer"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span className="h-7 w-7 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mt-0.5">
                                <AlertCircle className="h-4 w-4" />
                              </span>
                              <div className="space-y-0.5 min-w-0">
                                <h5 className="text-xs font-bold text-foreground truncate">
                                  {acc.name}
                                </h5>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  Manager:{' '}
                                  <span className="font-semibold text-foreground/80">
                                    {acc.accountManager}
                                  </span>{' '}
                                  • Health:{' '}
                                  <span className="font-bold text-rose-500">
                                    {acc.healthScore}%
                                  </span>
                                </p>
                              </div>
                            </div>
                            <span className="text-[9px] font-mono rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5">
                              Alert: Churn Risk
                            </span>
                          </div>
                        ))}
                      {clients.every(
                        (c) => c.healthScore >= 80 && c.retentionStatus !== 'churn-risk'
                      ) && (
                        <div className="py-12 text-center text-xs text-muted-foreground">
                          🎉 Magnificent! All client accounts maintain a high health rating!
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* TAB 2: LEDGER */}
          {activeTab === 'ledger' && (
            <motion.div
              key="ledger"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4 text-left"
            >
              {/* Ledger filters */}
              <div className="flex justify-between items-center flex-wrap gap-2 pb-2 border-b border-border/40 select-none">
                <div className="flex gap-2 flex-wrap items-center">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="h-8 rounded-lg border border-border/80 bg-background/50 px-2 text-xs text-foreground focus:outline-none"
                  >
                    <option value="">All Classifications</option>
                    <option value="VIP">VIP</option>
                    <option value="Enterprise">Enterprise</option>
                    <option value="Startup">Startup</option>
                    <option value="Retainer">Retainer</option>
                    <option value="High Value">High Value</option>
                  </select>
                  <select
                    value={onboardingFilter}
                    onChange={(e) => setOnboardingFilter(e.target.value)}
                    className="h-8 rounded-lg border border-border/80 bg-background/50 px-2 text-xs text-foreground focus:outline-none"
                  >
                    <option value="">All Onboard Progress</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <select
                    value={retentionFilter}
                    onChange={(e) => setRetentionFilter(e.target.value)}
                    className="h-8 rounded-lg border border-border/80 bg-background/50 px-2 text-xs text-foreground focus:outline-none"
                  >
                    <option value="">All Retention Scores</option>
                    <option value="retained">Retained</option>
                    <option value="churn-risk">Churn Risk</option>
                    <option value="churned">Churned</option>
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

              {/* Bulk actions bar */}
              <AnimatePresence>
                {selectedRows.length > 0 && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    className="p-2 border border-border/80 bg-accent/20 backdrop-blur-md rounded-xl flex items-center justify-between gap-4 text-xs font-bold shadow-lg"
                  >
                    <span className="pl-2">{selectedRows.length} Accounts selected</span>
                    <div className="flex gap-2 items-center">
                      <select
                        onChange={(e) => handleBulkReassign(e.target.value)}
                        className="h-8 rounded border border-border/80 bg-background px-2 text-xs text-foreground focus:outline-none"
                      >
                        <option value="">Bulk Shift Owner...</option>
                        <option value="Pepper Potts">Pepper Potts</option>
                        <option value="Lucius Fox">Lucius Fox</option>
                        <option value="Samantha Vance">Samantha Vance</option>
                      </select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* TanStack Table ledger grid */}
              <div className="overflow-x-auto border border-border/60 rounded-xl bg-card/20 select-none">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/20">
                      <th className="py-2.5 px-4 w-10">
                        <input
                          type="checkbox"
                          checked={
                            selectedRows.length === filteredClients.length &&
                            filteredClients.length > 0
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRows(filteredClients.map((c) => c._id));
                            } else {
                              setSelectedRows([]);
                            }
                          }}
                        />
                      </th>
                      <th className="py-2.5 px-4">Client Company</th>
                      <th className="py-2.5 px-4">Classification</th>
                      <th className="py-2.5 px-4">Industry</th>
                      <th className="py-2.5 px-4">Account Owner</th>
                      <th className="py-2.5 px-4">Health Index</th>
                      <th className="py-2.5 px-4">ARR Yield</th>
                      <th className="py-2.5 px-4 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((acc) => (
                      <tr
                        key={acc._id}
                        onClick={() => {
                          setSelectedClient(acc);
                          setDrawerOpen(true);
                          setDrawerTab('overview');
                        }}
                        className="border-b border-border/40 hover:bg-muted/10 text-xs transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(acc._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRows([...selectedRows, acc._id]);
                              } else {
                                setSelectedRows(selectedRows.filter((id) => id !== acc._id));
                              }
                            }}
                          />
                        </td>
                        <td className="py-3 px-4 font-bold text-foreground hover:text-primary transition-colors">
                          {acc.name}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border select-none"
                            style={{
                              backgroundColor:
                                acc.clientType === 'VIP'
                                  ? 'rgba(234, 179, 8, 0.1)'
                                  : acc.clientType === 'Enterprise'
                                    ? 'rgba(168, 85, 247, 0.1)'
                                    : 'rgba(59, 130, 246, 0.1)',
                              color:
                                acc.clientType === 'VIP'
                                  ? '#eab308'
                                  : acc.clientType === 'Enterprise'
                                    ? '#a855f7'
                                    : '#3b82f6',
                              borderColor:
                                acc.clientType === 'VIP'
                                  ? 'rgba(234, 179, 8, 0.2)'
                                  : acc.clientType === 'Enterprise'
                                    ? 'rgba(168, 85, 247, 0.2)'
                                    : 'rgba(59, 130, 246, 0.2)',
                            }}
                          >
                            {acc.clientType}
                          </span>
                        </td>
                        <td className="py-3 px-4 uppercase text-[9px] font-bold text-muted-foreground font-mono">
                          {acc.industry}
                        </td>
                        <td className="py-3 px-4 font-semibold text-foreground/80">
                          {acc.accountManager}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          <span
                            className={
                              acc.healthScore >= 90
                                ? 'text-emerald-500'
                                : acc.healthScore >= 75
                                  ? 'text-amber-500'
                                  : 'text-rose-500'
                            }
                          >
                            {acc.healthScore}%
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-primary">
                          ${acc.revenueContribution.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            onClick={() => handleDeleteClient(acc._id)}
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {filteredClients.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="py-12 text-center text-xs text-muted-foreground font-semibold"
                        >
                          Zero registered customer accounts match active search filters.
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

      {/* CLIENT PROFILE DETAILS SLIDING DRAWER */}
      <AnimatePresence>
        {drawerOpen && selectedClient && (
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
              {/* Header */}
              <div className="p-5 border-b border-border/40 flex items-center justify-between bg-muted/10 select-none">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-black tracking-wide text-primary uppercase">
                    Client Account Profile
                  </span>
                  <h3 className="text-base font-black text-foreground">{selectedClient.name}</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="h-8 w-8 rounded-full hover:bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Sub-tabs selectors */}
              <div className="flex border-b border-border/40 px-3 py-1.5 flex-wrap gap-1 bg-card/20 select-none">
                {[
                  'overview',
                  'contacts',
                  'contracts',
                  'communication',
                  'vault',
                  'notes',
                  'timeline',
                ].map((t) => (
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

              {/* Tabbed view window */}
              <div className="flex-grow overflow-y-auto p-5 space-y-6">
                {/* 1. OVERVIEW PROFILE TAB */}
                {drawerTab === 'overview' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-5"
                  >
                    {/* Primary metadata grid */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                          Classification
                        </span>
                        <div>
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase font-bold tracking-wide"
                          >
                            {selectedClient.clientType}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                          Total Revenue ARR
                        </span>
                        <p className="font-black font-mono text-primary text-sm">
                          ${selectedClient.revenueContribution.toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                          Account Owner
                        </span>
                        <p className="font-semibold text-foreground">
                          {selectedClient.accountManager}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                          Timezone
                        </span>
                        <p className="font-semibold text-foreground/80">
                          {selectedClient.timezone}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                          Industry Sector
                        </span>
                        <p className="font-semibold text-foreground/80 uppercase font-mono text-[10px]">
                          {selectedClient.industry}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                          Company Size
                        </span>
                        <p className="font-semibold text-foreground/80">
                          {selectedClient.companySize} employees
                        </p>
                      </div>
                    </div>

                    {/* Action toggles */}
                    <div className="space-y-3.5 border-t border-border/30 pt-4 text-xs">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                        Account Operations
                      </span>
                      <div className="flex gap-2 flex-wrap">
                        <select
                          value={selectedClient.onboardingStatus}
                          onChange={(e) =>
                            handleUpdateStatus(
                              selectedClient._id,
                              'onboardingStatus',
                              e.target.value
                            )
                          }
                          className="h-8 rounded-lg border border-border/80 bg-background/50 px-2 text-xs text-foreground focus:outline-none"
                        >
                          <option value="pending">Onboard: Pending</option>
                          <option value="in-progress">Onboard: In-Progress</option>
                          <option value="completed">Onboard: Completed</option>
                        </select>
                        <select
                          value={selectedClient.retentionStatus}
                          onChange={(e) =>
                            handleUpdateStatus(
                              selectedClient._id,
                              'retentionStatus',
                              e.target.value
                            )
                          }
                          className="h-8 rounded-lg border border-border/80 bg-background/50 px-2 text-xs text-foreground focus:outline-none"
                        >
                          <option value="retained">Retention: Retained</option>
                          <option value="churn-risk">Retention: Churn Risk</option>
                          <option value="churned">Retention: Churned</option>
                        </select>
                      </div>
                    </div>

                    {/* Health score chart */}
                    <div className="space-y-2 border-t border-border/30 pt-4">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                        Account Health Score
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              selectedClient.healthScore >= 90
                                ? 'bg-emerald-500'
                                : selectedClient.healthScore >= 75
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                            }`}
                            style={{ width: `${selectedClient.healthScore}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-foreground text-xs">
                          {selectedClient.healthScore}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 2. CONTACTS TAB */}
                {drawerTab === 'contacts' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-5 text-xs"
                  >
                    {/* New contact registration form */}
                    <form
                      onSubmit={handleAddContact}
                      className="p-4 border border-border/60 bg-muted/10 rounded-xl space-y-3"
                    >
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">
                        Register Contact Point
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase">
                            Contact Name
                          </label>
                          <Input
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            placeholder="John Doe"
                            className="h-8 text-xs bg-background/50"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase">
                            Role/Title
                          </label>
                          <Input
                            value={contactRole}
                            onChange={(e) => setContactRole(e.target.value)}
                            placeholder="CEO"
                            className="h-8 text-xs bg-background/50"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase">
                            Email Address
                          </label>
                          <Input
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            placeholder="john@doe.com"
                            className="h-8 text-xs bg-background/50"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase">
                            Phone
                          </label>
                          <Input
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            placeholder="555-0100"
                            className="h-8 text-xs bg-background/50"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 flex-wrap gap-2 select-none">
                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={contactPrimary}
                            onChange={(e) => setContactPrimary(e.target.checked)}
                          />
                          Set Primary POC
                        </label>

                        <Button type="submit" size="sm" className="h-8 text-xs font-bold">
                          Register Contact
                        </Button>
                      </div>
                    </form>

                    {/* Contacts lists */}
                    <div className="space-y-2 border-t border-border/30 pt-4">
                      {selectedClient.contacts?.map((c, idx) => (
                        <div
                          key={idx}
                          className="p-3 border border-border/40 bg-card/35 rounded-lg flex items-center justify-between text-left"
                        >
                          <div className="space-y-1">
                            <h5 className="font-bold text-foreground flex items-center gap-1.5">
                              {c.name}
                              {c.isPrimary && (
                                <Badge
                                  variant="default"
                                  className="text-[8px] tracking-wide uppercase px-1 py-0 font-extrabold h-4 bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                >
                                  Primary
                                </Badge>
                              )}
                            </h5>
                            <p className="text-[10px] text-muted-foreground">
                              {c.role} • {c.email || 'No email'}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[9px] uppercase font-bold tracking-wider"
                          >
                            Pref: {c.communicationPref}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 3. CONTRACTS TAB */}
                {drawerTab === 'contracts' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-5 text-xs"
                  >
                    {/* Add contract pricing plan form */}
                    <form
                      onSubmit={handleAddContract}
                      className="p-4 border border-border/60 bg-muted/10 rounded-xl space-y-3"
                    >
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">
                        Register Signed Contract
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase">
                            Agreement title
                          </label>
                          <Input
                            value={contractTitle}
                            onChange={(e) => setContractTitle(e.target.value)}
                            placeholder="Retainer Tier 1"
                            className="h-8 text-xs bg-background/50"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase">
                            Contract Value ($)
                          </label>
                          <Input
                            type="number"
                            value={contractValue}
                            onChange={(e) => setContractValue(parseInt(e.target.value) || 0)}
                            className="h-8 text-xs bg-background/50"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase">
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={contractStart}
                            onChange={(e) => setContractStart(e.target.value)}
                            className="w-full h-8 rounded-md border border-input bg-background/50 px-2 py-1 text-xs text-foreground focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase">
                            End Date
                          </label>
                          <input
                            type="date"
                            value={contractEnd}
                            onChange={(e) => setContractEnd(e.target.value)}
                            className="w-full h-8 rounded-md border border-input bg-background/50 px-2 py-1 text-xs text-foreground focus:outline-none"
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        size="sm"
                        className="h-8.5 w-full text-xs font-bold mt-1"
                      >
                        Register Signed Contract
                      </Button>
                    </form>

                    {/* Active list */}
                    <div className="space-y-2 border-t border-border/30 pt-4">
                      {selectedClient.contracts?.map((c, idx) => (
                        <div
                          key={idx}
                          className="p-3 border border-border/40 bg-card/35 rounded-lg flex items-center justify-between text-left"
                        >
                          <div className="space-y-1 min-w-0">
                            <h5 className="font-bold text-foreground truncate">{c.title}</h5>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              Range:{' '}
                              {c.startDate ? new Date(c.startDate).toLocaleDateString() : 'None'} -{' '}
                              {c.endDate ? new Date(c.endDate).toLocaleDateString() : 'None'}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-black font-mono text-primary text-sm">
                              ${c.value.toLocaleString()}
                            </p>
                            <Badge
                              variant="outline"
                              className="text-[9px] uppercase font-bold mt-1 tracking-wider"
                            >
                              {c.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 4. COMMUNICATIONS TAB */}
                {drawerTab === 'communication' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-5 text-xs"
                  >
                    {/* Log action traces */}
                    <form
                      onSubmit={handleLogCommunication}
                      className="p-4 border border-border/60 bg-muted/10 rounded-xl space-y-3"
                    >
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">
                        Log Customer Interaction
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1 col-span-1">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase">
                            Log channel
                          </label>
                          <select
                            value={commType}
                            onChange={(e) => setCommType(e.target.value as any)}
                            className="w-full h-8 rounded-md border border-input bg-background/50 px-2 py-1 text-xs text-foreground focus:outline-none"
                          >
                            <option value="email">Email</option>
                            <option value="call">Phone Call</option>
                            <option value="meeting">Meeting</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="space-y-1 col-span-2">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase">
                            Summary transcript
                          </label>
                          <Input
                            value={commSummary}
                            onChange={(e) => setCommSummary(e.target.value)}
                            placeholder="Discussed pricing options for year 2 retainer..."
                            className="h-8 text-xs bg-background/50"
                          />
                        </div>
                      </div>
                      <Button type="submit" size="sm" className="h-8 w-full text-xs font-bold">
                        Save Communication Trace
                      </Button>
                    </form>

                    {/* Trace ledger lists */}
                    <div className="space-y-2 border-t border-border/30 pt-4">
                      {selectedClient.communicationLogs
                        ?.slice()
                        .reverse()
                        .map((log, idx) => (
                          <div
                            key={idx}
                            className="p-3 border border-border/40 bg-card/35 rounded-lg flex items-start gap-2.5 text-left"
                          >
                            <span className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-0.5 text-xs">
                              {log.type === 'call' ? '📞' : log.type === 'meeting' ? '🤝' : '📧'}
                            </span>
                            <div className="space-y-1 min-w-0">
                              <h5 className="font-bold text-foreground truncate max-w-[240px]">
                                {log.summary}
                              </h5>
                              <p className="text-[9px] text-muted-foreground font-mono">
                                Logged by {log.loggedBy} •{' '}
                                {new Date(log.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </motion.div>
                )}

                {/* 5. SECURE UPLOADER VAULT TAB */}
                {drawerTab === 'vault' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-5 text-xs"
                  >
                    {/* drag and drop simulator */}
                    <form
                      onSubmit={handleSimulateUpload}
                      className="p-4 border border-border/60 bg-muted/10 rounded-xl space-y-3 text-left"
                    >
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">
                        Secure Document Vault
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase">
                            File display name
                          </label>
                          <Input
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            placeholder="signed_nda_stark"
                            className="h-8 text-xs bg-background/50"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase">
                            Category
                          </label>
                          <select
                            value={fileCat}
                            onChange={(e) => setFileCat(e.target.value as any)}
                            className="w-full h-8 rounded-md border border-input bg-background/50 px-2 py-1 text-xs text-foreground focus:outline-none"
                          >
                            <option value="NDA">NDA Agreement</option>
                            <option value="contract">Standard Contract</option>
                            <option value="proposal">Sales Proposal</option>
                            <option value="onboarding">Onboarding Checklist</option>
                            <option value="legal">Legal Counsel</option>
                          </select>
                        </div>
                      </div>

                      {uploadPercentage >= 0 ? (
                        <div className="space-y-1 pt-2 select-none">
                          <div className="flex justify-between text-[8px] font-bold uppercase tracking-wider text-primary">
                            <span>Uploading NDA PDF Vault...</span>
                            <span>{uploadPercentage}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-150"
                              style={{ width: `${uploadPercentage}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <Button
                          type="submit"
                          size="sm"
                          className="h-8.5 w-full text-xs font-bold mt-1"
                        >
                          <Paperclip className="h-3.5 w-3.5" />
                          Simulate Secure PDF Attachment
                        </Button>
                      )}
                    </form>

                    {/* Files vault directories */}
                    <div className="space-y-2 border-t border-border/30 pt-4">
                      {selectedClient.documents?.map((file, idx) => (
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
                                Size: {Math.round(file.size / 1024)} KB • Category: {file.category}
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

                {/* 6. MENTIONS & NOTES TAB */}
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
                        placeholder="Log threaded account notes, onboarding minutes, or churn risk notes..."
                        className="w-full h-20 p-2.5 rounded-lg border border-border bg-background/50 focus:outline-none focus:ring-2 focus:ring-ring text-xs leading-relaxed"
                      />
                      <div className="flex items-center justify-between flex-wrap gap-2 select-none">
                        <div className="flex gap-3">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notePinned}
                              onChange={(e) => setNotePinned(e.target.checked)}
                            />
                            <Pin className="h-3.5 w-3.5 text-muted-foreground" />
                            Pin Note
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer text-rose-500/80">
                            <input
                              type="checkbox"
                              checked={notePrivate}
                              onChange={(e) => setNotePrivate(e.target.checked)}
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

                    {/* Notes lists */}
                    <div className="space-y-3 border-t border-border/30 pt-4">
                      {selectedClient.notes
                        ?.slice()
                        .reverse()
                        .map((note, idx) => (
                          <div
                            key={idx}
                            className="p-3 border border-border/40 bg-card/30 rounded-xl space-y-2 relative text-left"
                          >
                            {note.isPinned && (
                              <span className="absolute top-3 right-3 text-[10px] font-bold text-primary flex items-center gap-0.5 select-none">
                                <Pin className="h-3 w-3 rotate-45" />
                                Pinned
                              </span>
                            )}
                            <div className="flex items-center gap-1.5 select-none">
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
                    </div>
                  </motion.div>
                )}

                {/* 7. TIMELINE AUDIT TAB */}
                {drawerTab === 'timeline' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className="relative border-l border-border/80 ml-3.5 space-y-6 text-left pl-4">
                      {selectedClient.timeline
                        ?.slice()
                        .reverse()
                        .map((evt, idx) => (
                          <div key={idx} className="relative space-y-1 text-xs">
                            <span className="absolute -left-[25px] top-0.5 rounded-full border border-border bg-background p-1 flex items-center justify-center shadow-sm text-primary">
                              <History className="h-3 w-3" />
                            </span>
                            <div className="flex items-center gap-2 justify-between flex-wrap select-none">
                              <h4 className="font-bold text-foreground">{evt.title}</h4>
                              <span className="text-[9px] font-mono text-muted-foreground/80">
                                {new Date(evt.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                              {evt.description}
                            </p>
                            <span className="text-[9px] tracking-wide text-foreground/75 font-semibold select-none">
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

      {/* ACCOUNT INGESTION DIALOG MODAL */}
      <AnimatePresence>
        {createModalOpen && (
          <>
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
                  <Building className="h-4.5 w-4.5 text-primary" />
                  Onboard Customer Account
                </h4>
                <p className="text-[10px] text-muted-foreground">
                  Log signed contract ARR sums, categories, timezones, and owners.
                </p>
              </div>

              <form onSubmit={handleCreateClient} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">
                      Client Company *
                    </label>
                    <Input
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Stark Industries"
                      className="h-8.5 bg-background/50 focus-visible:ring-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">
                      Industry Sector
                    </label>
                    <Input
                      value={formIndustry}
                      onChange={(e) => setFormIndustry(e.target.value)}
                      placeholder="Energy / High Tech"
                      className="h-8.5 bg-background/50 focus-visible:ring-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">
                      Classification
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as any)}
                      className="w-full h-8.5 rounded-md border border-input bg-background/50 px-2 py-1 text-xs text-foreground focus:outline-none"
                    >
                      <option value="Startup">Startup Account</option>
                      <option value="VIP">VIP Account</option>
                      <option value="Enterprise">Enterprise Account</option>
                      <option value="Retainer">Retainer Contract</option>
                      <option value="High Value">High Value Account</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">
                      Starting Contract ARR ($)
                    </label>
                    <Input
                      type="number"
                      value={formRevenue}
                      onChange={(e) => setFormRevenue(parseInt(e.target.value) || 0)}
                      className="h-8.5 bg-background/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 select-none">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">
                      Company Size
                    </label>
                    <select
                      value={formSize}
                      onChange={(e) => setFormSize(e.target.value as any)}
                      className="w-full h-8.5 rounded-md border border-input bg-background/50 px-2 py-1 text-xs text-foreground focus:outline-none"
                    >
                      <option value="1-10">1-10 Employees</option>
                      <option value="11-50">11-50 Employees</option>
                      <option value="51-200">51-200 Employees</option>
                      <option value="201+">201+ Employees</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">
                      Account Owner
                    </label>
                    <select
                      value={formManager}
                      onChange={(e) => setFormManager(e.target.value)}
                      className="w-full h-8.5 rounded-md border border-input bg-background/50 px-2 py-1 text-xs text-foreground focus:outline-none"
                    >
                      <option value="">Choose Manager...</option>
                      <option value="Pepper Potts">Pepper Potts</option>
                      <option value="Lucius Fox">Lucius Fox</option>
                      <option value="Samantha Vance">Samantha Vance</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">
                      Timezone
                    </label>
                    <Input
                      value={formTimezone}
                      onChange={(e) => setFormTimezone(e.target.value)}
                      placeholder="EST / PST"
                      className="h-8.5 bg-background/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">
                      Email
                    </label>
                    <Input
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="point@company.com"
                      className="h-8.5 bg-background/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">
                      Website Slug
                    </label>
                    <Input
                      value={formWebsite}
                      onChange={(e) => setFormWebsite(e.target.value)}
                      placeholder="company.com"
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
                    Ingest Account
                  </Button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
