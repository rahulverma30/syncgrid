import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Badge, CenteredModal } from '@/components/ui';
import { useLockBodyScroll } from '@/hooks';
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
  Edit,
  Activity,
  Layers,
  ArrowRight,
  CornerDownRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useClientsStore, ClientAccount } from '@/store/clientsStore';
import { toast } from 'sonner';

const AVAILABLE_MANAGERS = [
  'Pepper Potts',
  'Tony Stark',
  'Samantha Vance',
  'Lucius Fox',
  'Bruce Wayne',
  'Peter Parker',
  'Happy Hogan',
];

export const ClientDetailDrawer: React.FC = () => {
  const { selectedClient, setSelectedClient, activeTab, setActiveTab, fetchClients } =
    useClientsStore();

  useLockBodyScroll(!!selectedClient);

  const drawerRef = useRef<HTMLDivElement>(null);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);

  // States
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

  // Duplicate Check State
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [activeDuplicateToMerge, setActiveDuplicateToMerge] = useState<any | null>(null);

  // Note Edit History State
  const [isEditNoteOpen, setIsEditNoteOpen] = useState(false);
  const [activeNoteToEdit, setActiveNoteToEdit] = useState<any | null>(null);
  const [noteEditContent, setNoteEditContent] = useState('');
  const [isNoteHistoryOpen, setIsNoteHistoryOpen] = useState(false);
  const [activeNoteForHistory, setActiveNoteForHistory] = useState<any | null>(null);

  // Note Mentions State
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState(0);

  // Merge Conflict Overrides state
  const [mergeOverrides, setMergeOverrides] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!selectedClient?._id) return;
    let active = true;

    const fetchDuplicates = async () => {
      try {
        const res = await fetch(`/api/protected/clients/${selectedClient._id}/duplicates`);
        const d = await res.json();
        if (d.success && active) {
          setDuplicates(d.data || []);
        }
      } catch {
        // safe fallback
      }
    };
    fetchDuplicates();

    return () => {
      active = false;
    };
  }, [selectedClient?._id]);

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
    setTimeout(() => {
      if (drawerRef.current) {
        const firstFocus = drawerRef.current.querySelector('button') as HTMLElement;
        firstFocus?.focus();
      }
    }, 150);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClient, setSelectedClient]);

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
        toast.error(d.message || 'Failed to append contact.');
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
        toast.error(d.message || 'Failed to append note.');
      }
    } catch (e) {
      toast.error('API connection error.');
    }
  };

  const handleUpdateNote = async () => {
    if (!noteEditContent.trim() || !activeNoteToEdit) return;

    try {
      const res = await fetch(`/api/protected/clients/${selectedClient._id}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: activeNoteToEdit._id,
          content: noteEditContent,
        }),
      });

      const d = await res.json();
      if (d.success) {
        setSelectedClient(d.data);
        fetchClients();
        setIsEditNoteOpen(false);
        setActiveNoteToEdit(null);
        setNoteEditContent('');
        toast.success('Note content updated and version history logged.');
      } else {
        toast.error('Failed to update note.');
      }
    } catch {
      toast.error('Sync failure during note edit.');
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
        toast.error(d.message || 'Failed to log contract.');
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

    const interval = setInterval(() => {
      setUploadPercentage((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(async () => {
            try {
              const res = await fetch(`/api/protected/clients/${selectedClient._id}/documents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: fileName,
                  category: fileCat,
                  url: `https://syncgrid-vault.s3.amazonaws.com/clients/${selectedClient._id}/${fileName}.pdf`,
                  size: 2048576,
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

  // Transaction Merge execution
  const executeClientMerge = async () => {
    if (!activeDuplicateToMerge) return;

    try {
      const res = await fetch(`/api/protected/clients/${selectedClient._id}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: activeDuplicateToMerge.clientId,
          overrideFields: mergeOverrides,
        }),
      });

      const d = await res.json();
      if (d.success) {
        toast.success(`Merge workflow finalized! absorbed "${activeDuplicateToMerge.name}".`);
        setSelectedClient(d.data);
        fetchClients();
        setIsMergeModalOpen(false);
        setActiveDuplicateToMerge(null);
        setMergeOverrides({});
      } else {
        toast.error(d.message || 'Merge action failed.');
      }
    } catch {
      toast.error('Database transaction merge failed.');
    }
  };

  // Note Mentions Helpers
  const handleNoteChange = (val: string, cursor: number) => {
    setNoteInput(val);
    setCursorPos(cursor);

    const textBeforeCursor = val.slice(0, cursor);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (
      atIndex !== -1 &&
      (atIndex === 0 ||
        textBeforeCursor[atIndex - 1] === ' ' ||
        textBeforeCursor[atIndex - 1] === '\n')
    ) {
      const query = textBeforeCursor.slice(atIndex + 1);
      if (!query.includes(' ')) {
        setShowMentions(true);
        setMentionQuery(query);
        setMentionIndex(0);
        return;
      }
    }
    setShowMentions(false);
  };

  const handleNoteKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentions) return;

    const filtered = AVAILABLE_MANAGERS.filter((m) =>
      m.toLowerCase().includes(mentionQuery.toLowerCase())
    );

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMentionIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMentionIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[mentionIndex]) {
        insertMention(filtered[mentionIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowMentions(false);
    }
  };

  const insertMention = (name: string) => {
    const textBeforeCursor = noteInput.slice(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    if (atIndex === -1) return;

    const prefix = noteInput.slice(0, atIndex);
    const suffix = noteInput.slice(cursorPos);
    const inserted = `${prefix}@${name} ${suffix}`;

    setNoteInput(inserted);
    setShowMentions(false);
    setTimeout(() => {
      noteInputRef.current?.focus();
    }, 50);
  };

  // Mentions markup highlighting
  const renderNoteContent = (content: string) => {
    const words = content.split(/(\s+)/);
    return words.map((word, idx) => {
      if (word.startsWith('@') && word.length > 1) {
        const cleaned = word.replace(/[^a-zA-Z\s@]/g, '');
        return (
          <span
            key={idx}
            className="text-primary font-black bg-primary/10 px-1 py-0.5 rounded text-[11px] border border-primary/20 leading-none select-none inline-block align-baseline"
          >
            {cleaned}
          </span>
        );
      }
      return word;
    });
  };

  return (
    <>
      {/* Backdrop Closer */}
      <div
        className="fixed inset-0 z-40 bg-background/50 backdrop-blur-xs transition-opacity duration-300"
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
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        className="fixed top-0 right-0 h-full w-full max-w-lg z-50 border-l border-border bg-popover/95 backdrop-blur-md shadow-2xl flex flex-col overflow-hidden text-left"
      >
        {/* Header */}
        <div className="p-5 border-b border-border/40 flex items-center justify-between bg-muted/10 select-none">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-black tracking-wide text-primary uppercase flex items-center gap-1.5">
              <Activity className="h-3 w-3" /> Client Account Profile
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

        {/* Dynamic Duplicates Alert banner */}
        {duplicates.length > 0 && (
          <div className="mx-5 mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 flex items-center justify-between select-none animate-pulse">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>
                <strong>{duplicates.length} duplicate profile(s)</strong> detected matching website
                domain or telephone!
              </span>
            </div>
            <button
              onClick={() => {
                setActiveDuplicateToMerge(duplicates[0]);
                setIsMergeModalOpen(true);
              }}
              className="px-2.5 py-1 bg-amber-500 text-black hover:bg-amber-400 font-extrabold text-[10px] uppercase rounded-md tracking-wider transition-colors cursor-pointer"
            >
              Merge workflows
            </button>
          </div>
        )}

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
              <div className="space-y-2 relative">
                <textarea
                  ref={noteInputRef}
                  value={noteInput}
                  onChange={(e) => handleNoteChange(e.target.value, e.target.selectionStart)}
                  onKeyDown={handleNoteKeyDown}
                  placeholder="Log threaded account notes... use @ to mention managers"
                  className="w-full h-20 p-2.5 rounded-lg border border-border bg-background/50 focus:outline-none focus:ring-2 focus:ring-ring text-xs leading-relaxed"
                />

                {/* Mentions dropdown list */}
                {showMentions && (
                  <div className="absolute left-2 bottom-12 w-48 border border-border bg-popover rounded-md shadow-lg z-50 overflow-hidden flex flex-col text-left">
                    <div className="px-2.5 py-1.5 text-[8.5px] font-mono text-muted-foreground border-b border-border bg-muted/20 select-none">
                      Mention Manager
                    </div>
                    {AVAILABLE_MANAGERS.filter((m) =>
                      m.toLowerCase().includes(mentionQuery.toLowerCase())
                    ).map((m, idx) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => insertMention(m)}
                        className={`w-full px-3 py-1.5 text-xs text-left cursor-pointer transition-colors ${
                          idx === mentionIndex
                            ? 'bg-primary/15 text-primary font-bold'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}

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
                      <EyeOff className="h-3.5 w-3.5" /> Private
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

                        <div className="flex-grow" />

                        {/* Edit History Version CTA Actions */}
                        <div className="flex gap-2.5">
                          {note.editHistory && note.editHistory.length > 0 && (
                            <button
                              onClick={() => {
                                setActiveNoteForHistory(note);
                                setIsNoteHistoryOpen(true);
                              }}
                              className="text-primary hover:underline font-bold text-[9px] uppercase tracking-wider cursor-pointer"
                            >
                              ({note.editHistory.length} edits)
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setActiveNoteToEdit(note);
                              setNoteEditContent(note.content);
                              setIsEditNoteOpen(true);
                            }}
                            className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                            aria-label="Edit Note"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <p className="text-muted-foreground leading-relaxed pl-1 whitespace-pre-line text-xs">
                        {renderNoteContent(note.content)}
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

      {/* RENDER INLINE DIALOGS (Merge Modal, Edit Note Modal, Note History Modal) */}

      {/* A. MERGE PREVIEW & CONFLICT RESOLUTION MODAL */}
      <CenteredModal
        isOpen={isMergeModalOpen && !!activeDuplicateToMerge}
        onClose={() => setIsMergeModalOpen(false)}
        title="Account Merge Conflict Resolution"
        className="max-w-xl"
        footer={
          <div className="flex items-center justify-between w-full select-none">
            <Button
              variant="outline"
              onClick={() => setIsMergeModalOpen(false)}
              className="h-9 text-xs font-bold"
            >
              Cancel
            </Button>
            <button
              onClick={executeClientMerge}
              className="h-9 px-4 rounded-md bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              Confirm Deep Merge & Purge Duplicate <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        }
      >
        {/* Side-by-Side Conflicts Workspace */}
        <div className="space-y-4 text-xs select-none">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
              <span className="text-[8px] uppercase tracking-wider font-extrabold text-primary">
                Primary Client Account (Retained)
              </span>
              <h4 className="font-black text-foreground text-sm">{selectedClient?.name}</h4>
              <p className="text-muted-foreground text-[10px]">
                Manager: {selectedClient?.accountManager}
              </p>
              <p className="text-muted-foreground text-[10px]">
                ARR Yield: ${selectedClient?.revenueContribution?.toLocaleString()}
              </p>
              <p className="text-muted-foreground text-[10px]">
                Website: {selectedClient?.website || 'No website'}
              </p>
            </div>

            {activeDuplicateToMerge && (
              <div className="p-3.5 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-2">
                <span className="text-[8px] uppercase tracking-wider font-extrabold text-amber-500">
                  Duplicate Client Account (Absorbed)
                </span>
                <h4 className="font-black text-foreground text-sm">
                  {activeDuplicateToMerge.name}
                </h4>
                <p className="text-muted-foreground text-[10px]">
                  Fuzzy Match Reason: {activeDuplicateToMerge.matchReasons?.[0]}
                </p>
                <p className="text-muted-foreground text-[10px]">
                  Confidence: {activeDuplicateToMerge.confidence}%
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-3 border-t border-border/30">
            <span className="text-[10px] font-bold text-foreground block">
              Choose Fields Overrides:
            </span>

            {/* Overrides Selection Controls */}
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 rounded border border-border/60 bg-muted/5">
                <span>Account Manager</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const current = { ...mergeOverrides };
                      delete current.accountManager;
                      setMergeOverrides(current);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                      mergeOverrides.accountManager === undefined
                        ? 'bg-primary text-black'
                        : 'bg-muted'
                    }`}
                  >
                    Primary
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setMergeOverrides({
                        ...mergeOverrides,
                        accountManager: activeDuplicateToMerge?.accountManager || 'Pepper Potts',
                      })
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                      mergeOverrides.accountManager !== undefined
                        ? 'bg-primary text-black'
                        : 'bg-muted'
                    }`}
                  >
                    Target
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center p-2 rounded border border-border/60 bg-muted/5">
                <span>Website Domain</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const current = { ...mergeOverrides };
                      delete current.website;
                      setMergeOverrides(current);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                      mergeOverrides.website === undefined ? 'bg-primary text-black' : 'bg-muted'
                    }`}
                  >
                    Primary
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setMergeOverrides({
                        ...mergeOverrides,
                        website: activeDuplicateToMerge?.website || '',
                      })
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                      mergeOverrides.website !== undefined ? 'bg-primary text-black' : 'bg-muted'
                    }`}
                  >
                    Target
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CenteredModal>

      {/* B. NOTE EDIT DIALOG MODAL */}
      <CenteredModal
        isOpen={isEditNoteOpen && !!activeNoteToEdit}
        onClose={() => {
          setIsEditNoteOpen(false);
          setActiveNoteToEdit(null);
        }}
        title="Edit Relationship Note"
        className="max-w-md"
        footer={
          <div className="flex justify-between w-full select-none">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditNoteOpen(false);
                setActiveNoteToEdit(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateNote} size="sm" className="font-bold">
              Save Changes (Record History)
            </Button>
          </div>
        }
      >
        <textarea
          value={noteEditContent}
          onChange={(e) => setNoteEditContent(e.target.value)}
          className="w-full h-24 p-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring text-xs leading-relaxed"
        />
      </CenteredModal>

      {/* C. NOTE VERSION TIMELINE MODAL */}
      <CenteredModal
        isOpen={isNoteHistoryOpen && !!activeNoteForHistory}
        onClose={() => {
          setIsNoteHistoryOpen(false);
          setActiveNoteForHistory(null);
        }}
        title="Note Version Audit History"
        className="max-w-md"
        footer={
          <Button
            size="sm"
            onClick={() => {
              setIsNoteHistoryOpen(false);
              setActiveNoteForHistory(null);
            }}
          >
            Close Audit Logs
          </Button>
        }
      >
        {/* Version History List */}
        <div className="overflow-y-auto space-y-4 py-2">
          <div className="relative border-l border-border/80 ml-2.5 space-y-5 text-left pl-4">
            {activeNoteForHistory?.editHistory?.map((hist: any, index: number) => (
              <div key={index} className="relative space-y-1 text-xs">
                <span className="absolute -left-[21px] top-0.5 rounded-full bg-muted p-0.5 flex items-center justify-center text-muted-foreground border border-border">
                  <CornerDownRight className="h-2.5 w-2.5" />
                </span>
                <div className="flex justify-between items-center select-none text-[10px] text-muted-foreground font-semibold">
                  <span>Edited by {hist.editedBy}</span>
                  <span>{new Date(hist.editedAt).toLocaleDateString()}</span>
                </div>
                <p className="p-2 border border-border/40 bg-card/20 rounded text-foreground text-[11px] leading-relaxed">
                  {hist.content}
                </p>
              </div>
            ))}

            {/* Current Active Version Indicator */}
            {activeNoteForHistory && (
              <div className="relative space-y-1 text-xs">
                <span className="absolute -left-[21px] top-0.5 rounded-full bg-emerald-500/10 p-0.5 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  ★
                </span>
                <div className="flex justify-between items-center select-none text-[10px] text-emerald-500 font-extrabold uppercase tracking-wide">
                  <span>Current Active Note Version</span>
                  <span>{new Date(activeNoteForHistory.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="p-2 border border-emerald-500/20 bg-emerald-500/5 rounded text-foreground text-[11px] leading-relaxed">
                  {activeNoteForHistory.content}
                </p>
              </div>
            )}
          </div>
        </div>
      </CenteredModal>
    </>
  );
};
