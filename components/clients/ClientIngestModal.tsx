import React, { useState } from 'react';
import { Button, Input, Modal, Select } from '@/components/ui';
import { Building } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useClientsStore } from '@/store/clientsStore';
import { ClientTagSelector } from './ClientTagSelector';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

export const ClientIngestModal: React.FC = () => {
  const { data: session } = useSession();
  const { createModalOpen, setCreateModalOpen, fetchClients } = useClientsStore();

  // Local Form states
  const [formName, setFormName] = useState('');
  const [formIndustry, setFormIndustry] = useState('');
  const [formType, setFormType] = useState<
    'VIP' | 'Enterprise' | 'Startup' | 'High Value' | 'Retainer' | 'Inactive'
  >('Startup');
  const [formRevenue, setFormRevenue] = useState(25000);
  const [formSize, setFormSize] = useState<'1-10' | '11-50' | '51-200' | '201+'>('1-10');
  const [formManager, setFormManager] = useState('');
  const [formTimezone, setFormTimezone] = useState('UTC');
  const [formEmail, setFormEmail] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/protected/team/members');
        const d = await res.json();
        if (d.success) setUsers(d.data);
      } catch (err) {
        console.error('Failed to load users');
      }
    };
    fetchUsers();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      toast.error('Client Company Name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/protected/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          clientType: formType,
          industry: formIndustry,
          emails: formEmail ? [formEmail] : [],
          phones: [],
          address: '',
          timezone: formTimezone,
          website: formWebsite,
          companySize: formSize,
          revenueContribution: formRevenue,
          accountManager: formManager || session?.user?.name || 'Pepper Potts',
          tags: selectedTags,
        }),
      });

      const d = await res.json();
      if (d.success) {
        toast.success(`Client account "${formName}" onboarded successfully!`);
        fetchClients();
        setCreateModalOpen(false);
        // Reset state
        setFormName('');
        setFormIndustry('');
        setFormEmail('');
        setFormWebsite('');
        setFormRevenue(25000);
        setSelectedTags([]);
      } else {
        toast.error(d.message || 'Validation error while saving account.');
      }
    } catch (e) {
      toast.error('API connection failure.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={createModalOpen}
      onClose={() => setCreateModalOpen(false)}
      title="Onboard Customer Account"
      description="Register new corporate entities and establish foundational ARR terms, category structures, and ownership."
      size="lg"
    >
      <form onSubmit={handleCreateClient} className="space-y-6 text-sm py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Client Company *
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Stark Industries"
                className="pl-10 h-10 bg-background/30 border border-border/60 hover:border-primary/30 transition-colors text-xs rounded-xl"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Industry Sector
            </label>
            <Input
              value={formIndustry}
              onChange={(e) => setFormIndustry(e.target.value)}
              placeholder="e.g. Defense / High Tech"
              className="h-10 px-3 bg-background/30 border border-border/60 hover:border-primary/30 transition-colors text-xs rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Classification
            </label>
            <Select
              value={formType}
              onChange={(value) => setFormType(value as any)}
              options={[
                { value: 'Startup', label: 'Startup Tier' },
                { value: 'VIP', label: 'VIP Priority' },
                { value: 'Enterprise', label: 'Enterprise Contract' },
                { value: 'Retainer', label: 'Ongoing Retainer' },
                { value: 'High Value', label: 'Strategic Account' },
              ]}
              className="h-10 text-xs rounded-xl bg-background/30 border border-border/60 px-3 hover:border-primary/30 transition-colors text-slate-300 outline-none w-full"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Starting ARR Forecast ($)
            </label>
            <Input
              type="number"
              value={formRevenue}
              onChange={(e) => setFormRevenue(parseInt(e.target.value) || 0)}
              className="h-10 px-3 bg-background/30 border border-border/60 hover:border-primary/30 transition-colors text-xs rounded-xl font-mono text-emerald-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 select-none">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Company Size
            </label>
            <Select
              value={formSize}
              onChange={(value) => setFormSize(value as any)}
              options={[
                { value: '1-10', label: '1-10 Employees' },
                { value: '11-50', label: '11-50 Employees' },
                { value: '51-200', label: '51-200 Employees' },
                { value: '201+', label: '201+ Employees' },
              ]}
              className="h-10 text-xs rounded-xl bg-background/30 border border-border/60 px-3 hover:border-primary/30 transition-colors text-slate-300 outline-none w-full"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Designated Account Manager
            </label>
            <Select
              value={formManager}
              onChange={(value) => setFormManager(value)}
              options={[
                { value: '', label: 'Auto-assign...' },
                ...users.map((u) => ({ value: u.name, label: u.name })),
              ]}
              className="h-10 text-xs rounded-xl bg-background/30 border border-border/60 px-3 hover:border-primary/30 transition-colors text-slate-300 outline-none w-full"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Timezone Target
            </label>
            <Input
              value={formTimezone}
              onChange={(e) => setFormTimezone(e.target.value)}
              placeholder="e.g. EST / UTC"
              className="h-10 px-3 bg-background/30 border border-border/60 hover:border-primary/30 transition-colors text-xs rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Primary Point Email
            </label>
            <Input
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="billing@company.com"
              className="h-10 px-3 bg-background/30 border border-border/60 hover:border-primary/30 transition-colors text-xs rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Corporate Website
            </label>
            <Input
              value={formWebsite}
              onChange={(e) => setFormWebsite(e.target.value)}
              placeholder="www.company.com"
              className="h-10 px-3 bg-background/30 border border-border/60 hover:border-primary/30 transition-colors text-xs rounded-xl"
            />
          </div>
        </div>

        {/* Tag Selector Integration */}
        <div className="pt-2">
          <ClientTagSelector selectedTags={selectedTags} onChange={setSelectedTags} />
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-border/40 select-none mt-4">
          <Button
            type="button"
            onClick={() => setCreateModalOpen(false)}
            variant="outline"
            size="sm"
            className="h-9 text-xs px-4 rounded-lg hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
            size="sm"
            className="h-9 text-xs font-bold px-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-lg shadow-emerald-900/20"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Provisioning Vault...' : 'Create Corporate Account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
