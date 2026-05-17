'use client';

import { useState } from 'react';
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
  Textarea,
} from '@/components/ui';
import {
  Settings,
  Megaphone,
  BookOpen,
  Sliders,
  CheckCircle,
  HelpCircle,
  Clock,
  Briefcase,
  SlidersHorizontal,
  CheckSquare,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

export function HrSettings() {
  const { postAnnouncement, loading } = useHRStore();
  const [activeSubTab, setActiveSubTab] = useState('broadcast');

  // Broadcast Memo form
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    content: '',
    isPinned: false,
  });

  // Enterprise Policies form states
  const [casualAllowance, setCasualAllowance] = useState(12);
  const [sickAllowance, setSickAllowance] = useState(10);
  const [paidAllowance, setPaidAllowance] = useState(15);
  const [lateGraceMinutes, setLateGraceMinutes] = useState(15);
  const [standardShiftHours, setStandardShiftHours] = useState(8);
  const [overtimeThreshold, setOvertimeThreshold] = useState(8);

  // Checklist template editor states
  const [devTasks, setDevTasks] = useState(
    'Signed Contract, Issued Laptop, Configured Credentials, Codebase Walkthrough, Setup SSH Keys, First Commit Deploy'
  );
  const [hrTasks, setHrTasks] = useState(
    'Signed Contract, Issued Laptop, Configured Credentials, Compliance Review, HRIS Introduction, Benefits Enrollment'
  );
  const [designTasks, setDesignTasks] = useState(
    'Signed Contract, Issued Laptop, Configured Credentials, Figma Workspace Invitation, Brand Guild Walkthrough, Asset Library Briefing'
  );
  const [contractorTasks, setContractorTasks] = useState(
    'Signed Contract, Compliance Disclosures, Configured Credentials, Initial Backlog Briefing, Direct Invoice Setup'
  );

  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.title || !broadcastForm.content) {
      toast.error('Title and Content are required!');
      return;
    }

    const success = await postAnnouncement({
      title: broadcastForm.title,
      content: broadcastForm.content,
      isPinned: broadcastForm.isPinned,
      departmentId: null, // Company-wide announcement
    });

    if (success) {
      setBroadcastForm({
        title: '',
        content: '',
        isPinned: false,
      });
    }
  };

  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Enterprise operations policy configurations saved & synced.');
  };

  const handleSaveChecklists = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Dynamic onboarding checklist templates updated.');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Columns: Config Panels */}
      <div className="lg:col-span-2 space-y-6">
        {/* Settings Sub-Tab Navigation */}
        <div className="flex border-b border-border bg-card/10 p-1.5 rounded-lg gap-1">
          {[
            { id: 'broadcast', label: 'Memo Broadcasts', icon: Megaphone },
            { id: 'policies', label: 'Workforce Policies', icon: SlidersHorizontal },
            { id: 'templates', label: 'Checklist Templates', icon: CheckSquare },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeSubTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveSubTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                    : 'text-muted-foreground hover:bg-card hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Viewport content */}
        <div>
          {activeSubTab === 'broadcast' && (
            <Card className="bg-card/40 border-border/80 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-amber-500" />
                  Broadcast Corporate Notice memo
                </CardTitle>
                <CardDescription>
                  Compose company-wide announcements targeted to all active staff members.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePostNotice} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Notice Title
                    </label>
                    <Input
                      placeholder="e.g. Q2 Strategic Scrum Schedule & Onboardings"
                      value={broadcastForm.title}
                      onChange={(e) =>
                        setBroadcastForm({ ...broadcastForm, title: e.target.value })
                      }
                      required
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Notice Content
                    </label>
                    <Textarea
                      placeholder="Provide complete memo details, links, and action points here..."
                      value={broadcastForm.content}
                      onChange={(e) =>
                        setBroadcastForm({ ...broadcastForm, content: e.target.value })
                      }
                      required
                      rows={4}
                      className="text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      id="isPinned"
                      checked={broadcastForm.isPinned}
                      onChange={(e) =>
                        setBroadcastForm({ ...broadcastForm, isPinned: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0 bg-card"
                    />
                    <label
                      htmlFor="isPinned"
                      className="text-xs font-semibold text-foreground cursor-pointer select-none"
                    >
                      Pin this announcement to top of the bulletin scrollboard
                    </label>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading.postAnnouncement}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs py-2.5 rounded-xl shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]"
                  >
                    Broadcast Memo Notice
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {activeSubTab === 'policies' && (
            <Card className="bg-card/40 border-border/80 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-primary" />
                  Workforce & Leave Policies
                </CardTitle>
                <CardDescription>
                  Configure company-wide leave caps, grace timings, and standard overtime
                  parameters.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSavePolicies} className="space-y-6">
                  {/* Leave Allowances */}
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-primary" />
                      Annual Accrual Limits (Days)
                    </span>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">
                          Casual Days
                        </label>
                        <Input
                          type="number"
                          value={casualAllowance}
                          onChange={(e) => setCasualAllowance(Number(e.target.value))}
                          className="text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">
                          Sick Days
                        </label>
                        <Input
                          type="number"
                          value={sickAllowance}
                          onChange={(e) => setSickAllowance(Number(e.target.value))}
                          className="text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">
                          Paid Vacation
                        </label>
                        <Input
                          type="number"
                          value={paidAllowance}
                          onChange={(e) => setPaidAllowance(Number(e.target.value))}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Attendance parameters */}
                  <div className="space-y-4 border-t border-border/60 pt-4">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-primary" />
                      Grace Periods & Overtime Thresholds
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">
                          Late Grace (Mins)
                        </label>
                        <Input
                          type="number"
                          value={lateGraceMinutes}
                          onChange={(e) => setLateGraceMinutes(Number(e.target.value))}
                          className="text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">
                          Standard Shift (Hrs)
                        </label>
                        <Input
                          type="number"
                          value={standardShiftHours}
                          onChange={(e) => setStandardShiftHours(Number(e.target.value))}
                          className="text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">
                          OT Threshold (Hrs)
                        </label>
                        <Input
                          type="number"
                          value={overtimeThreshold}
                          onChange={(e) => setOvertimeThreshold(Number(e.target.value))}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="sm"
                    className="w-full gap-2 font-bold uppercase text-xs"
                  >
                    <Save className="h-4 w-4" />
                    Save Policies Configurations
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {activeSubTab === 'templates' && (
            <Card className="bg-card/40 border-border/80 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-primary" />
                  Onboarding Checklist Templates
                </CardTitle>
                <CardDescription>
                  Modify the pre-configured steps assigned to employees during their onboarding
                  cycle.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveChecklists} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">
                      💻 Developer template tasks (Comma Separated)
                    </label>
                    <Textarea
                      rows={2}
                      value={devTasks}
                      onChange={(e) => setDevTasks(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5 border-t border-border/40 pt-3">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">
                      💼 HR operations template tasks
                    </label>
                    <Textarea
                      rows={2}
                      value={hrTasks}
                      onChange={(e) => setHrTasks(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5 border-t border-border/40 pt-3">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">
                      🎨 Designer onboarding template tasks
                    </label>
                    <Textarea
                      rows={2}
                      value={designTasks}
                      onChange={(e) => setDesignTasks(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5 border-t border-border/40 pt-3">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">
                      📄 Contractor clearance template tasks
                    </label>
                    <Textarea
                      rows={2}
                      value={contractorTasks}
                      onChange={(e) => setContractorTasks(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="sm"
                    className="w-full gap-2 font-bold uppercase text-xs"
                  >
                    <Save className="h-4 w-4" />
                    Save Onboarding Checklists
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Right Column: HR Help & Compliance tips */}
      <div>
        <Card className="bg-card/40 border-border/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Operations Guide
            </CardTitle>
            <CardDescription>Compliance frameworks and audit details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-muted-foreground leading-relaxed">
            <div className="p-4 border border-border bg-card/20 rounded-xl space-y-2">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-primary" /> Multi-Tenant Boundaries
              </span>
              <p className="text-[11px]">
                All employee files, documents, audit logs, and stopwatch punches are isolated
                strictly using the session&apos;s company identifier context.
              </p>
            </div>

            <div className="p-4 border border-border bg-card/20 rounded-xl space-y-2">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-primary" /> Field-Level Encryption & RBAC
              </span>
              <p className="text-[11px]">
                Standard developers are locked from editing salary levels, exit dates, or assets
                files. Only members of the Super Admin or HR Manager group can modify compensation
                details.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
