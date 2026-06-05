import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  DollarSign,
  X,
  Check,
} from 'lucide-react';
import { Button, Input, Select, Modal } from '@/components/ui';
import { toast } from 'sonner';

interface BudgetPlannerProps {
  budgets: any[];
  onSaveBudget: (payload: any) => void;
  role: string;
}

export const BudgetPlanner: React.FC<BudgetPlannerProps> = ({ budgets, onSaveBudget, role }) => {
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<any | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<any>('operational');
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [threshold, setThreshold] = useState('80');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await fetch('/api/protected/projects');
        const json = await res.json();
        if (json.success) setProjects(json.data);
      } catch (err) {
        console.error('Error fetching builder projects dropdown:', err);
      }
    };
    loadProjects();
  }, []);

  const handleOpenCreate = () => {
    setSelectedBudget(null);
    setName('');
    setType('operational');
    setSelectedProject('');
    setAmount('');
    setStartDate('');
    setEndDate('');
    setThreshold('80');
    setNotes('');
    setBudgetModalOpen(true);
  };

  const handleOpenEdit = (b: any) => {
    setSelectedBudget(b);
    setName(b.name);
    setType(b.type);
    setSelectedProject(b.projectId?._id || '');
    setAmount(b.amount.toString());
    setStartDate(b.startDate ? new Date(b.startDate).toISOString().split('T')[0] : '');
    setEndDate(b.endDate ? new Date(b.endDate).toISOString().split('T')[0] : '');
    setThreshold(b.alertThreshold.toString());
    setNotes(b.notes || '');
    setBudgetModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount || !startDate || !endDate) {
      toast.error('All asterisk parameters are strictly required');
      return;
    }

    const payload: Record<string, any> = {
      name,
      type,
      projectId: type === 'project' ? selectedProject : undefined,
      amount: Number(amount),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      alertThreshold: Number(threshold) || 80,
      notes: notes || undefined,
    };

    if (selectedBudget) {
      payload._id = selectedBudget._id;
    }

    onSaveBudget(payload);
    setBudgetModalOpen(false);
  };

  const isFinance = ['super-admin', 'admin', 'finance'].includes(role);

  return (
    <div className="space-y-6 select-none">
      {/* Filters & Actions header */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Corporate Allocations & Spent Ledger
          </h3>
          <p className="text-[10px] text-muted-foreground">
            Define department spent policies and delivery caps
          </p>
        </div>

        {isFinance && (
          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="h-9 text-xs gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Set Budget Limit
          </Button>
        )}
      </div>

      {/* Budgets layout cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.length === 0 ? (
          <div className="col-span-full p-8 text-center border border-dashed border-border rounded-xl text-muted-foreground">
            No budget limits defined. Click &quot;Set Budget Limit&quot; above to configure limits.
          </div>
        ) : (
          budgets.map((b) => {
            const spentPercent = b.amount > 0 ? (b.spentAmount / b.amount) * 100 : 0;
            const thresholdExceeded = spentPercent >= b.alertThreshold;

            return (
              <motion.div
                key={b._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 rounded-xl border bg-card/30 backdrop-blur-md flex flex-col justify-between space-y-4 shadow-sm relative overflow-hidden select-none ${
                  thresholdExceeded
                    ? 'border-rose-500/40 ring-1 ring-rose-500/20'
                    : 'border-border/80'
                }`}
              >
                {/* Header title */}
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase font-extrabold tracking-widest text-primary">
                      {b.type} spend cap
                    </span>
                    <h4 className="text-xs font-extrabold text-foreground truncate max-w-[200px]">
                      {b.name}
                    </h4>
                    {b.projectId && (
                      <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider block">
                        Project: {b.projectId?.name}
                      </span>
                    )}
                  </div>
                  {thresholdExceeded && (
                    <span className="px-2 py-0.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[8px] font-extrabold uppercase tracking-widest rounded-full flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="h-3 w-3" />
                      Breached
                    </span>
                  )}
                </div>

                {/* Progress Linear metrics */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-muted-foreground">
                      Spent: ${b.spentAmount.toLocaleString()}
                    </span>
                    <span>Cap: ${b.amount.toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full bg-border/40 rounded-full overflow-hidden relative">
                    <div
                      style={{ width: `${Math.min(100, spentPercent)}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        thresholdExceeded
                          ? 'bg-gradient-to-r from-rose-500 to-red-600'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">
                    <span>Used: {spentPercent.toFixed(1)}%</span>
                    <span>Alert Limit: {b.alertThreshold}%</span>
                  </div>
                </div>

                {/* Date range footer */}
                <div className="flex justify-between items-center pt-2 border-t border-border/40 text-[9px] text-muted-foreground font-semibold select-none">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 opacity-60" />
                    <span>
                      {new Date(b.startDate).toLocaleDateString()} -{' '}
                      {new Date(b.endDate).toLocaleDateString()}
                    </span>
                  </div>

                  {isFinance && (
                    <button
                      onClick={() => handleOpenEdit(b)}
                      className="px-2.5 py-1 border border-border/80 hover:bg-accent/40 text-foreground font-bold rounded text-[8px] uppercase tracking-wider cursor-pointer"
                    >
                      Adjust Limit
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Set Allocation Limit Dialog */}
      <Modal
        isOpen={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        title={selectedBudget ? 'Adjust spend cap limit' : 'Set allocation spent limit'}
        size="md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Budget Name <span className="text-destructive">*</span>
            </label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q2 Global Marketing Campaign"
            />
          </div>

          <div className="space-y-1.5">
            <Select
              label="Budget Type"
              value={type}
              onChange={(val) => setType(val)}
              options={[
                { value: 'operational', label: 'Operational Overhead' },
                { value: 'project', label: 'Project Schedule Allocation' },
                { value: 'department', label: 'Department Fund' },
              ]}
            />
          </div>

          {type === 'project' && (
            <div className="space-y-1.5">
              <Select
                label="Target Project *"
                value={selectedProject}
                onChange={(val) => setSelectedProject(val)}
                placeholder="Select Project..."
                options={projects.map((p) => ({
                  value: p._id,
                  label: p.name,
                }))}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Allocation Cap ($ USD) <span className="text-destructive">*</span>
            </label>
            <Input
              type="number"
              required
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Start Date <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                End Date <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Spent Threshold Alarm limit (%)
            </label>
            <Input
              type="number"
              min={10}
              max={100}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="80"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Allocation Notes</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Short summary detail"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setBudgetModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Adjust Cap</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
