import React, { useState } from 'react';
import { Button, Input, Modal, Select } from '@/components/ui';
import { DateInput } from '@/components/ui/date-input';
import { Layers, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectsStore } from '@/store/projectsStore';
import { ProjectTagSelector } from './ProjectTagSelector';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

export const ProjectCreateModal: React.FC = () => {
  const { data: session } = useSession();
  const { createModalOpen, setCreateModalOpen, fetchProjects } = useProjectsStore();

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [formBillingType, setFormBillingType] = useState<
    'fixed' | 'hourly' | 'retainer' | 'milestone-based'
  >('fixed');
  const [formBudget, setFormBudget] = useState(50000);
  const [formEstimatedHours, setFormEstimatedHours] = useState(240);
  const [formManager, setFormManager] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formTechnologies, setFormTechnologies] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string>('blank');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  React.useEffect(() => {
    if (createModalOpen) {
      fetch('/api/protected/team/members?limit=100')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setTeamMembers(data.data);
          }
        })
        .catch(console.error);
    }
  }, [createModalOpen]);

  const templates = [
    {
      id: 'blank',
      name: 'Blank',
      description: 'Start fresh',
      tags: [],
      budget: 50000,
      hours: 240,
      priority: 'medium' as const,
      billing: 'fixed' as const,
      tech: '',
    },
    {
      id: 'website',
      name: 'Website',
      description: 'Landing pages, static CMS',
      tags: ['Web', 'Design'],
      budget: 45000,
      hours: 180,
      priority: 'medium' as const,
      billing: 'fixed' as const,
      tech: 'React, Next.js, TailwindCSS, Vercel',
    },
    {
      id: 'saas',
      name: 'SaaS MVP',
      description: 'Auth, billing, multi-tenant app',
      tags: ['SaaS', 'Web', 'Mobile'],
      budget: 120000,
      hours: 600,
      priority: 'high' as const,
      billing: 'hourly' as const,
      tech: 'Next.js, Node.js, MongoDB, AWS, Stripe',
    },
    {
      id: 'crm',
      name: 'CRM',
      description: 'Enterprise dashboards & scale',
      tags: ['Enterprise', 'SaaS'],
      budget: 250000,
      hours: 1200,
      priority: 'urgent' as const,
      billing: 'retainer' as const,
      tech: 'React, GraphQL, PostgreSQL, Redis, Kubernetes',
    },
  ];

  const applyTemplate = (t: (typeof templates)[0]) => {
    setActiveTemplate(t.id);
    setFormBudget(t.budget);
    setFormEstimatedHours(t.hours);
    setFormPriority(t.priority);
    setFormBillingType(t.billing);
    setFormTechnologies(t.tech);
    setSelectedTags(t.tags);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      toast.error('Project name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/protected/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          priority: formPriority,
          billingType: formBillingType,
          budget: formBudget,
          estimatedHours: formEstimatedHours,
          projectManager: formManager || session?.user?.name || 'Pepper Potts',
          startDate: formStartDate || undefined,
          deadline: formDeadline || undefined,
          technologies: formTechnologies ? formTechnologies.split(',').map((t) => t.trim()) : [],
          tags: selectedTags,
        }),
      });

      const d = await res.json();
      if (d.success) {
        toast.success(`Project "${formName}" initialized successfully!`);
        fetchProjects();
        setCreateModalOpen(false);
        setFormName('');
        setFormDescription('');
        setFormBudget(50000);
        setFormEstimatedHours(240);
        setFormTechnologies('');
        setSelectedTags([]);
      } else {
        toast.error(d.message || 'Validation error while creating project.');
      }
    } catch {
      toast.error('API connection failure.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={createModalOpen}
      onClose={() => setCreateModalOpen(false)}
      title="Initialize Project"
      description="Deploy a new workspace, configure budgeting, allocate team members, and define the tech stack."
      size="xl"
    >
      {/* Visual Templates Selector */}
      <div className="space-y-2 border-b border-border/40 pb-4 mb-4 select-none">
        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
          Select Blueprint Template:
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTemplate(t)}
              className={`!p-3 h-auto rounded-xl border text-left flex flex-col justify-between transition-all select-none cursor-pointer ${
                activeTemplate === t.id
                  ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20'
                  : 'bg-background/30 border-border/60 hover:bg-card/60'
              }`}
            >
              <div className="space-y-1">
                <p className="text-[11px] font-bold tracking-wide text-white leading-none">
                  {t.name}
                </p>
                <p className="text-[9px] text-slate-400 leading-tight line-clamp-2">
                  {t.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleCreate} className="space-y-5 text-sm py-2">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
            Project Name *
          </label>
          <div className="relative">
            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="SyncGrid Enterprise Platform"
              className="pl-10 h-10 bg-background/30 border border-border/60 hover:border-primary/30 transition-colors text-xs rounded-xl"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
            Description
          </label>
          <textarea
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder="Brief project scope and objectives..."
            className="w-full h-20 p-3 rounded-xl border border-border/60 bg-background/30 hover:border-primary/30 transition-colors focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-xs text-white leading-relaxed resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-end">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Priority
            </label>
            <Select
              value={formPriority}
              onChange={(val) => setFormPriority(val as any)}
              options={[
                { value: 'low', label: 'Low Priority' },
                { value: 'medium', label: 'Medium Priority' },
                { value: 'high', label: 'High Priority' },
                { value: 'urgent', label: 'Urgent Priority' },
              ]}
              className="h-10 text-xs rounded-xl bg-background/30 border border-border/60 px-3 hover:border-primary/30 transition-colors text-slate-300 outline-none w-full"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Billing Model
            </label>
            <Select
              value={formBillingType}
              onChange={(val) => setFormBillingType(val as any)}
              options={[
                { value: 'fixed', label: 'Fixed Price Contract' },
                { value: 'hourly', label: 'Hourly Rate' },
                { value: 'retainer', label: 'Ongoing Retainer' },
                { value: 'milestone-based', label: 'Milestone Based' },
              ]}
              className="h-10 text-xs rounded-xl bg-background/30 border border-border/60 px-3 hover:border-primary/30 transition-colors text-slate-300 outline-none w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-end select-none">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Budget ($)
            </label>
            <Input
              type="number"
              value={formBudget}
              onChange={(e) => setFormBudget(parseInt(e.target.value) || 0)}
              className="h-10 px-3 bg-background/30 border border-border/60 hover:border-primary/30 transition-colors text-xs rounded-xl font-mono text-emerald-400"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Est. Hours
            </label>
            <Input
              type="number"
              value={formEstimatedHours}
              onChange={(e) => setFormEstimatedHours(parseInt(e.target.value) || 0)}
              className="h-10 px-3 bg-background/30 border border-border/60 hover:border-primary/30 transition-colors text-xs rounded-xl font-mono text-blue-400"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Project Manager
            </label>
            <Select
              value={formManager}
              onChange={(val) => setFormManager(val)}
              placeholder="Auto-assign..."
              options={[
                { value: '', label: 'Auto-assign...' },
                ...teamMembers.map((user) => ({
                  value: user.name,
                  label: user.name,
                })),
              ]}
              className="h-10 text-xs rounded-xl bg-background/30 border border-border/60 px-3 hover:border-primary/30 transition-colors text-slate-300 outline-none w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Start Date
            </label>
            <DateInput
              value={formStartDate}
              onChange={(e) => setFormStartDate(e.target.value)}
              className="h-10 px-3 bg-background/30 border border-border/60 hover:border-primary/30 transition-colors text-xs rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Deadline Target
            </label>
            <DateInput
              value={formDeadline}
              onChange={(e) => setFormDeadline(e.target.value)}
              className="h-10 px-3 bg-background/30 border border-border/60 hover:border-primary/30 transition-colors text-xs rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
            Tech Stack (comma-separated)
          </label>
          <Input
            value={formTechnologies}
            onChange={(e) => setFormTechnologies(e.target.value)}
            placeholder="React, Node.js, MongoDB, TypeScript"
            className="h-10 px-3 bg-background/30 border border-border/60 hover:border-primary/30 transition-colors text-xs rounded-xl text-purple-300 font-mono"
          />
        </div>

        <div className="pt-2">
          <ProjectTagSelector selectedTags={selectedTags} onChange={setSelectedTags} />
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
            className="h-9 text-xs font-bold px-6 rounded-lg bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-lg shadow-blue-900/20"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Provisioning...' : 'Deploy Workspace'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
