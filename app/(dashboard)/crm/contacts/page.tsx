'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PageHeader,
  Card,
  CardContent,
  Button,
  Input,
  LoadingSpinner,
  ConfirmationModal,
  EmptyState,
  Select,
} from '@/components/ui';
import {
  Users,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Building2,
  Tag,
  Clock,
  Trash2,
  Eye,
  Edit2,
  UserCheck,
  CheckCircle,
  ExternalLink,
  Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Contact {
  _id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  communicationPref: string;
  companyName: string;
  companyId: string;
  createdAt: string;
  source: 'client' | 'crm';
}

export default function CRMContactsPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Delete confirm modal states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [contactToDeleteId, setContactToDeleteId] = useState<string | null>(null);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  const [primaryFilter, setPrimaryFilter] = useState('');

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const [clientsRes, crmRes] = await Promise.all([
        fetch('/api/protected/clients'),
        fetch('/api/protected/crm/contacts'),
      ]);
      const [clientsData, crmData] = await Promise.all([clientsRes.json(), crmRes.json()]);

      const flatContacts: Contact[] = [];

      if (clientsData.success) {
        clientsData.data.forEach((client: any) => {
          if (client.contacts && client.contacts.length > 0) {
            client.contacts.forEach((c: any) => {
              flatContacts.push({
                _id: c._id,
                name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim(),
                role: c.role || 'Executive',
                email: c.email || '',
                phone: c.phone || '',
                isPrimary: !!c.isPrimary,
                communicationPref: c.communicationPref || 'email',
                companyName: client.name,
                companyId: client._id,
                createdAt: c.createdAt || client.createdAt,
                source: 'client',
              });
            });
          }
        });
      }

      if (crmData.success) {
        crmData.data.forEach((c: any) => {
          flatContacts.push({
            _id: c._id,
            name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim(),
            role: c.role || c.title || 'Executive',
            email: c.email || '',
            phone: c.phone || '',
            isPrimary: !!c.isPrimary,
            communicationPref: c.communicationPref || 'email',
            companyName: c.accountId?.name || 'Unknown Account',
            companyId: c.accountId?._id || c.companyId,
            createdAt: c.createdAt,
            source: 'crm',
          });
        });
      }

      setContacts(flatContacts);
    } catch (err) {
      toast.error('Could not fetch contacts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    fetchContacts();
  }, []);

  const handleRowSelect = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === filteredContacts.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredContacts.map((c) => c._id));
    }
  };

  const handleDeleteContact = (id: string) => {
    setContactToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleBulkDelete = () => {
    setIsBulkDeleteConfirmOpen(true);
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Role', 'Email', 'Phone', 'Primary', 'Company', 'Preference'];
    const rows = filteredContacts.map((c) => [
      c.name,
      c.role,
      c.email,
      c.phone,
      c.isPrimary ? 'Yes' : 'No',
      c.companyName,
      c.communicationPref,
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
      `syncgrid_crm_contacts_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Contacts ledger exported successfully.');
  };

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter ? c.role.toLowerCase().includes(roleFilter.toLowerCase()) : true;
    const matchesPrimary = primaryFilter
      ? primaryFilter === 'yes'
        ? c.isPrimary
        : !c.isPrimary
      : true;

    return matchesSearch && matchesRole && matchesPrimary;
  });

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Relationship Intelligence System"
        title="CRM Contacts Directory"
        description="Monitor individual stakeholders, define primary workspace targets, and track communication metadata preferences."
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              className="h-9 hover:bg-accent/40 text-xs gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
            <Link href="/crm/contacts/create">
              <Button variant="default" size="sm" className="h-9 text-xs gap-1.5">
                <Plus className="h-4 w-4" />
                Add Contact
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Counters Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl select-none backdrop-blur-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Total Stakeholders
            </span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-2xl font-black font-mono text-white mt-1.5">{contacts.length}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Across all onboarded company accounts</p>
        </Card>

        <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl select-none backdrop-blur-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Primary Targets</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black font-mono text-emerald-400 mt-1.5">
            {contacts.filter((c) => c.isPrimary).length}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">
            Designated workspace key decision-makers
          </p>
        </Card>

        <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl select-none backdrop-blur-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Channels</span>
            <CheckCircle className="w-4 h-4 text-purple-500" />
          </div>
          <h3 className="text-2xl font-black font-mono text-purple-400 mt-1.5">100%</h3>
          <p className="text-[10px] text-slate-400 mt-1">Email, Slack, Zoom, Phone verified</p>
        </Card>
      </div>

      {/* Action and Filter Control Bar */}
      <Card className="bg-card/30 border border-border/60 p-4 rounded-2xl backdrop-blur-sm">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className="pl-8 h-9 text-xs bg-background/40"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="w-48">
              <Select
                value={roleFilter}
                onChange={(val) => setRoleFilter(val)}
                placeholder="All Roles"
                options={[
                  { value: '', label: 'All Roles' },
                  { value: 'cto', label: 'CTO' },
                  { value: 'ceo', label: 'CEO' },
                  { value: 'vp', label: 'VP Level' },
                  { value: 'head', label: 'Operations' },
                ]}
              />
            </div>

            <div className="w-48">
              <Select
                value={primaryFilter}
                onChange={(val) => setPrimaryFilter(val)}
                placeholder="All Levels"
                options={[
                  { value: '', label: 'All Levels' },
                  { value: 'yes', label: 'Primary Contact' },
                  { value: 'no', label: 'Alternative Contact' },
                ]}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Main Ledger Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <LoadingSpinner className="h-8 w-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground animate-pulse font-bold tracking-wider uppercase">
            Syncing corporate contact directories...
          </p>
        </div>
      ) : contacts.length === 0 ? (
        <Card className="bg-card/40 border border-border/60 rounded-2xl p-8 backdrop-blur-md flex flex-col items-center justify-center">
          <EmptyState
            icon={<Users className="h-10 w-10 text-slate-500" />}
            title="No Contacts Found"
            description="Get started by onboarding your corporate client accounts and assigning primary stakeholders to drive communication pipelines."
            action={{
              label: 'Add First Contact',
              onClick: () => {
                router.push('/crm/contacts/create');
              },
            }}
          />
        </Card>
      ) : filteredContacts.length === 0 ? (
        <Card className="bg-card/40 border border-border/60 rounded-2xl p-8 backdrop-blur-md flex flex-col items-center justify-center">
          <EmptyState
            icon={<Search className="h-10 w-10 text-slate-500" />}
            title="No Matching Contacts"
            description="Try adjusting your fuzzy search query or category filters to locate the desired corporate stakeholder record."
          />
        </Card>
      ) : (
        <Card className="bg-card/40 border border-border/60 rounded-2xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-background/20 select-none text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        selectedRows.length === filteredContacts.length &&
                        filteredContacts.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-border/60 text-primary focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Organization</th>
                  <th className="py-3.5 px-4">Scope Role</th>
                  <th className="py-3.5 px-4">Prefer Channel</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                <AnimatePresence mode="popLayout">
                  {filteredContacts.map((c) => (
                    <motion.tr
                      key={c._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`hover:bg-slate-900/10 transition-colors ${
                        selectedRows.includes(c._id) ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(c._id)}
                          onChange={() => handleRowSelect(c._id)}
                          className="rounded border-border/60 text-primary focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-white text-sm flex items-center gap-1.5">
                          {c.name}
                          {c.isPrimary && (
                            <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider select-none">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-slate-400 text-[10px]">
                          <span className="flex items-center gap-0.5">
                            <Mail className="h-3 w-3" />
                            {c.email}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <Phone className="h-3 w-3" />
                            {c.phone}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-300 font-semibold flex items-center gap-1.5 mt-2.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-500" />
                        {c.companyName}
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                          <Tag className="h-2.5 w-2.5" />
                          {c.role}
                        </span>
                      </td>
                      <td className="py-4 px-4 uppercase font-bold tracking-wider text-[10px] text-purple-400">
                        {c.communicationPref}
                      </td>
                      <td className="py-4 px-4">
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock className="h-3 w-3" />
                          Verified stakeholder
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/crm/contacts/${c._id}`}>
                            <button
                              title="View Profile"
                              className="p-1.5 rounded-lg border border-border/60 hover:bg-primary/10 text-slate-400 hover:text-primary transition-all"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                          <Link href={`/crm/contacts/${c._id}/edit`}>
                            <button
                              title="Edit Contact"
                              className="p-1.5 rounded-lg border border-border/60 hover:bg-blue-500/10 text-slate-400 hover:text-blue-400 transition-all"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDeleteContact(c._id)}
                            title="Delete Record"
                            className="p-1.5 rounded-lg border border-border/60 hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Floating Bulk Actions Bar */}
      <AnimatePresence>
        {selectedRows.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-slate-900 border border-border p-3.5 rounded-2xl shadow-2xl select-none"
          >
            <span className="text-xs font-bold text-slate-300">
              {selectedRows.length} contacts selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleBulkDelete}
                variant="destructive"
                size="sm"
                className="h-8 text-xs gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Selected
              </Button>
              <Button
                onClick={() => setSelectedRows([])}
                variant="outline"
                size="sm"
                className="h-8 text-xs"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Single Contact Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={async () => {
          if (contactToDeleteId) {
            const contactObj = contacts.find((c) => c._id === contactToDeleteId);
            if (contactObj) {
              try {
                const endpoint =
                  contactObj.source === 'client'
                    ? `/api/protected/clients/${contactObj.companyId}/contacts/${contactToDeleteId}`
                    : `/api/protected/crm/contacts/${contactToDeleteId}`;

                const res = await fetch(endpoint, {
                  method: 'DELETE',
                });
                const data = await res.json();
                if (data.success) {
                  setContacts(contacts.filter((c) => c._id !== contactToDeleteId));
                  toast.success('Contact record permanently deleted.');
                } else {
                  toast.error(data.message || 'Failed to delete contact.');
                }
              } catch (err) {
                toast.error('Network failure deleting contact.');
              }
            }
          }
          setIsDeleteConfirmOpen(false);
        }}
        title="Delete Contact Stakeholder"
        message="Are you absolutely sure you want to permanently delete this corporate contact record? This will clear communication preferences and profile details."
        confirmLabel="Delete Contact"
        cancelLabel="Cancel"
        type="danger"
      />

      {/* Bulk Contacts Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isBulkDeleteConfirmOpen}
        onClose={() => setIsBulkDeleteConfirmOpen(false)}
        onConfirm={async () => {
          let deletedCount = 0;
          for (const id of selectedRows) {
            const contactObj = contacts.find((c) => c._id === id);
            if (contactObj) {
              try {
                const endpoint =
                  contactObj.source === 'client'
                    ? `/api/protected/clients/${contactObj.companyId}/contacts/${id}`
                    : `/api/protected/crm/contacts/${id}`;

                const res = await fetch(endpoint, {
                  method: 'DELETE',
                });
                const data = await res.json();
                if (data.success) {
                  deletedCount++;
                }
              } catch (err) {
                console.error('Error deleting contact in bulk:', err);
              }
            }
          }
          setContacts(contacts.filter((c) => !selectedRows.includes(c._id)));
          setSelectedRows([]);
          setIsBulkDeleteConfirmOpen(false);
          toast.success(`Successfully purged ${deletedCount} contact records.`);
        }}
        title="Delete Selected Contacts"
        message={`Are you sure you want to permanently delete all ${selectedRows.length} selected contacts?`}
        confirmLabel="Delete Selected"
        cancelLabel="Cancel"
        type="danger"
      />
    </div>
  );
}
