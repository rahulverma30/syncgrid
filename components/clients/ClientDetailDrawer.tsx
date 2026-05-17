import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Badge } from '@/components/ui';
import {
  Users,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  Paperclip,
  CheckSquare,
  History,
  Send,
  Link,
  ChevronRight,
  TrendingUp,
  FileText,
  AlertCircle,
  Pin,
  EyeOff,
  User,
  Heart,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useClientsStore, ClientAccount } from '@/store/clientsStore';
import { toast } from 'sonner';

export const ClientDetailDrawer: React.FC = () => {
  const { selectedClient, setSelectedClient, activeTab, setActiveTab, fetchClients } =
    useClientsStore();

  const drawerRef = useRef<HTMLDivElement>(null);

  // Focus trap implementation for sliding drawer accessibility
  useEffect(() => {
    if (!selectedClient) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedClient(null);
      }
      if (e.key === 'Tab' && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll(
          'a[href], button, textarea, input, select, [tabindex="0"]'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Focus first element on drawer open
    setTimeout(() => {
      if (drawerRef.current) {
        const firstFocus = drawerRef.current.querySelector('button') as HTMLElement;
        firstFocus?.focus();
      }
    }, 150);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClient, setSelectedClient]);

  // Form Field States
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactPrimary, setContactPrimary] = useState(false);
  const [contactPref, setContactPref] = useState<'email' | 'phone' | 'slack' | 'zoom'>('email');

  const [noteInput, setNoteInput] = useState('');
  const [notePinned, setNotePinned] = useState(false);
  const [notePrivate, setNotePrivate] = useState(false);

  const [contractTitle, setContractTitle] = useState('');
  const [contractValue, setContractValue] = useState(5000);
  const [contractStart, setContractStart] = useState('');
  const [contractEnd, setContractEnd] = useState('');

  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingAttendees, setMeetingAttendees] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');

  const [commType, setCommType] = useState<'call' | 'email' | 'meeting' | 'other'>('email');
  const [commSummary, setCommSummary] = useState('');

  const [fileName, setFileName] = useState('');
  const [fileCat, setFileCat] = useState<
    'contract' | 'proposal' | 'NDA' | 'invoice' | 'onboarding' | 'legal'
  >('proposal');
  const [uploadPercentage, setUploadPercentage] = useState(-1);

  if (!selectedClient) return null;

  // Actions handlers
  const handleUpdateStatus = async (field: string, value: any) => {
    try {
      const res = await fetch(`/api/protected/clients/${selectedClient._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      const d = await res.json();
      if (d.success) {
        setSelectedClient(d.data);
        toast.success(`Client ${field} updated successfully!`);
        fetchClients();
      } else {
        toast.error('Failed to synchronize status.');
      }
    } catch (e) {
      toast.error('Network sync error.');
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName) return;

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
        fetchClients();
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
    if (!noteInput.trim()) return;

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
        fetchClients();
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
    if (!contractTitle) return;

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
        fetchClients();
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
    if (!meetingTitle || !meetingDate) return;

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
        fetchClients();
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
    if (!commSummary.trim()) return;

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
        fetchClients();
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
    if (!fileName.trim()) return;

    setUploadPercentage(0);

    // Dynamic mock upload interval
    const interval = setInterval(() => {
      setUploadPercentage((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          // Trigger actual API save call when progress finishes
          setTimeout(async () => {
            try {
              const res = await fetch(`/api/protected/clients/${selectedClient._id}/documents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: fileName,
                  category: fileCat,
                  url: `https://syncgrid-vault.s3.amazonaws.com/clients/${selectedClient._id}/${fileName}.pdf`,
                  size: 2048576, // mock 2MB size
                }),
              });
              const d = await res.json();
              if (d.success) {
                setSelectedClient(d.data);
                fetchClients();
                setFileName('');
                toast.success('Secure PDF document appended to ledger!');
              } else {
                toast.error(d.message || 'File validation mismatch.');
              }
            } catch (err) {
              toast.error('Upload sync error.');
            } finally {
              setUploadPercentage(-1);
            }
          }, 300);
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  return (
    <>
      {/* Backdrop Closer */}
      <div
        className="fixed inset-0 z-40 bg-background/40 backdrop-blur-xs"
        onClick={() => setSelectedClient(null)}
      />

      <motion.div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Client Details Panel"
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
              onClick={() => setSelectedClient(null)}
              className="h-8 w-8 rounded-full hover:bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors font-bold text-lg cursor-pointer"
              aria-label="Close details"
            >
              ×
            </button>
          </div>
        </div>

        {/* Sub-tabs selectors */}
        <div className="flex border-b border-border/40 px-3 py-1.5 flex-wrap gap-1 bg-card/20 select-none">
          {['overview', 'contacts', 'contracts', 'communication', 'vault', 'notes', 'timeline'].map(
            (t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === t
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/20 hover:text-foreground'
                }`}
              >
                {t}
              </button>
            )
          )}
        </div>

        {/* Tabbed view window */}
        <div className="flex-grow overflow-y-auto p-5 space-y-6">
          {/* 1. OVERVIEW PROFILE TAB */}
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
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
                  <p className="font-semibold text-foreground">{selectedClient.accountManager}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    Timezone
                  </span>
                  <p className="font-semibold text-foreground/80">{selectedClient.timezone}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    Industry Sector
                  </span>
                  <p className="font-semibold text-foreground/80 uppercase font-mono tracking-wider">
                    {selectedClient.industry}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    Website Slug
                  </span>
                  <a
                    href={`https://${selectedClient.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    {selectedClient.website || 'Add site'}
                  </a>
                </div>
              </div>

              {/* Checklists */}
              <div className="space-y-3 border-t border-border/30 pt-4 text-xs">
                <div className="flex justify-between items-center select-none">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    Onboarding Checklist
                  </span>
                  <select
                    value={selectedClient.onboardingStatus}
                    onChange={(e) => handleUpdateStatus('onboardingStatus', e.target.value)}
                    className="h-7 rounded border border-border bg-background px-1.5 text-[10px] font-bold text-foreground focus:outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In-progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-border/40 bg-card/25 hover:bg-card/45 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedClient.onboardingStatus === 'completed'}
                      onChange={(e) =>
                        handleUpdateStatus(
                          'onboardingStatus',
                          e.target.checked ? 'completed' : 'in-progress'
                        )
                      }
                      className="rounded border-border focus:ring-ring"
                    />
                    <div className="space-y-0.5 text-left">
                      <span className="font-bold text-foreground block">
                        Verify Onboarding Checklist status
                      </span>
                      <span className="text-[9.5px] text-muted-foreground">
                        Customer account transitions to stable retainer after checkpoint completion.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Retention risk score triggers */}
              <div className="space-y-3 border-t border-border/30 pt-4 text-xs">
                <div className="flex justify-between items-center select-none">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    Retention Health
                  </span>
                  <select
                    value={selectedClient.retentionStatus}
                    onChange={(e) => handleUpdateStatus('retentionStatus', e.target.value)}
                    className="h-7 rounded border border-border bg-background px-1.5 text-[10px] font-bold text-foreground focus:outline-none"
                  >
                    <option value="retained">Retained</option>
                    <option value="churn-risk">Churn Risk</option>
                    <option value="churned">Churned</option>
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
          {activeTab === 'contacts' && (
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
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">
                      Contact Name
                    </label>
                    <Input
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="John Doe"
                      className="h-8 text-xs bg-background/50"
                      required
                    />
                  </div>
                  <div className="space-y-1 text-left">
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
                  <div className="space-y-1 text-left">
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
                  <div className="space-y-1 text-left">
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
                      className="rounded border-border focus:ring-ring"
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
                    className="p-3 border border-border/40 bg-card/35 rounded-lg flex items-center justify-between text-left animate-fade-in"
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
          {activeTab === 'contracts' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-5 text-xs"
            >
              {/* Add pricing contract */}
              <form
                onSubmit={handleAddContract}
                className="p-4 border border-border/60 bg-muted/10 rounded-xl space-y-3"
              >
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">
                  Log Corporate Contract
                </h4>
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">
                      Contract Label Title
                    </label>
                    <Input
                      value={contractTitle}
                      onChange={(e) => setContractTitle(e.target.value)}
                      placeholder="Year 2 Development SLA"
                      className="h-8 text-xs bg-background/50"
                      required
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">
                      Valuation ($)
                    </label>
                    <Input
                      type="number"
                      value={contractValue}
                      onChange={(e) => setContractValue(parseInt(e.target.value) || 0)}
                      className="h-8 text-xs bg-background/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">
                      Start date
                    </label>
                    <Input
                      type="date"
                      value={contractStart}
                      onChange={(e) => setContractStart(e.target.value)}
                      className="h-8 text-xs bg-background/50"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">
                      End date
                    </label>
                    <Input
                      type="date"
                      value={contractEnd}
                      onChange={(e) => setContractEnd(e.target.value)}
                      className="h-8 text-xs bg-background/50"
                    />
                  </div>
                </div>

                <Button type="submit" size="sm" className="h-8 w-full text-xs font-bold">
                  Instantiate Contract Agreement
                </Button>
              </form>

              {/* Active contracts lists */}
              <div className="space-y-2 border-t border-border/30 pt-4 text-left">
                {selectedClient.contracts?.map((con, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 border border-border/40 bg-card/35 rounded-xl flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <h5 className="font-bold text-foreground">{con.title}</h5>
                      <p className="text-[10px] text-muted-foreground">
                        Status:{' '}
                        <span className="font-bold text-foreground/80 uppercase">{con.status}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="block font-black font-mono text-primary text-sm">
                        ${con.value.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 4. COMMUNICATIONS TAB */}
          {activeTab === 'communication' && (
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
                  <div className="space-y-1 col-span-1 text-left">
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
                  <div className="space-y-1 col-span-2 text-left">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">
                      Summary transcript
                    </label>
                    <Input
                      value={commSummary}
                      onChange={(e) => setCommSummary(e.target.value)}
                      placeholder="Discussed pricing options for year 2 retainer..."
                      className="h-8 text-xs bg-background/50"
                      required
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
                          Logged by {log.loggedBy} • {new Date(log.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}

          {/* 5. SECURE UPLOADER VAULT TAB */}
          {activeTab === 'vault' && (
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
                      required
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
                      <span>Uploading PDF Vault...</span>
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
                  <Button type="submit" size="sm" className="h-8.5 w-full text-xs font-bold mt-1">
                    <Paperclip className="h-3.5 w-3.5" /> Simulate Secure PDF Attachment
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
                      aria-label={`Download File ${file.name}`}
                    >
                      <Link className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 6. MENTIONS & NOTES TAB */}
          {activeTab === 'notes' && (
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
                        className="rounded border-border focus:ring-ring"
                      />
                      <Pin className="h-3.5 w-3.5 text-muted-foreground" /> Pin Note
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer text-rose-500/80">
                      <input
                        type="checkbox"
                        checked={notePrivate}
                        onChange={(e) => setNotePrivate(e.target.checked)}
                        className="rounded border-border focus:ring-ring"
                      />
                      <EyeOff className="h-3.5 w-3.5" /> Private (Internal)
                    </label>
                  </div>
                  <Button onClick={handleAddNote} size="sm" className="h-8 text-xs gap-1">
                    <Send className="h-3 w-3" /> Log Note
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
                          <Pin className="h-3 w-3 rotate-45" /> Pinned
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 select-none">
                        <span className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-[8px]">
                          {note.createdByName ? note.createdByName[0] : 'U'}
                        </span>
                        <span className="font-bold text-foreground">{note.createdByName}</span>
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
          {activeTab === 'timeline' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
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
                      <p className="text-muted-foreground leading-relaxed">{evt.description}</p>
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
  );
};
