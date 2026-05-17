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
  Select,
} from '@/components/ui';
import { Settings, Megaphone, BookOpen, Sliders, CheckCircle, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

export function HrSettings() {
  const { postAnnouncement, loading } = useHRStore();
  const [form, setForm] = useState({
    title: '',
    content: '',
    isPinned: false,
  });

  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      toast.error('Title and Content are required!');
      return;
    }

    const success = await postAnnouncement({
      title: form.title,
      content: form.content,
      isPinned: form.isPinned,
      departmentId: null, // Company-wide announcement
    });

    if (success) {
      setForm({
        title: '',
        content: '',
        isPinned: false,
      });
    }
  };

  const policies = [
    {
      type: 'casual',
      label: 'Casual Time Off',
      allowance: '12 Days/Yr',
      desc: 'Used for brief unplanned personal events, relocations, or emergency breaks.',
    },
    {
      type: 'sick',
      label: 'Sick Leave',
      allowance: '10 Days/Yr',
      desc: 'Allocated for seasonal flu, medical rest periods, and family health events.',
    },
    {
      type: 'paid',
      label: 'Paid Vacation Leave',
      allowance: '15 Days/Yr',
      desc: 'Pre-scheduled annual holidays, vacations, or extended family travel plans.',
    },
    {
      type: 'unpaid',
      label: 'Unpaid Leave',
      allowance: 'Unlimited',
      desc: 'Approved on-demand time off that sits outside standard company payroll accruals.',
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Columns: Announcement bulletin composer & Policy settings */}
      <div className="lg:col-span-2 space-y-6">
        {/* Broadcast composer */}
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
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
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
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  required
                  rows={4}
                  className="text-xs"
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={form.isPinned}
                  onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
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

        {/* Leave Allowances policy definitions */}
        <Card className="bg-card/40 border-border/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Accrued Leave Policy Settings
            </CardTitle>
            <CardDescription>Standard annual allowances and roll-over parameters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {policies.map((policy) => (
              <div
                key={policy.type}
                className="p-4 rounded-xl border border-border bg-card/20 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">{policy.label}</span>
                  <Badge variant="outline" className="text-[10px] py-0.5">
                    Allowance: {policy.allowance}
                  </Badge>
                </div>
                <p className="text-muted-foreground leading-relaxed text-[11px]">{policy.desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Right Column: HR Help & Compliance tips */}
      <div>
        <Card className="bg-card/40 border-border/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary animate-pulse" />
              HR Operations Guide
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
