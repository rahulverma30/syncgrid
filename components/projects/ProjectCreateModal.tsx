import React, { useState } from 'react';
import { Button, Input, Modal, Select } from '@/components/ui';
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
      description="Set up a new project with budget, timeline, and team allocation parameters."
      size="lg"
    >
      {/* Visual Templates Selector */}
      <div className="space-y-1.5 border-b border-border/40 pb-3 mb-3 select-none">
        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-wider">
          Select Blueprint Template:
        </label>
        <div className="grid grid-cols-4 gap-2">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTemplate(t)}
              className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all select-none cursor-pointer ${
                activeTemplate === t.id
                  ? 'bg-primary/10 border-primary shadow-xs ring-1 ring-primary/20'
                  : 'bg-card/25 border-border/60 hover:bg-card/65'
              }`}
            >
              <div className="space-y-0.5">
                <p className="text-[10px] font-black tracking-wide text-foreground leading-none">
                  {t.name}
                </p>
                <p className="text-[8px] text-muted-foreground leading-tight line-clamp-2">
                  {t.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleCreate} className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3.5">
          <div className="space-y-1 col-span-2">
            <label className="text-[9px] font-bold text-muted-foreground uppercase">
              Project Name *
            </label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="SyncGrid Enterprise Platform"
              className="h-8.5 bg-background/50 focus-visible:ring-1"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-muted-foreground uppercase">
            Description
          </label>
          <textarea
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder="Brief project scope and objectives..."
            className="w-full h-16 p-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:ring-2 focus:ring-ring text-xs leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-2 gap-3.5 items-end">
          <div className="space-y-1">
            <Select
              label="Priority"
              value={formPriority}
              onChange={(val) => setFormPriority(val as any)}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
              ]}
            />
          </div>
          <div className="space-y-1">
            <Select
              label="Billing Model"
              value={formBillingType}
              onChange={(val) => setFormBillingType(val as any)}
              options={[
                { value: 'fixed', label: 'Fixed Price' },
                { value: 'hourly', label: 'Hourly Rate' },
                { value: 'retainer', label: 'Retainer' },
                { value: 'milestone-based', label: 'Milestone Based' },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 items-end select-none">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-muted-foreground uppercase">
              Budget ($)
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
              Est. Hours
            </label>
            <Input
              type="number"
              value={formEstimatedHours}
              onChange={(e) => setFormEstimatedHours(parseInt(e.target.value) || 0)}
              className="h-8.5 bg-background/50"
            />
          </div>
          <div className="space-y-1">
            <Select
              label="Project Manager"
              value={formManager}
              onChange={(val) => setFormManager(val)}
              placeholder="Choose PM..."
              options={[
                { value: 'Pepper Potts', label: 'Pepper Potts' },
                { value: 'Lucius Fox', label: 'Lucius Fox' },
                { value: 'Samantha Vance', label: 'Samantha Vance' },
                { value: 'Tony Stark', label: 'Tony Stark' },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-muted-foreground uppercase">
              Start Date
            </label>
            <Input
              type="date"
              value={formStartDate}
              onChange={(e) => setFormStartDate(e.target.value)}
              className="h-8.5 bg-background/50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-muted-foreground uppercase">Deadline</label>
            <Input
              type="date"
              value={formDeadline}
              onChange={(e) => setFormDeadline(e.target.value)}
              className="h-8.5 bg-background/50"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-muted-foreground uppercase">
            Technologies (comma-separated)
          </label>
          <Input
            value={formTechnologies}
            onChange={(e) => setFormTechnologies(e.target.value)}
            placeholder="React, Node.js, MongoDB, TypeScript"
            className="h-8.5 bg-background/50"
          />
        </div>

        <ProjectTagSelector selectedTags={selectedTags} onChange={setSelectedTags} />

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
            {isSubmitting ? 'Initializing...' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
