import React, { useState } from 'react';
import { Button, Input } from '@/components/ui';
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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl z-50 text-left space-y-4"
          >
            <div className="space-y-1 border-b border-border/40 pb-3 select-none">
              <h4 className="text-sm font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Layers className="h-4.5 w-4.5 text-primary" />
                Initialize Project
              </h4>
              <p className="text-[10px] text-muted-foreground">
                Set up a new project with budget, timeline, and team allocation parameters.
              </p>
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

              <div className="grid grid-cols-2 gap-3.5">
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
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">
                    Billing Model
                  </label>
                  <select
                    value={formBillingType}
                    onChange={(e) => setFormBillingType(e.target.value as any)}
                    className="w-full h-8.5 rounded-md border border-input bg-background/50 px-2 py-1 text-xs text-foreground focus:outline-none"
                  >
                    <option value="fixed">Fixed Price</option>
                    <option value="hourly">Hourly Rate</option>
                    <option value="retainer">Retainer</option>
                    <option value="milestone-based">Milestone Based</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 select-none">
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
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">
                    Project Manager
                  </label>
                  <select
                    value={formManager}
                    onChange={(e) => setFormManager(e.target.value)}
                    className="w-full h-8.5 rounded-md border border-input bg-background/50 px-2 py-1 text-xs text-foreground focus:outline-none"
                  >
                    <option value="">Choose PM...</option>
                    <option value="Pepper Potts">Pepper Potts</option>
                    <option value="Lucius Fox">Lucius Fox</option>
                    <option value="Samantha Vance">Samantha Vance</option>
                    <option value="Tony Stark">Tony Stark</option>
                  </select>
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
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">
                    Deadline
                  </label>
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
