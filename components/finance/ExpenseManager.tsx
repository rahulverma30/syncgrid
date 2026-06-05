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
import { Button, Input, Select, Modal, EmptyState } from '@/components/ui';
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
          <div className="w-48">
            <Select
              value={categoryFilter}
              onChange={(val) => setCategoryFilter(val)}
              className="h-9"
              placeholder="All Categories"
              options={[
                { value: 'all', label: 'All Categories' },
                { value: 'travel', label: 'TravelSpend' },
                { value: 'meals', label: 'Meals & Dining' },
                { value: 'software', label: 'Software & SaaS' },
                { value: 'hardware', label: 'Hardware' },
                { value: 'marketing', label: 'Marketing' },
                { value: 'utilities', label: 'Utilities' },
                { value: 'rent', label: 'Rent/Office' },
                { value: 'consulting', label: 'Advisory/Consult' },
                { value: 'other', label: 'Other Ops' },
              ]}
            />
          </div>
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
        <table className="table-container">
          <thead>
            <tr className="table-header-row">
              <th className="table-header-cell">Expense ID</th>
              <th className="table-header-cell">Merchant / Vendor</th>
              <th className="table-header-cell">Employee Claimant</th>
              <th className="table-header-cell">Category</th>
              <th className="table-header-cell">Expense Date</th>
              <th className="table-header-cell">Amount</th>
              <th className="table-header-cell">Reimbursement</th>
              <th className="table-header-cell text-right">Receipt / Review</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-0 border-none">
                  <div className="py-12">
                    <EmptyState
                      title="No expenses found"
                      description="There are no expense records matching your current filter parameters."
                      action={
                        isFinance
                          ? {
                              label: 'File Expense',
                              onClick: () => setClaimDrawerOpen(true),
                              icon: <Plus className="w-4 h-4" />,
                            }
                          : undefined
                      }
                      variant="search"
                    />
                  </div>
                </td>
              </tr>
            ) : (
              filteredExpenses.map((exp) => (
                <tr key={exp._id} className="table-row">
                  <td className="table-body-cell font-bold text-foreground">{exp.expenseNumber}</td>
                  <td className="table-body-cell font-semibold">
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
                  <td className="table-body-cell text-muted-foreground">
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
                  <td className="table-body-cell">
                    <span className="px-2 py-0.5 bg-muted/40 border border-border text-[9px] uppercase font-bold tracking-wider rounded-md">
                      {exp.category}
                    </span>
                  </td>
                  <td className="table-body-cell text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 opacity-60" />
                      {new Date(exp.expenseDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="table-body-cell font-bold text-foreground">
                    {exp.currency}{' '}
                    {exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="table-body-cell">{getStatusBadge(exp.reimbursementStatus)}</td>
                  <td className="table-body-cell text-right">
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
      <Modal
        isOpen={claimDrawerOpen}
        onClose={() => setClaimDrawerOpen(false)}
        title="File Business Expense Claim"
        size="md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Select
              label="Claim Category"
              value={category}
              onChange={(val) => setCategory(val)}
              options={[
                { value: 'travel', label: 'Travel & Flights' },
                { value: 'meals', label: 'Client Meals & Dining' },
                { value: 'software', label: 'Software Tools & SaaS' },
                { value: 'hardware', label: 'Hardware & Workstation' },
                { value: 'marketing', label: 'Marketing Outflows' },
                { value: 'utilities', label: 'Office Utilities' },
                { value: 'rent', label: 'Office Rent' },
                { value: 'consulting', label: 'Audit advisory consulting' },
                { value: 'other', label: 'Other Operations spend' },
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Merchant / Vendor Name <span className="text-destructive">*</span>
            </label>
            <Input
              required
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g. AWS Charges, Delta Flights"
            />
          </div>

          <div className="space-y-1.5">
            <Select
              label="Linked Project (Optional)"
              value={selectedProject}
              onChange={(val) => setSelectedProject(val)}
              placeholder="No Linked Project..."
              options={projects.map((p) => ({
                value: p._id,
                label: p.name,
              }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Total Payout Amount (USD) <span className="text-destructive">*</span>
            </label>
            <Input
              type="number"
              required
              min={0.01}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Short Description Notes</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Flight to onsite client kickoff"
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

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setClaimDrawerOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">File Claim</Button>
          </div>
        </form>
      </Modal>

      {/* Resolve Review Manager Dialog */}
      <Modal
        isOpen={!!activeReviewClaim}
        onClose={() => setActiveReviewClaim(null)}
        title="Resolve Claim Review"
        size="md"
      >
        {activeReviewClaim && (
          <div className="space-y-4 pt-2">
            <div className="bg-muted/30 p-4 rounded-xl border border-border text-sm space-y-3 select-none">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Claimant:</span>
                <span className="font-semibold">
                  {activeReviewClaim.employeeId?.firstName} {activeReviewClaim.employeeId?.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Merchant:</span>
                <span className="font-semibold">{activeReviewClaim.merchant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category:</span>
                <span className="font-semibold capitalize text-primary">
                  {activeReviewClaim.category}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-border font-bold text-foreground">
                <span>Claim Amount:</span>
                <span>
                  {activeReviewClaim.currency} {activeReviewClaim.amount.toLocaleString()}
                </span>
              </div>
              {activeReviewClaim.notes && (
                <div className="pt-2 text-xs text-muted-foreground leading-relaxed italic">
                  Notes: &ldquo;{activeReviewClaim.notes}&rdquo;
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Approver Notes / Comments
              </label>
              <textarea
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder="Include clearance guidelines or audit feedback..."
                className="w-full h-20 p-3 bg-background border border-input text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="destructive" onClick={() => handleResolveReview('rejected')}>
                Reject Claim
              </Button>
              <Button onClick={() => handleResolveReview('approved')} className="gap-2">
                <ShieldCheck className="h-4 w-4" />
                Approve claim
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
