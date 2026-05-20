'use client';

import { useState, useEffect } from 'react';
import { useHRStore } from '@/store/hrStore';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Input,
  Modal,
  Select,
} from '@/components/ui';
import { Trophy, Plus, Target, Star } from 'lucide-react';
import { toast } from 'sonner';

export function HrPerformance() {
  const { employees, performanceReviews, submitPerformanceReview, fetchReviews, loading } =
    useHRStore();

  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  const [form, setForm] = useState({
    cycleName: '',
    score: 5,
    selfFeedback: '',
    managerFeedback: '',
    goal1Title: '',
    goal1Kpi: '',
  });

  useEffect(() => {
    // Initial fetch of performance reviews
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !form.cycleName) {
      toast.error('Employee and Cycle Name are required!');
      return;
    }

    const goals = form.goal1Title
      ? [{ title: form.goal1Title, status: 'in_progress' as const, kpi: form.goal1Kpi }]
      : [];

    const success = await submitPerformanceReview({
      employeeId: selectedEmployeeId,
      cycleName: form.cycleName,
      score: Number(form.score),
      selfFeedback: form.selfFeedback,
      managerFeedback: form.managerFeedback,
      goals,
    });

    if (success) {
      setIsReviewOpen(false);
      setSelectedEmployeeId('');
      setForm({
        cycleName: '',
        score: 5,
        selfFeedback: '',
        managerFeedback: '',
        goal1Title: '',
        goal1Kpi: '',
      });
    }
  };

  // Helper to render star rating reviews
  const renderStars = (score: number) => {
    return (
      <div className="flex gap-1 text-amber-500">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`h-4 w-4 ${i < score ? 'fill-current' : 'opacity-20'}`} />
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Columns: Performance reviews lists */}
      <div className="lg:col-span-2 space-y-6">
        {/* Reviews Logs list */}
        <Card className="bg-card/40 border-border/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Performance Review Evaluations
              </CardTitle>
              <CardDescription>
                Historical employee score cards and manager feedbacks.
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsReviewOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs py-5 px-4 rounded-xl gap-2 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)] whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              New Evaluation
            </Button>
          </CardHeader>
          <CardContent>
            {performanceReviews.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground border border-dashed border-border/40 rounded-xl bg-card/10">
                No performance evaluations logged.
              </div>
            ) : (
              <div className="space-y-6">
                {performanceReviews.map((rev) => (
                  <div
                    key={rev._id}
                    className="p-5 rounded-2xl border border-border bg-card/30 backdrop-blur-sm space-y-3"
                  >
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{rev.employeeId?.fullName}</span>
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            ({rev.employeeId?.designation})
                          </span>
                        </div>
                        <p className="text-xs text-primary font-semibold">{rev.cycleName}</p>
                      </div>
                      <div className="space-y-1 text-right">
                        {renderStars(rev.score)}
                        <span className="text-[10px] text-muted-foreground block font-medium">
                          Score: {rev.score}/5
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-3 border-t border-border/30">
                      {rev.selfFeedback && (
                        <div className="space-y-1 p-3 rounded-xl border border-border/40 bg-card/20">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Self Evaluation Feedback
                          </span>
                          <p className="italic text-muted-foreground leading-relaxed">
                            &quot;{rev.selfFeedback}&quot;
                          </p>
                        </div>
                      )}
                      {rev.managerFeedback && (
                        <div className="space-y-1 p-3 rounded-xl border border-primary/10 bg-primary/5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                            Manager Feedback Review
                          </span>
                          <p className="italic text-foreground leading-relaxed">
                            &quot;{rev.managerFeedback}&quot;
                          </p>
                        </div>
                      )}
                    </div>

                    {rev.goals && rev.goals.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                          Tracked Performance Goals
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {rev.goals.map((goal: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/40 text-xs"
                            >
                              <Target className="h-3.5 w-3.5 text-primary" />
                              <span className="font-semibold">{goal.title}</span>
                              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] py-0">
                                {goal.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Goal summaries */}
      <div>
        <Card className="bg-card/40 border-border/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary animate-pulse" />
              Active Goals KPI Progress
            </CardTitle>
            <CardDescription>Track key metrics and project benchmarks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border border-border bg-card/20 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between font-semibold mb-1">
                <span>UI Scroll Virtualization (Sarah Jenkins)</span>
                <span className="text-primary font-bold">100%</span>
              </div>
              <div className="h-2 w-full bg-border/40 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '100%' }}></div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Target: virtualized table rendering 10k rows at 60 FPS.
              </p>
            </div>

            <div className="p-4 border border-border bg-card/20 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between font-semibold mb-1">
                <span>RBAC Security Matrix (Sarah Jenkins)</span>
                <span className="text-amber-500 font-bold">50%</span>
              </div>
              <div className="h-2 w-full bg-border/40 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '50%' }}></div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Target: lock edit restrictions and mask sensitive compensation metadata.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submit Evaluation Modal */}
      <Modal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        title="Log Staff Performance Evaluation"
      >
        <form onSubmit={handleSubmitReview} className="space-y-4 pt-2">
          <div>
            <Select
              label="Target Employee"
              value={selectedEmployeeId}
              onChange={(value) => setSelectedEmployeeId(value)}
              options={[
                { value: '', label: 'Select Staff Member...' },
                ...employees.map((emp) => ({
                  value: emp._id,
                  label: emp.fullName,
                })),
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Review Cycle Name
              </label>
              <Input
                placeholder="2026 Annual Evaluation"
                value={form.cycleName}
                onChange={(e) => setForm({ ...form, cycleName: e.target.value })}
                required
                className="text-xs"
              />
            </div>
            <div>
              <Select
                label="Evaluation Score (1-5)"
                value={String(form.score)}
                onChange={(value) => setForm({ ...form, score: Number(value) })}
                options={[
                  { value: '5', label: '5 - Outstanding Excellence' },
                  { value: '4', label: '4 - Exceeds Expectations' },
                  { value: '3', label: '3 - Meets Expectations' },
                  { value: '2', label: '2 - Needs Improvement' },
                  { value: '1', label: '1 - Unsatisfactory' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Employee Self Feedback
            </label>
            <Input
              placeholder="Comments from staff member..."
              value={form.selfFeedback}
              onChange={(e) => setForm({ ...form, selfFeedback: e.target.value })}
              className="text-xs"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Manager Review Feedback
            </label>
            <Input
              placeholder="Comments from reviewer manager..."
              value={form.managerFeedback}
              onChange={(e) => setForm({ ...form, managerFeedback: e.target.value })}
              className="text-xs"
            />
          </div>

          <div className="p-4 border border-border/80 rounded-xl space-y-3 bg-card/20">
            <span className="text-xs font-semibold text-foreground block">
              Define Performance Goal KPI
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Goal Title (e.g. Master React)"
                value={form.goal1Title}
                onChange={(e) => setForm({ ...form, goal1Title: e.target.value })}
                className="text-xs"
              />
              <Input
                placeholder="Target Metric (KPI)"
                value={form.goal1Kpi}
                onChange={(e) => setForm({ ...form, goal1Kpi: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReviewOpen(false)}
              className="text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading.submitReview}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-4"
            >
              Submit Score Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
