import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Check,
  X,
  ShieldCheck,
  FileText,
  Calendar,
  DollarSign,
  Upload,
  ClipboardCheck,
  ArrowUpRight,
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { toast } from 'sonner';

interface ExpenseManagerProps {
  expenses: any[];
  onSubmitClaim: (payload: any) => void;
  onApprove: (id: string, status: 'approved' | 'rejected', comments: string) => void;
  role: string;
}

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({
  expenses,
  onSubmitClaim,
  onApprove,
  role,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [claimDrawerOpen, setClaimDrawerOpen] = useState(false);

  // New Claim Form states
  const [category, setCategory] = useState<any>('travel');
  const [merchant, setMerchant] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Approval Modal states
  const [activeReviewClaim, setActiveReviewClaim] = useState<any | null>(null);
  const [reviewComments, setReviewComments] = useState('');

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

  const filteredExpenses = expenses.filter((exp) => {
    const merch = exp.merchant?.toLowerCase() || '';
    const noteStr = exp.notes?.toLowerCase() || '';
    const matchesSearch =
      merch.includes(search.toLowerCase()) || noteStr.includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'all' || exp.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      none: 'bg-muted/40 text-muted-foreground border-muted-foreground/30',
      pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse',
      approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      reimbursed: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    };
    return (
      <span
        className={`px-2 py-0.5 text-[9px] uppercase font-extrabold tracking-wider border rounded-full ${styles[status] || styles.none}`}
      >
        {status === 'none' ? 'direct bill' : status}
      </span>
    );
  };

  const handleOpenReview = (claim: any) => {
    setActiveReviewClaim(claim);
    setReviewComments('');
  };

  const handleResolveReview = (status: 'approved' | 'rejected') => {
    if (!activeReviewClaim) return;
    onApprove(activeReviewClaim._id, status, reviewComments);
    setActiveReviewClaim(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant.trim() || !amount) {
      toast.error('Merchant and Amount are required fields');
      return;
    }

    const payload = {
      category,
      merchant,
      projectId: selectedProject || undefined,
      amount: Number(amount),
      currency: 'USD',
      notes: notes || undefined,
      expenseDate: new Date(),
    };

    onSubmitClaim(payload);
    setClaimDrawerOpen(false);
    setMerchant('');
    setAmount('');
    setNotes('');
  };

  const isFinance = ['super-admin', 'admin', 'finance'].includes(role);

  return (
    <div className="space-y-6 select-none">
      {/* Filtering Search Bar */}
      <div className="flex justify-between items-center gap-4 flex-wrap select-none">
        <div className="flex gap-2 items-center flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses by merchant or description..."
              className="pl-8 h-9 text-xs bg-background/30"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 px-3 border border-border bg-background/40 text-xs rounded-md focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="travel">Travel</option>
            <option value="meals">Meals</option>
            <option value="software">Software</option>
            <option value="hardware">Hardware</option>
            <option value="marketing">Marketing</option>
            <option value="utilities">Utilities</option>
            <option value="rent">Rent/Office</option>
            <option value="consulting">Advisory/Consulting</option>
            <option value="other">Other</option>
          </select>
        </div>

        <Button
          onClick={() => setClaimDrawerOpen(true)}
          size="sm"
          className="h-9 text-xs gap-1.5 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          File Expense
        </Button>
      </div>

      {/* Main Expenses listing Grid Table */}
      <div className="border border-border/80 rounded-xl overflow-hidden backdrop-blur-md">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-muted/20 border-b border-border/60 text-[10px] uppercase font-bold tracking-wider text-muted-foreground select-none">
              <th className="p-4">Expense ID</th>
              <th className="p-4">Merchant / Vendor</th>
              <th className="p-4">Employee Claimant</th>
              <th className="p-4">Category</th>
              <th className="p-4">Expense Date</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Reimbursement</th>
              <th className="p-4 text-right">Receipt / Review</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  No expense records matching filter parameters.
                </td>
              </tr>
            ) : (
              filteredExpenses.map((exp) => (
                <tr
                  key={exp._id}
                  className="border-b border-border/40 hover:bg-muted/10 transition-colors"
                >
                  <td className="p-4 font-bold text-foreground">{exp.expenseNumber}</td>
                  <td className="p-4 font-semibold">
                    <div className="flex flex-col">
                      <span>{exp.merchant}</span>
                      {exp.projectId && (
                        <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                          <ArrowUpRight className="h-2.5 w-2.5" />
                          Project: {exp.projectId?.name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {exp.employeeId ? (
                      <span>
                        {exp.employeeId?.firstName} {exp.employeeId?.lastName}
                      </span>
                    ) : (
                      <span className="text-[9px] font-extrabold uppercase tracking-wider opacity-60">
                        Corporate Direct
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 bg-muted/40 border border-border text-[9px] uppercase font-bold tracking-wider rounded-md">
                      {exp.category}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 opacity-60" />
                      {new Date(exp.expenseDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-foreground">
                    {exp.currency}{' '}
                    {exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4">{getStatusBadge(exp.reimbursementStatus)}</td>
                  <td className="p-4 text-right">
                    {isFinance && exp.reimbursementStatus === 'pending' ? (
                      <button
                        onClick={() => handleOpenReview(exp)}
                        className="px-3 py-1 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded text-[10px] uppercase tracking-wider cursor-pointer"
                      >
                        Resolve review
                      </button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-semibold italic flex justify-end gap-1.5 select-none">
                        <FileText className="h-3.5 w-3.5" />
                        Receipt Checked
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Claim Submission Drawer Form Overlay */}
      <AnimatePresence>
        {claimDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-border/60">
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  File Business Expense Claim
                </h3>
                <button
                  onClick={() => setClaimDrawerOpen(false)}
                  className="p-1 hover:bg-accent/40 rounded text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Claim Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full h-9 px-3 border border-border bg-background/40 text-xs rounded-md focus:outline-none"
                  >
                    <option value="travel">Travel & Flights</option>
                    <option value="meals">Client Meals & Dining</option>
                    <option value="software">Software Tools & SaaS</option>
                    <option value="hardware">Hardware & Workstation</option>
                    <option value="marketing">Marketing Outflows</option>
                    <option value="utilities">Office Utilities</option>
                    <option value="rent">Office Rent</option>
                    <option value="consulting">Audit advisory consulting</option>
                    <option value="other">Other Operations spend</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Merchant / Vendor Name
                  </label>
                  <Input
                    required
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    placeholder="e.g. AWS Charges, Delta Flights"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Linked Project (Optional)
                  </label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full h-9 px-3 border border-border bg-background/40 text-xs rounded-md focus:outline-none"
                  >
                    <option value="">No Linked Project...</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Total Payout Amount (USD)
                  </label>
                  <Input
                    type="number"
                    required
                    min={0.01}
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Short Description Notes
                  </label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Flight to onsite client kickoff"
                    className="h-9 text-xs"
                  />
                </div>

                {/* Simulated file upload receipt */}
                <div className="border border-dashed border-border/80 rounded-xl p-4 flex flex-col items-center justify-center space-y-2 bg-muted/5 select-none">
                  <Upload className="h-5 w-5 text-muted-foreground/60" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Simulate Receipt Attachment
                  </span>
                  <span className="text-[9px] text-muted-foreground/80 font-semibold italic">
                    Receipt_AcmeDelta.pdf (124 KB) automatically attached
                  </span>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setClaimDrawerOpen(false)}
                    className="h-9 text-xs cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="h-9 text-xs cursor-pointer">
                    File Claim
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Resolve Review Manager Dialog */}
      <AnimatePresence>
        {activeReviewClaim && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-border/60">
                <h3 className="text-sm font-bold uppercase tracking-wider">Resolve Claim Review</h3>
                <button
                  onClick={() => setActiveReviewClaim(null)}
                  className="p-1 hover:bg-accent/40 rounded text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="bg-muted/15 p-4 rounded-xl border border-border/60 text-xs space-y-2 select-none">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Claimant:</span>
                  <span className="font-bold">
                    {activeReviewClaim.employeeId?.firstName}{' '}
                    {activeReviewClaim.employeeId?.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Merchant:</span>
                  <span className="font-bold">{activeReviewClaim.merchant}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-semibold uppercase tracking-wider text-primary">
                    {activeReviewClaim.category}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-border/40 text-sm font-extrabold text-foreground">
                  <span>Claim Amount:</span>
                  <span>
                    {activeReviewClaim.currency} {activeReviewClaim.amount.toLocaleString()}
                  </span>
                </div>
                {activeReviewClaim.notes && (
                  <div className="pt-1 text-[10px] text-muted-foreground font-semibold leading-relaxed">
                    Notes: &ldquo;{activeReviewClaim.notes}&rdquo;
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Approver Notes / Comments
                </label>
                <textarea
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  placeholder="Include clearance guidelines or audit feedback..."
                  className="w-full h-16 p-2 bg-background/40 border border-border text-xs rounded-md focus:outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => handleResolveReview('rejected')}
                  className="px-4 py-2 border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Reject Claim
                </button>
                <button
                  onClick={() => handleResolveReview('approved')}
                  className="px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-lg text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Approve claim
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
