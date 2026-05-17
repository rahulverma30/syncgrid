'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button, Input } from '@/components/ui';
import {
  Users,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  Paperclip,
  CheckSquare,
  History,
  Send,
  Link,
  ChevronRight,
  TrendingUp,
  FileText,
  AlertCircle,
  Pin,
  EyeOff,
  User,
  Heart,
  ShieldCheck,
  Building,
  Edit,
  Activity,
  Layers,
  ArrowRight,
  Plus,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectsStore, ProjectAccount } from '@/store/projectsStore';
import { toast } from 'sonner';

export const ProjectDetailDrawer: React.FC = () => {
  const { selectedProject, setSelectedProject, activeTab, setActiveTab, fetchProjects, projects } =
    useProjectsStore();

  const drawerRef = useRef<HTMLDivElement>(null);

  const getUserTotalAllocation = (userName: string) => {
    let total = 0;
    projects.forEach((p) => {
      p.teamMembers?.forEach((m) => {
        if (
          m.userName &&
          userName &&
          m.userName.trim().toLowerCase() === userName.trim().toLowerCase()
        ) {
          total += m.allocation || 0;
        }
      });
    });
    return total;
  };

  // Sub-resource states
  const [newTeamUser, setNewTeamUser] = useState('');
  const [newTeamRole, setNewTeamRole] = useState<
    'project-manager' | 'team-lead' | 'developer' | 'qa' | 'designer' | 'devops' | 'other'
  >('developer');
  const [newTeamAlloc, setNewTeamAlloc] = useState(100);

  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [newMilestoneDependsOn, setNewMilestoneDependsOn] = useState<string[]>([]);
  const [newMilestoneParent, setNewMilestoneParent] = useState<string>('');

  const [newSprintName, setNewSprintName] = useState('');
  const [newSprintGoal, setNewSprintGoal] = useState('');
  const [newSprintStart, setNewSprintStart] = useState('');
  const [newSprintEnd, setNewSprintEnd] = useState('');

  const [newRiskTitle, setNewRiskTitle] = useState('');
  const [newRiskDesc, setNewRiskDesc] = useState('');
  const [newRiskSeverity, setNewRiskSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>(
    'medium'
  );
  const [newRiskMitigation, setNewRiskMitigation] = useState('');
  const [newRiskCategory, setNewRiskCategory] = useState<
    'technical' | 'staffing' | 'financial' | 'timeline' | 'dependency' | 'operational'
  >('technical');
  const [newRiskProbability, setNewRiskProbability] = useState<number>(3);
  const [newRiskImpact, setNewRiskImpact] = useState<number>(3);

  const [newDocName, setNewDocName] = useState('');
  const [newDocCat, setNewDocCat] = useState<
    'requirements' | 'design' | 'technical' | 'meeting-notes' | 'contract' | 'other'
  >('other');
  const [newDocUrl, setNewDocUrl] = useState('');

  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch project timeline on tab change or select
  useEffect(() => {
    if (!selectedProject || activeTab !== 'timeline') return;
    const fetchTimeline = async () => {
      try {
        const res = await fetch(`/api/protected/projects/${selectedProject._id}/timeline`);
        const d = await res.json();
        if (d.success) {
          setTimelineEvents(d.data);
        }
      } catch {}
    };
    fetchTimeline();
  }, [selectedProject, activeTab]);

  if (!selectedProject) return null;

  // Handle outside click to close drawer
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
      setSelectedProject(null);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/protected/projects/${selectedProject._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success(`Project status updated to ${newStatus}`);
        setSelectedProject(d.data);
        fetchProjects();
      }
    } catch {
      toast.error('Failed to update status.');
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    try {
      const res = await fetch(`/api/protected/projects/${selectedProject._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success(`Project priority updated to ${newPriority}`);
        setSelectedProject(d.data);
        fetchProjects();
      }
    } catch {
      toast.error('Failed to update priority.');
    }
  };

  const handleHealthChange = async (score: number) => {
    try {
      const res = await fetch(`/api/protected/projects/${selectedProject._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ healthScore: score }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success(`Health index updated to ${score}%`);
        setSelectedProject(d.data);
        fetchProjects();
      }
    } catch {
      toast.error('Failed to update health index.');
    }
  };

  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamUser) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/protected/projects/${selectedProject._id}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: newTeamUser,
          role: newTeamRole,
          allocation: newTeamAlloc,
        }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success('Team member assigned!');
        setSelectedProject(d.data);
        setNewTeamUser('');
        setNewTeamAlloc(100);
        fetchProjects();
      }
    } catch {
      toast.error('Failed to assign team member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/protected/projects/${selectedProject._id}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newMilestoneTitle,
          description: newMilestoneDesc,
          dueDate: newMilestoneDate || undefined,
          dependsOn: newMilestoneDependsOn,
          parentMilestoneId: newMilestoneParent || undefined,
        }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success('Milestone added!');
        setSelectedProject(d.data);
        setNewMilestoneTitle('');
        setNewMilestoneDesc('');
        setNewMilestoneDate('');
        setNewMilestoneDependsOn([]);
        setNewMilestoneParent('');
        fetchProjects();
      }
    } catch {
      toast.error('Failed to add milestone.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSprintName || !newSprintStart || !newSprintEnd) {
      toast.error('Sprint name, start date, and end date are required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/protected/projects/${selectedProject._id}/sprints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSprintName,
          goal: newSprintGoal,
          startDate: newSprintStart,
          endDate: newSprintEnd,
        }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success('Sprint initialized!');
        setSelectedProject(d.data);
        setNewSprintName('');
        setNewSprintGoal('');
        setNewSprintStart('');
        setNewSprintEnd('');
        fetchProjects();
      }
    } catch {
      toast.error('Failed to create sprint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRiskTitle) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/protected/projects/${selectedProject._id}/risks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newRiskTitle,
          description: newRiskDesc,
          severity: newRiskSeverity,
          mitigation: newRiskMitigation,
          category: newRiskCategory,
          probability: newRiskProbability,
          impact: newRiskImpact,
        }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success('Risk factor logged!');
        setSelectedProject(d.data);
        setNewRiskTitle('');
        setNewRiskDesc('');
        setNewRiskMitigation('');
        setNewRiskProbability(3);
        setNewRiskImpact(3);
        fetchProjects();
      }
    } catch {
      toast.error('Failed to log risk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName || !newDocUrl) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/protected/projects/${selectedProject._id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDocName,
          category: newDocCat,
          url: newDocUrl,
          size: Math.floor(Math.random() * 500000) + 50000,
        }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success('Document uploaded!');
        setSelectedProject(d.data);
        setNewDocName('');
        setNewDocUrl('');
        fetchProjects();
      }
    } catch {
      toast.error('Failed to attach document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'milestones', label: 'Milestones', icon: CheckSquare },
    { id: 'sprints', label: 'Sprints', icon: Zap },
    { id: 'documents', label: 'Docs', icon: Paperclip },
    { id: 'risks', label: 'Risks', icon: AlertCircle },
    { id: 'timeline', label: 'Timeline', icon: Activity },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-background/40 backdrop-blur-xs select-none"
      onClick={handleBackdropClick}
    >
      {/* Drawer Container */}
      <motion.div
        ref={drawerRef}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.35 }}
        className="w-full max-w-xl h-full bg-popover border-l border-border/80 flex flex-col shadow-2xl relative"
      >
        {/* Close & Header */}
        <div className="p-4 border-b border-border/40 flex items-center justify-between">
          <div className="space-y-0.5">
            <h4 className="text-sm font-black text-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-primary" />
              {selectedProject.name}
            </h4>
            <p className="text-[10px] font-mono text-muted-foreground">{selectedProject.code}</p>
          </div>
          <button
            onClick={() => setSelectedProject(null)}
            className="text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Close ×
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border/20 px-3 bg-muted/20 overflow-x-auto whitespace-nowrap scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-[10px] font-black uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
                  active
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-5 text-left text-xs leading-relaxed space-y-5 select-text">
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Dynamic Status / Priority Controllers */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">
                    Project Lifecycle Status
                  </label>
                  <select
                    value={selectedProject.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full h-8.5 rounded-md border border-input bg-background/50 px-2 py-1 text-xs text-foreground focus:outline-none"
                  >
                    <option value="planning">Planning</option>
                    <option value="design">Design</option>
                    <option value="development">Development</option>
                    <option value="testing">Testing</option>
                    <option value="deployment">Deployment</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">
                    Priority Escalation
                  </label>
                  <select
                    value={selectedProject.priority}
                    onChange={(e) => handlePriorityChange(e.target.value)}
                    className="w-full h-8.5 rounded-md border border-input bg-background/50 px-2 py-1 text-xs text-foreground focus:outline-none"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent Priority</option>
                  </select>
                </div>
              </div>

              {/* Health Slider */}
              <div className="space-y-2 p-3.5 rounded-lg bg-card/30 border border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">
                    Project Health Index
                  </span>
                  <span
                    className={`text-[10px] font-bold ${selectedProject.healthScore >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}
                  >
                    {selectedProject.healthScore}% Healthy
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedProject.healthScore}
                  onChange={(e) => handleHealthChange(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              {/* Scope & Overview Metadata */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">
                  Project Scope / Summary
                </span>
                <p className="p-3 rounded-lg border border-border/40 bg-card/20 leading-relaxed whitespace-pre-wrap">
                  {selectedProject.description || 'No project description declared.'}
                </p>
              </div>

              {/* Financial & Delivery Dates info grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-card/30 border border-border/50 space-y-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">
                    Budget / Model
                  </span>
                  <h4 className="text-sm font-bold text-foreground">
                    ${(selectedProject.budget || 0).toLocaleString()}
                  </h4>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                    {selectedProject.billingType} Billing
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-card/30 border border-border/50 space-y-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">
                    Timeline Deadline
                  </span>
                  <h4 className="text-sm font-bold text-foreground">
                    {selectedProject.deadline
                      ? new Date(selectedProject.deadline).toLocaleDateString()
                      : 'No deadline declared'}
                  </h4>
                  <p className="text-[10px] text-muted-foreground">
                    Started:{' '}
                    {selectedProject.startDate
                      ? new Date(selectedProject.startDate).toLocaleDateString()
                      : 'TBD'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-5">
              {/* Add Team Member form */}
              <form
                onSubmit={handleAddTeamMember}
                className="p-3.5 rounded-lg border border-border/50 bg-card/30 space-y-3"
              >
                <span className="text-[9px] font-bold text-muted-foreground uppercase block">
                  Assign Team Member
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="Name (e.g. Tony Stark)"
                    value={newTeamUser}
                    onChange={(e) => setNewTeamUser(e.target.value)}
                    className="h-8 text-xs bg-background"
                    required
                  />
                  <select
                    value={newTeamRole}
                    onChange={(e) => setNewTeamRole(e.target.value as any)}
                    className="h-8 rounded border border-input bg-background px-2 text-xs focus:outline-none"
                  >
                    <option value="developer">Developer</option>
                    <option value="project-manager">PM</option>
                    <option value="team-lead">Lead</option>
                    <option value="qa">QA</option>
                    <option value="designer">Designer</option>
                    <option value="devops">DevOps</option>
                  </select>
                  <Input
                    type="number"
                    placeholder="Alloc %"
                    value={newTeamAlloc}
                    onChange={(e) => setNewTeamAlloc(Number(e.target.value) || 100)}
                    className="h-8 text-xs bg-background"
                    min="0"
                    max="100"
                  />
                </div>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  className="w-full h-8 text-[10px]"
                  disabled={isSubmitting}
                >
                  Assign Resource
                </Button>
              </form>

              {/* Team list */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-muted-foreground uppercase block">
                  Active Allocation Feed
                </span>
                {(!selectedProject.teamMembers || selectedProject.teamMembers.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground italic">
                    No team members assigned.
                  </div>
                )}
                {selectedProject.teamMembers?.map((member) => {
                  const totalAlloc = getUserTotalAllocation(member.userName);
                  const isOver = totalAlloc > 100;
                  return (
                    <div
                      key={member._id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        isOver
                          ? 'border-rose-500/30 bg-rose-500/5 shadow-xs ring-1 ring-rose-500/10 animate-pulse'
                          : 'border-border/40 bg-card/25 hover:bg-card/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-[10px] uppercase ${
                            isOver ? 'bg-rose-500/10 text-rose-500' : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {member.userName.charAt(0)}
                        </div>
                        <div className="space-y-0.5 text-left">
                          <div className="flex items-center gap-1.5">
                            <h5 className="font-bold text-foreground">{member.userName}</h5>
                            {isOver && (
                              <span className="text-[8px] font-black bg-rose-500 text-white rounded px-1 uppercase tracking-wider">
                                Overloaded
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">
                            {member.role}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 select-none">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded">
                          {member.allocation}% Alloc
                        </span>
                        <span
                          className={`text-[8px] font-semibold ${isOver ? 'text-rose-500 font-extrabold' : 'text-muted-foreground'}`}
                        >
                          Cross-Project: {totalAlloc}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'milestones' && (
            <div className="space-y-5">
              {/* Add Milestone Form */}
              <form
                onSubmit={handleAddMilestone}
                className="p-3.5 rounded-lg border border-border/50 bg-card/30 space-y-3"
              >
                <span className="text-[9px] font-bold text-muted-foreground uppercase block">
                  Schedule Milestone
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Milestone Title"
                    value={newMilestoneTitle}
                    onChange={(e) => setNewMilestoneTitle(e.target.value)}
                    className="h-8 text-xs bg-background"
                    required
                  />
                  <Input
                    type="date"
                    value={newMilestoneDate}
                    onChange={(e) => setNewMilestoneDate(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>
                <textarea
                  placeholder="Scope parameters..."
                  value={newMilestoneDesc}
                  onChange={(e) => setNewMilestoneDesc(e.target.value)}
                  className="w-full h-12 p-2 rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring text-xs leading-relaxed"
                />

                {/* Milestone dependency and parent mapping */}
                <div className="grid grid-cols-2 gap-2 text-left select-none">
                  <div className="space-y-0.5">
                    <label className="text-[8px] font-black text-muted-foreground uppercase tracking-wide">
                      Depends On (Blocker)
                    </label>
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          if (!newMilestoneDependsOn.includes(val)) {
                            setNewMilestoneDependsOn([...newMilestoneDependsOn, val]);
                          }
                          e.target.value = '';
                        }
                      }}
                      className="w-full h-8 rounded border border-input bg-background px-2 text-xs focus:outline-none font-bold"
                    >
                      <option value="">Select Blocker...</option>
                      {selectedProject.milestones?.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                    {newMilestoneDependsOn.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {newMilestoneDependsOn.map((id) => {
                          const m = selectedProject.milestones?.find((x) => x._id === id);
                          return (
                            <span
                              key={id}
                              onClick={() =>
                                setNewMilestoneDependsOn(
                                  newMilestoneDependsOn.filter((x) => x !== id)
                                )
                              }
                              className="text-[8px] font-black bg-amber-500/15 text-amber-700 border border-amber-500/20 px-1 py-0.5 rounded cursor-pointer hover:bg-rose-500 hover:text-white transition-colors"
                            >
                              {m?.title || id} ×
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[8px] font-black text-muted-foreground uppercase tracking-wide">
                      Parent Milestone
                    </label>
                    <select
                      value={newMilestoneParent}
                      onChange={(e) => setNewMilestoneParent(e.target.value)}
                      className="w-full h-8 rounded border border-input bg-background px-2 text-xs focus:outline-none font-bold"
                    >
                      <option value="">None (Top Level)</option>
                      {selectedProject.milestones?.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  className="w-full h-8 text-[10px]"
                  disabled={isSubmitting}
                >
                  Log Milestone Target
                </Button>
              </form>

              {/* Milestones list */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-muted-foreground uppercase block">
                  Target Milestone Timeline
                </span>
                {(!selectedProject.milestones || selectedProject.milestones.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground italic">
                    No milestones declared.
                  </div>
                )}
                {selectedProject.milestones?.map((milestone) => {
                  const parentMilestone = selectedProject.milestones?.find(
                    (m) => m._id === milestone.parentMilestoneId
                  );
                  const isBlocked = (milestone.dependsOn || []).some((depId: string) => {
                    const dep = selectedProject.milestones?.find((x) => x._id === depId);
                    return dep && dep.status !== 'completed';
                  });

                  return (
                    <div
                      key={milestone._id}
                      className={`p-3 rounded-lg border transition-all ${
                        isBlocked
                          ? 'border-amber-500/30 bg-amber-500/5 shadow-xs ring-1 ring-amber-500/10'
                          : 'border-border/40 bg-card/25 hover:bg-card/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5 text-left">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h5 className="font-bold text-foreground">{milestone.title}</h5>
                            {isBlocked && (
                              <span className="text-[8px] font-black bg-amber-500 text-white rounded px-1.5 uppercase tracking-wider animate-pulse">
                                Blocked
                              </span>
                            )}
                            {parentMilestone && (
                              <span className="text-[8px] font-bold bg-primary/10 text-primary border border-primary/20 rounded px-1.5 uppercase tracking-wide">
                                Sub: {parentMilestone.title}
                              </span>
                            )}
                          </div>
                          {milestone.description && (
                            <p className="text-[10px] text-muted-foreground">
                              {milestone.description}
                            </p>
                          )}
                        </div>
                        <span className="text-[9px] font-mono rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 uppercase font-bold tracking-wide select-none">
                          {milestone.status}
                        </span>
                      </div>

                      {/* Dependencies view */}
                      {(milestone.dependsOn || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2 border-t border-border/20 pt-1.5 select-none">
                          <span className="text-[8px] font-bold text-muted-foreground uppercase">
                            Requires:
                          </span>
                          {(milestone.dependsOn || []).map((depId: string) => {
                            const dep = selectedProject.milestones?.find((x) => x._id === depId);
                            const depMet = dep && dep.status === 'completed';
                            return (
                              <span
                                key={depId}
                                className={`text-[8px] font-mono font-bold px-1.5 py-0.5 border rounded uppercase ${
                                  depMet
                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-600 border-amber-500/20 font-black'
                                }`}
                              >
                                {dep?.title || 'Unknown'} {depMet ? '✓' : '⚠'}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[9px] text-muted-foreground font-mono font-semibold pt-1.5 border-t border-border/10 mt-1.5 select-none">
                        <span>
                          Target:{' '}
                          {milestone.dueDate
                            ? new Date(milestone.dueDate).toLocaleDateString()
                            : 'TBD'}
                        </span>
                        <span>Progress: {milestone.progressPercentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'sprints' && (
            <div className="space-y-5">
              {/* Add Sprint form */}
              <form
                onSubmit={handleAddSprint}
                className="p-3.5 rounded-lg border border-border/50 bg-card/30 space-y-3"
              >
                <span className="text-[9px] font-bold text-muted-foreground uppercase block">
                  Initialize Agile Sprint
                </span>
                <Input
                  placeholder="Sprint Name (e.g. Sprint 1 - Core API)"
                  value={newSprintName}
                  onChange={(e) => setNewSprintName(e.target.value)}
                  className="h-8 text-xs bg-background"
                  required
                />
                <textarea
                  placeholder="Sprint goal / deliverable objective..."
                  value={newSprintGoal}
                  onChange={(e) => setNewSprintGoal(e.target.value)}
                  className="w-full h-12 p-2 rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring text-xs leading-relaxed"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[8px] font-bold text-muted-foreground uppercase">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={newSprintStart}
                      onChange={(e) => setNewSprintStart(e.target.value)}
                      className="h-8 text-xs bg-background"
                      required
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[8px] font-bold text-muted-foreground uppercase">
                      End Date
                    </label>
                    <Input
                      type="date"
                      value={newSprintEnd}
                      onChange={(e) => setNewSprintEnd(e.target.value)}
                      className="h-8 text-xs bg-background"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  className="w-full h-8 text-[10px]"
                  disabled={isSubmitting}
                >
                  Launch Sprint Cycle
                </Button>
              </form>

              {/* Sprints list */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-muted-foreground uppercase block">
                  Agile Sprint Cadence
                </span>
                {(!selectedProject.sprints || selectedProject.sprints.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground italic">
                    No sprint cycles active.
                  </div>
                )}
                {selectedProject.sprints?.map((sprint) => (
                  <div
                    key={sprint._id}
                    className="p-3 rounded-lg border border-border/40 bg-card/25 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-foreground">{sprint.name}</h5>
                      <span className="text-[9px] font-mono rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 uppercase font-bold tracking-wide">
                        {sprint.status}
                      </span>
                    </div>
                    {sprint.goal && (
                      <p className="text-[10px] text-muted-foreground">{sprint.goal}</p>
                    )}
                    <div className="flex items-center justify-between text-[9px] text-muted-foreground font-mono font-semibold">
                      <span>
                        Timeline: {new Date(sprint.startDate).toLocaleDateString()} –{' '}
                        {new Date(sprint.endDate).toLocaleDateString()}
                      </span>
                      {sprint.velocity > 0 && <span>Velocity: {sprint.velocity} pts</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-5">
              {/* Attach Document Form */}
              <form
                onSubmit={handleAddDocument}
                className="p-3.5 rounded-lg border border-border/50 bg-card/30 space-y-3"
              >
                <span className="text-[9px] font-bold text-muted-foreground uppercase block">
                  Attach Project Asset
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Document Name"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    className="h-8 text-xs bg-background"
                    required
                  />
                  <select
                    value={newDocCat}
                    onChange={(e) => setNewDocCat(e.target.value as any)}
                    className="h-8 rounded border border-input bg-background px-2 text-xs focus:outline-none"
                  >
                    <option value="other">Other Asset</option>
                    <option value="requirements">Requirements</option>
                    <option value="design">Design Specs</option>
                    <option value="technical">Technical Architecture</option>
                    <option value="meeting-notes">Meeting Notes</option>
                    <option value="contract">Legal / Contract</option>
                  </select>
                </div>
                <Input
                  placeholder="URL Asset Link (e.g. Google Drive / Figma / GitHub)"
                  value={newDocUrl}
                  onChange={(e) => setNewDocUrl(e.target.value)}
                  className="h-8 text-xs bg-background"
                  required
                />
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  className="w-full h-8 text-[10px]"
                  disabled={isSubmitting}
                >
                  Attach Link Asset
                </Button>
              </form>

              {/* Documents list */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-muted-foreground uppercase block">
                  Repository & Specs Shelf
                </span>
                {(!selectedProject.documents || selectedProject.documents.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground italic">
                    No assets attached.
                  </div>
                )}
                {selectedProject.documents?.map((doc) => (
                  <a
                    key={doc._id}
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card/25 hover:bg-card transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="h-7 w-7 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Paperclip className="h-4 w-4" />
                      </span>
                      <div className="space-y-0.5 min-w-0">
                        <h5 className="font-bold text-foreground truncate">{doc.name}</h5>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                          {doc.category}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'risks' && (
            <div className="space-y-5">
              {/* Log Risk Form */}
              <form
                onSubmit={handleAddRisk}
                className="p-3.5 rounded-lg border border-border/50 bg-card/30 space-y-3"
              >
                <span className="text-[9px] font-bold text-muted-foreground uppercase block">
                  Register Project Risk factor
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Risk Title"
                    value={newRiskTitle}
                    onChange={(e) => setNewRiskTitle(e.target.value)}
                    className="h-8 text-xs bg-background"
                    required
                  />
                  <select
                    value={newRiskSeverity}
                    onChange={(e) => setNewRiskSeverity(e.target.value as any)}
                    className="h-8 rounded border border-input bg-background px-2 text-xs focus:outline-none"
                  >
                    <option value="low">Low Severity</option>
                    <option value="medium">Medium Severity</option>
                    <option value="high">High Severity</option>
                    <option value="critical">CRITICAL SEVERITY</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 text-left">
                  <div className="space-y-0.5">
                    <label className="text-[8px] font-black text-muted-foreground uppercase tracking-wide">
                      Risk Category
                    </label>
                    <select
                      value={newRiskCategory}
                      onChange={(e) => setNewRiskCategory(e.target.value as any)}
                      className="w-full h-8 rounded border border-input bg-background px-2 text-xs focus:outline-none font-bold"
                    >
                      <option value="technical">Technical Architecture</option>
                      <option value="staffing">Staffing / Resources</option>
                      <option value="financial">Financial / Budgetary</option>
                      <option value="timeline">Timeline / Deadlines</option>
                      <option value="dependency">External Dependencies</option>
                      <option value="operational">Operational Systems</option>
                    </select>
                  </div>
                  <div className="space-y-0.5 flex flex-col justify-end">
                    <div className="p-1 rounded bg-primary/10 border border-primary/20 text-center select-none">
                      <span className="text-[7px] font-black uppercase text-muted-foreground block leading-none mb-0.5">
                        Live Threat Score
                      </span>
                      <span className="text-xs font-black text-primary font-mono leading-none">
                        {newRiskProbability * newRiskImpact}{' '}
                        <span className="text-[8px] font-bold text-muted-foreground font-sans">
                          ({newRiskProbability} × {newRiskImpact})
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5 select-none text-left">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[8px] font-bold text-muted-foreground uppercase">
                      <span>Probability</span>
                      <span className="font-mono text-primary">{newRiskProbability} / 5</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={newRiskProbability}
                      onChange={(e) => setNewRiskProbability(Number(e.target.value))}
                      className="w-full accent-primary cursor-pointer h-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[8px] font-bold text-muted-foreground uppercase">
                      <span>Impact</span>
                      <span className="font-mono text-primary">{newRiskImpact} / 5</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={newRiskImpact}
                      onChange={(e) => setNewRiskImpact(Number(e.target.value))}
                      className="w-full accent-primary cursor-pointer h-1"
                    />
                  </div>
                </div>

                <textarea
                  placeholder="Detailed mitigation strategy..."
                  value={newRiskMitigation}
                  onChange={(e) => setNewRiskMitigation(e.target.value)}
                  className="w-full h-12 p-2 rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring text-xs leading-relaxed"
                />
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  className="w-full h-8 text-[10px]"
                  disabled={isSubmitting}
                >
                  Register Risk Threat
                </Button>
              </form>

              {/* Risks list */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-muted-foreground uppercase block">
                  Risk Threat Registry
                </span>
                {(!selectedProject.risks || selectedProject.risks.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground italic">
                    No threats registered.
                  </div>
                )}
                {selectedProject.risks?.map((risk) => {
                  const prob = risk.probability || 3;
                  const imp = risk.impact || 3;
                  const score = prob * imp;

                  // Color levels
                  let badgeColor = 'bg-blue-500/10 text-blue-500 border-blue-500/20';
                  if (score >= 15) {
                    badgeColor =
                      'bg-rose-500 text-white border-rose-500/20 animate-pulse font-black';
                  } else if (score >= 10) {
                    badgeColor = 'bg-rose-500/10 text-rose-500 border-rose-500/20 font-black';
                  } else if (score >= 4) {
                    badgeColor = 'bg-amber-500/10 text-amber-500 border-amber-500/20 font-black';
                  }

                  return (
                    <div
                      key={risk._id}
                      className="p-3 rounded-lg border border-border/40 bg-card/25 space-y-2 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h5 className="font-bold text-foreground">{risk.title}</h5>
                            <span className="text-[8px] font-black uppercase bg-card/50 text-muted-foreground border border-border px-1.5 py-0.5 rounded leading-none">
                              {risk.category || 'technical'}
                            </span>
                          </div>
                          {risk.description && (
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                              {risk.description}
                            </p>
                          )}
                        </div>
                        <span
                          className={`text-[9px] font-mono rounded px-2 py-0.5 uppercase font-bold tracking-wide border select-none ${badgeColor}`}
                        >
                          TS: {score} ({risk.severity})
                        </span>
                      </div>
                      {risk.mitigation && (
                        <div className="text-[10px] text-muted-foreground bg-popover/40 p-2 rounded border border-border/20 text-left">
                          <span className="text-[8px] font-black text-primary uppercase block tracking-wider leading-none mb-1">
                            Mitigation Strategy:
                          </span>
                          <p className="leading-relaxed">{risk.mitigation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <span className="text-[9px] font-bold text-muted-foreground uppercase block">
                Audit Lifecycle Trail
              </span>
              {timelineEvents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground italic">
                  No lifecycle events recorded.
                </div>
              ) : (
                <div className="relative border-l border-border/50 ml-2.5 pl-4 space-y-4">
                  {timelineEvents.map((evt) => (
                    <div key={evt._id} className="relative space-y-0.5">
                      <span className="absolute -left-[20.5px] top-1 h-2.5 w-2.5 rounded-full bg-primary border-2 border-popover" />
                      <h5 className="font-bold text-foreground text-xs leading-none">
                        {evt.title}
                      </h5>
                      {evt.description && (
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          {evt.description}
                        </p>
                      )}
                      <p className="text-[9px] font-mono text-muted-foreground/60">
                        {evt.userName} • {new Date(evt.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
