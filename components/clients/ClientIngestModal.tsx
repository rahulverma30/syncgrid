import React, { useState } from 'react';
import { Button, Input } from '@/components/ui';
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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[90vh] overflow-y-auto p-6 rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl z-50 text-left space-y-4"
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

            <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
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
                    required
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

              {/* Tag Selector Integration */}
              <ClientTagSelector selectedTags={selectedTags} onChange={setSelectedTags} />

              <div className="flex justify-end gap-2 pt-4 border-t border-border/40 select-none">
                <Button
                  type="button"
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Onboarding...' : 'Ingest Account'}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
