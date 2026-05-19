import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Users,
  DollarSign,
  ArrowUpRight,
  Scale,
  Activity,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { toast } from 'sonner';

interface ProfitabilityVaultProps {
  dashboardData: any;
  role: string;
}

export const ProfitabilityVault: React.FC<ProfitabilityVaultProps> = ({ dashboardData, role }) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [costRatesOpen, setCostRatesOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [hourlyRateVal, setHourlyRateVal] = useState('');

  // Fetch employees list to configure hourly resource billing costs
  const loadEmployees = async () => {
    try {
      const res = await fetch('/api/protected/hr');
      const json = await res.json();
      if (json.success) setEmployees(json.data);
    } catch (err) {
      console.error('Error fetching vault employees:', err);
    }
  };

  useEffect(() => {
    let active = true;
    const initEmployees = async () => {
      try {
        const res = await fetch('/api/protected/hr');
        const json = await res.json();
        if (json.success && active) {
          setEmployees(json.data);
        }
      } catch (err) {
        console.error('Error fetching vault employees:', err);
      }
    };
    initEmployees();
    return () => {
      active = false;
    };
  }, []);

  const handleOpenRateAdjust = (emp: any) => {
    setSelectedEmployee(emp);
    // Hardcoded demo hourly cost fallback or employee custom rating if present
    setHourlyRateVal(emp.hourlyRate?.toString() || '45');
    setCostRatesOpen(true);
  };

  const handleSaveRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    try {
      const res = await fetch(`/api/protected/hr`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedEmployee._id,
          hourlyRate: Number(hourlyRateVal),
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Hourly rate updated for ${selectedEmployee.firstName}!`);
        loadEmployees();
      } else {
        toast.error(json.message || 'Failed to update hourly rate');
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error updating hourly rate');
    }
    setCostRatesOpen(false);
  };

  if (!dashboardData) {
    return (
      <div className="text-center text-xs text-muted-foreground py-10">
        No analytics loaded. Please seed the ledger first.
      </div>
    );
  }

  const { projectMargins = [] } = dashboardData;
  const isFinance = ['super-admin', 'admin', 'finance'].includes(role);

  return (
    <div className="space-y-6 select-none">
      <div className="flex justify-between items-center select-none">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Operational Profitability Margins Vault
          </h3>
          <p className="text-[10px] text-muted-foreground">
            Analyze project margins, active payouts, and labor costs
          </p>
        </div>

        {isFinance && (
          <button
            onClick={() => loadEmployees()}
            className="px-3 py-1.5 border border-border/80 hover:bg-accent/40 text-foreground font-bold rounded-lg text-[10px] uppercase tracking-wider cursor-pointer"
          >
            Refreshed labor rates
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Margins Analysis */}
        <div className="lg:col-span-2 p-5 bg-card/30 border border-border/80 rounded-xl flex flex-col select-none space-y-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider">Project Margins Analyzer</h4>
            <p className="text-[10px] text-muted-foreground">
              Gross margin ratios matching paid invoicing milestones against project spent costs
            </p>
          </div>

          <div className="space-y-4">
            {projectMargins.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-10">
                No project transaction history found.
              </div>
            ) : (
              projectMargins.map((pm: any) => {
                const isHealthy = pm.margin >= 0;
                return (
                  <div
                    key={pm.id}
                    className="p-4 border border-border/60 bg-muted/5 rounded-xl space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="text-xs font-extrabold text-foreground">{pm.name}</h5>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">
                          Delivery Margin health index
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-extrabold border ${
                          isHealthy
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {pm.percent.toFixed(1)}% Margin
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] font-bold uppercase tracking-wider pt-1">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-[8px]">Paid Inflows</span>
                        <span className="text-foreground">${pm.revenue.toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-[8px]">Direct Outflows</span>
                        <span className="text-rose-400">${pm.cost.toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-[8px]">Gross Margin</span>
                        <span className={isHealthy ? 'text-emerald-400' : 'text-rose-400'}>
                          ${pm.margin.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Labor cost rate mappings */}
        <div className="p-5 bg-card/30 border border-border/80 rounded-xl flex flex-col select-none space-y-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Labor resource cost rating
            </h4>
            <p className="text-[10px] text-muted-foreground">
              Assign developer hourly labor costs to calibrate project spend indices
            </p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-96 pr-1">
            {employees.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-10">
                No employees listed.
              </div>
            ) : (
              employees.map((emp) => (
                <div
                  key={emp._id}
                  className="p-3 border border-border/60 bg-muted/5 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <h5 className="text-[11px] font-extrabold text-foreground">
                      {emp.firstName} {emp.lastName}
                    </h5>
                    <span className="text-[9px] text-muted-foreground uppercase font-semibold block">
                      {emp.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">
                      ${emp.hourlyRate || 45}/hr
                    </span>
                    {isFinance && (
                      <button
                        onClick={() => handleOpenRateAdjust(emp)}
                        className="px-2 py-0.5 border border-border/80 hover:bg-accent/40 text-foreground font-bold rounded text-[8px] uppercase tracking-wider cursor-pointer"
                      >
                        Adjust
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Adjust Labor Cost Rate Dialog */}
      <AnimatePresence>
        {costRatesOpen && selectedEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-border/60">
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Adjust Labor Cost Rate
                </h3>
                <button
                  onClick={() => setCostRatesOpen(false)}
                  className="p-1 hover:bg-accent/40 rounded text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveRateSubmit} className="space-y-4">
                <div className="bg-muted/15 p-3 rounded-xl border border-border/60 text-xs select-none">
                  <div className="flex justify-between font-bold">
                    <span className="text-muted-foreground">Resource Name:</span>
                    <span className="text-foreground">
                      {selectedEmployee.firstName} {selectedEmployee.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold mt-1">
                    <span className="text-muted-foreground">Role Designation:</span>
                    <span className="text-muted-foreground">{selectedEmployee.title}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Hourly Labor rate ($ USD) *
                  </label>
                  <Input
                    type="number"
                    required
                    min={1}
                    value={hourlyRateVal}
                    onChange={(e) => setHourlyRateVal(e.target.value)}
                    placeholder="45"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCostRatesOpen(false)}
                    className="h-9 text-xs cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="h-9 text-xs cursor-pointer">
                    Adjust Rating
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
