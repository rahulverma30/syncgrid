'use client';

import React, { useEffect, useState } from 'react';
import { Select } from '@/components/ui';
import { useTasksStore } from '@/store/tasksStore';
import { TaskCreateModal } from '@/components/tasks/TaskCreateModal';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { TaskBoard } from '@/components/tasks/TaskBoard';
import { TaskTable } from '@/components/tasks/TaskTable';
import { TaskDashboard } from '@/components/tasks/TaskDashboard';
import { WorkloadBalance } from '@/components/tasks/WorkloadBalance';
import { AutomationRules } from '@/components/tasks/AutomationRules';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Kanban,
  List,
  BarChart3,
  Users,
  Settings,
  Plus,
  Play,
  StopCircle,
  Database,
  Search,
  Filter,
} from 'lucide-react';

export default function TasksPage() {
  const {
    tasks,
    fetchTasks,
    fetchStatuses,
    fetchLabels,
    filters,
    setFilters,
    resetFilters,
    seedDemoData,
    isLoading,
    runningTimer,
    stopTimer,
    connectRealtime,
  } = useTasksStore();

  const [activeTab, setActiveTab] = useState<
    'board' | 'list' | 'workload' | 'metrics' | 'settings'
  >('board');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTaskCode, setSelectedTaskCode] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);

  // Fetch initial workspace data
  useEffect(() => {
    fetchStatuses();
    fetchLabels();
    fetchTasks();

    // Establish Realtime SSE Gateway Connection
    const disconnect = connectRealtime(filters.projectId || undefined);

    // Fetch projects for filters
    fetch('/api/protected/projects')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setProjects(result.data);
      })
      .catch((err) => console.error(err));

    // Restore running timer from localStorage if any
    const localTimer = localStorage.getItem('syncgrid_running_timer');
    if (localTimer) {
      try {
        const parsed = JSON.parse(localTimer);
        useTasksStore.setState({ runningTimer: parsed });
      } catch (e) {
        console.error('Failed to parse running timer:', e);
      }
    }

    return () => {
      disconnect();
    };
  }, [fetchStatuses, fetchLabels, fetchTasks, connectRealtime, filters.projectId]);

  const handleSeedWorkspace = async () => {
    toast.promise(seedDemoData(), {
      loading: 'Bootstrapping complete agile execution workspace...',
      success:
        'Workspace successfully seeded with realistic multi-user tasks, blockers, and timetables!',
      error: 'Failed to seed workspace.',
    });
  };

  const handleSelectTask = (code: string) => {
    setSelectedTaskCode(code);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Active Running Timer Banner Alert */}
      {runningTimer && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 border border-emerald-500 text-white px-4 py-3 rounded-xl flex items-center justify-between shadow-lg animate-pulse select-none">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <span className="text-xs font-bold font-sans uppercase tracking-wider">
              Active stopwatch running
            </span>
            <span className="text-xs font-semibold opacity-90">
              You are currently logging work in the background on task.
            </span>
          </div>

          <Button
            size="sm"
            onClick={async () => {
              await stopTimer(runningTimer.taskId, 'Completed background tracking', true);
              toast.success('Live tracked time logged successfully!');
            }}
            className="bg-white text-emerald-700 hover:bg-white/95 text-xs font-bold gap-1.5"
          >
            <StopCircle className="w-4 h-4 fill-emerald-700" /> Stop Timer & Log
          </Button>
        </div>
      )}

      {/* Header and Title Control panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground select-none">
            Agile Execution Workspace
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 select-none">
            Manage agency sprints, nested checklists, resource capacities, and workflow automation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={handleSeedWorkspace}
            className="text-xs font-bold gap-1.5 text-muted-foreground hover:text-foreground border-dashed"
            isLoading={isLoading}
          >
            <Database className="w-3.5 h-3.5" /> Seed Workspace
          </Button>

          <Button onClick={() => setIsCreateOpen(true)} className="text-xs font-bold gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Create Task
          </Button>
        </div>
      </div>

      {/* Navigation Tabs and Global Search Filters */}
      <div className="flex flex-col gap-4 bg-muted/5 border border-border/30 rounded-xl p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tabs switch */}
          <div className="flex bg-muted/10 p-1.5 rounded-lg border border-border/20 text-xs font-bold w-fit select-none">
            <button
              onClick={() => setActiveTab('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition ${
                activeTab === 'board'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" /> Board View
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition ${
                activeTab === 'list'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="w-3.5 h-3.5" /> Grid List
            </button>
            <button
              onClick={() => setActiveTab('workload')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition ${
                activeTab === 'workload'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Capacity Workload
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition ${
                activeTab === 'metrics'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Metrics Dashboard
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition ${
                activeTab === 'settings'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Settings className="w-3.5 h-3.5" /> Automation Rules
            </button>
          </div>

          {/* Search filters */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-60">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search code, title..."
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                className="h-9 pl-8 text-xs bg-background"
              />
            </div>
          </div>
        </div>

        {/* Centralised filter selects */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-border/10">
          {/* Project filter */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-muted-foreground uppercase">
              Project Filter
            </label>
            <Select
              value={filters.projectId || ''}
              onChange={(val) => setFilters({ projectId: val })}
              placeholder="All Projects"
              options={[
                { value: '', label: 'All Projects' },
                ...projects.map((p) => ({
                  value: p._id,
                  label: p.name,
                })),
              ]}
            />
          </div>

          {/* Priority filter */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-muted-foreground uppercase">
              Priority Filter
            </label>
            <Select
              value={filters.priority || ''}
              onChange={(val) => setFilters({ priority: val })}
              placeholder="All Priorities"
              options={[
                { value: '', label: 'All Priorities' },
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
              ]}
            />
          </div>

          {/* Severity filter */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-muted-foreground uppercase">
              Severity Filter
            </label>
            <Select
              value={filters.severity || ''}
              onChange={(val) => setFilters({ severity: val })}
              placeholder="All Severities"
              options={[
                { value: '', label: 'All Severities' },
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'critical', label: 'Critical' },
              ]}
            />
          </div>

          {/* Reset Filters */}
          <div className="flex items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="w-full h-8 text-[10px] font-bold text-muted-foreground hover:text-foreground"
            >
              Clear Workspace Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Main Tab View */}
      <div className="transition-all duration-200">
        {activeTab === 'board' && <TaskBoard onSelectTask={handleSelectTask} />}
        {activeTab === 'list' && <TaskTable onSelectTask={handleSelectTask} />}
        {activeTab === 'workload' && <WorkloadBalance />}
        {activeTab === 'metrics' && <TaskDashboard />}
        {activeTab === 'settings' && <AutomationRules />}
      </div>

      {/* Modals and Drawers layer */}
      <TaskCreateModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      {selectedTaskCode && (
        <TaskDetailModal
          isOpen={!!selectedTaskCode}
          onClose={() => setSelectedTaskCode(null)}
          taskCode={selectedTaskCode}
        />
      )}
    </div>
  );
}
