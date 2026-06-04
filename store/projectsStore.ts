import { create } from 'zustand';
import { toast } from 'sonner';
import { socketGateway } from '@/lib/socketGateway';

export interface SavedProjectFilterPreset {
  name: string;
  searchQuery: string;
  statusFilter: string;
  priorityFilter: string;
  managerFilter: string;
  riskFilter: string;
  billingFilter: string;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  columnVisibility: Record<string, boolean>;
}

export interface ProjectAccount {
  _id: string;
  name: string;
  code: string;
  description: string;
  clientId?: string;
  leadId?: string;
  status:
    | 'planning'
    | 'design'
    | 'development'
    | 'testing'
    | 'deployment'
    | 'completed'
    | 'on-hold'
    | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  projectManager: string;
  budget: number;
  billingType: 'fixed' | 'hourly' | 'retainer' | 'milestone-based';
  billingRate: number;
  estimatedHours: number;
  actualHours: number;
  startDate?: string;
  deadline?: string;
  deliveryDate?: string;
  technologies: string[];
  repositoryLinks: string[];
  stagingUrl: string;
  liveUrl: string;
  healthScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  progressPercentage: number;
  tags: string[];
  customFields: Record<string, string>;
  isArchived: boolean;
  teamMembers: Array<{
    _id: string;
    userName: string;
    role: 'project-manager' | 'team-lead' | 'developer' | 'qa' | 'designer' | 'devops' | 'other';
    allocation: number;
    joinedAt: string;
  }>;
  milestones: Array<{
    _id: string;
    title: string;
    description: string;
    dueDate?: string;
    completedDate?: string;
    status: 'pending' | 'in-progress' | 'completed' | 'overdue';
    progressPercentage: number;
    dependsOn?: string[];
    parentMilestoneId?: string;
  }>;
  sprints: Array<{
    _id: string;
    name: string;
    goal: string;
    startDate: string;
    endDate: string;
    status: 'planning' | 'active' | 'completed' | 'cancelled';
    velocity: number;
    retrospective?: string;
  }>;
  risks: Array<{
    _id: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'mitigated' | 'resolved' | 'escalated';
    mitigation: string;
    reportedBy: string;
    createdAt: string;
    category?: string;
    probability?: number;
    impact?: number;
  }>;
  documents: Array<{
    _id: string;
    name: string;
    category: 'requirements' | 'design' | 'technical' | 'meeting-notes' | 'contract' | 'other';
    url: string;
    size: number;
    uploadedBy: string;
    createdAt: string;
  }>;
  communicationLogs: Array<{
    _id: string;
    type: 'standup' | 'review' | 'retrospective' | 'client-call' | 'internal' | 'other';
    summary: string;
    loggedBy: string;
    createdAt: string;
  }>;
  timeline: Array<{
    _id: string;
    type: string;
    title: string;
    description?: string;
    userName?: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  metrics?: {
    totalTasks: number;
    completedTasks: number;
    remainingTasks: number;
    overdueTasks: number;
    progressPercentage: number;
  };
}

interface ProjectsState {
  // Data
  projects: ProjectAccount[];
  allocations: any[];
  isLoading: boolean;
  error: string | null;

  // Orchestration
  selectedProject: ProjectAccount | null;
  activeTab: string;
  activeSection: 'analytics' | 'ledger';
  createModalOpen: boolean;

  // Search & Filters
  searchQuery: string;
  statusFilter: string;
  priorityFilter: string;
  managerFilter: string;
  riskFilter: string;
  billingFilter: string;
  isArchivedFilter: boolean;

  // Saved Presets
  savedFilters: SavedProjectFilterPreset[];
  activePresetName: string;

  // Table
  sortColumn: keyof ProjectAccount | 'createdDate' | '';
  sortDirection: 'asc' | 'desc';
  currentPage: number;
  pageSize: number;
  columnVisibility: Record<string, boolean>;

  // Actions
  fetchProjects: () => Promise<void>;
  fetchAllocations: () => Promise<void>;
  setSelectedProject: (project: ProjectAccount | null) => void;
  setActiveTab: (tab: string) => void;
  setActiveSection: (section: 'analytics' | 'ledger') => void;
  setCreateModalOpen: (open: boolean) => void;

  // Filter Actions
  setFilters: (
    filters: Partial<
      Pick<
        ProjectsState,
        | 'searchQuery'
        | 'statusFilter'
        | 'priorityFilter'
        | 'managerFilter'
        | 'riskFilter'
        | 'billingFilter'
        | 'isArchivedFilter'
      >
    >
  ) => void;
  resetFilters: () => void;

  // Presets
  saveFilterPreset: (name: string) => void;
  loadFilterPreset: (name: string) => void;
  deleteFilterPreset: (name: string) => void;

  // Table Actions
  setSort: (column: keyof ProjectAccount | 'createdDate') => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  toggleColumnVisibility: (colName: string) => void;

  // Operations
  archiveProject: (id: string, archiveState: boolean) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string, name: string, options: any) => Promise<boolean>;
  executeBulkAction: (action: string, value: any, projectIds: string[]) => Promise<boolean>;
}

const DEFAULT_COLUMNS: Record<string, boolean> = {
  'Project Name': true,
  Status: true,
  Priority: true,
  'Project Manager': true,
  'Health Score': true,
  Budget: true,
  Deadline: true,
  Tags: true,
};

export const useProjectsStore = create<ProjectsState>((set, get) => {
  const loadInitialPresets = (): SavedProjectFilterPreset[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem('syncgrid_project_filter_presets');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  return {
    projects: [],
    allocations: [],
    isLoading: false,
    error: null,

    selectedProject: null,
    activeTab: 'overview',
    activeSection: 'analytics',
    createModalOpen: false,

    searchQuery: '',
    statusFilter: '',
    priorityFilter: '',
    managerFilter: '',
    riskFilter: '',
    billingFilter: '',
    isArchivedFilter: false,

    savedFilters: loadInitialPresets(),
    activePresetName: '',

    sortColumn: '',
    sortDirection: 'asc',
    currentPage: 1,
    pageSize: 10,
    columnVisibility: { ...DEFAULT_COLUMNS },

    fetchProjects: async () => {
      set({ isLoading: true, error: null });
      try {
        const state = get();
        const params = new URLSearchParams();
        if (state.searchQuery) params.set('search', state.searchQuery);
        if (state.statusFilter) params.set('status', state.statusFilter);
        if (state.priorityFilter) params.set('priority', state.priorityFilter);
        if (state.managerFilter) params.set('projectManager', state.managerFilter);
        if (state.riskFilter) params.set('riskLevel', state.riskFilter);
        if (state.billingFilter) params.set('billingType', state.billingFilter);
        params.set('isArchived', String(state.isArchivedFilter));

        const res = await fetch(`/api/protected/projects?${params.toString()}`);
        const data = await res.json();

        if (data.success) {
          set({ projects: data.data, isLoading: false });
          // Background aggregate sync
          get().fetchAllocations();

          // Connect simulated socket gateway with companyId presence channel
          if (data.data && data.data.length > 0) {
            const compId = data.data[0].companyId;
            if (compId) {
              socketGateway.connect(compId);
            }
          }
        } else {
          set({ error: data.message, isLoading: false });
          toast.error(data.message || 'Failed to fetch projects.');
        }
      } catch (e: any) {
        set({ error: e.message, isLoading: false });
        toast.error('Network error fetching projects.');
      }
    },

    fetchAllocations: async () => {
      try {
        const res = await fetch('/api/protected/projects/allocations');
        const data = await res.json();
        if (data.success) {
          set({ allocations: data.data });
        }
      } catch (e) {
        console.error('Error fetching allocations:', e);
      }
    },

    setSelectedProject: (project) => set({ selectedProject: project, activeTab: 'overview' }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    setActiveSection: (section) => set({ activeSection: section }),
    setCreateModalOpen: (open) => set({ createModalOpen: open }),

    setFilters: (filters) => set({ ...filters, currentPage: 1 }),
    resetFilters: () =>
      set({
        searchQuery: '',
        statusFilter: '',
        priorityFilter: '',
        managerFilter: '',
        riskFilter: '',
        billingFilter: '',
        isArchivedFilter: false,
        currentPage: 1,
        activePresetName: '',
      }),

    saveFilterPreset: (name) => {
      const state = get();
      const preset: SavedProjectFilterPreset = {
        name,
        searchQuery: state.searchQuery,
        statusFilter: state.statusFilter,
        priorityFilter: state.priorityFilter,
        managerFilter: state.managerFilter,
        riskFilter: state.riskFilter,
        billingFilter: state.billingFilter,
        sortColumn: state.sortColumn as string,
        sortDirection: state.sortDirection,
        columnVisibility: { ...state.columnVisibility },
      };
      const updated = [...state.savedFilters.filter((p) => p.name !== name), preset];
      set({ savedFilters: updated, activePresetName: name });
      try {
        localStorage.setItem('syncgrid_project_filter_presets', JSON.stringify(updated));
      } catch {}
      toast.success(`Project view "${name}" saved!`);
    },

    loadFilterPreset: (name) => {
      const preset = get().savedFilters.find((p) => p.name === name);
      if (!preset) return;
      set({
        searchQuery: preset.searchQuery,
        statusFilter: preset.statusFilter,
        priorityFilter: preset.priorityFilter,
        managerFilter: preset.managerFilter,
        riskFilter: preset.riskFilter,
        billingFilter: preset.billingFilter,
        sortColumn: (preset.sortColumn as any) || '',
        sortDirection: preset.sortDirection,
        columnVisibility: { ...preset.columnVisibility },
        activePresetName: name,
        currentPage: 1,
      });
    },

    deleteFilterPreset: (name) => {
      const updated = get().savedFilters.filter((p) => p.name !== name);
      set({
        savedFilters: updated,
        activePresetName: get().activePresetName === name ? '' : get().activePresetName,
      });
      try {
        localStorage.setItem('syncgrid_project_filter_presets', JSON.stringify(updated));
      } catch {}
      toast.success(`Project view "${name}" deleted.`);
    },

    setSort: (column) => {
      const state = get();
      if (state.sortColumn === column) {
        set({ sortDirection: state.sortDirection === 'asc' ? 'desc' : 'asc' });
      } else {
        set({ sortColumn: column, sortDirection: 'asc' });
      }
    },

    setPage: (page) => set({ currentPage: page }),
    setPageSize: (size) => set({ pageSize: size, currentPage: 1 }),
    toggleColumnVisibility: (colName) => {
      const current = get().columnVisibility;
      set({ columnVisibility: { ...current, [colName]: !current[colName] } });
    },

    archiveProject: async (id, archiveState) => {
      try {
        const res = await fetch(`/api/protected/projects/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isArchived: archiveState }),
        });
        const d = await res.json();
        if (d.success) {
          toast.success(archiveState ? 'Project archived.' : 'Project restored.');
          get().fetchProjects();
        } else {
          toast.error('Failed to update project.');
        }
      } catch {
        toast.error('Network error.');
      }
    },

    deleteProject: async (id) => {
      try {
        const res = await fetch(`/api/protected/projects/${id}`, { method: 'DELETE' });
        const d = await res.json();
        if (d.success) {
          toast.success('Project permanently deleted.');
          get().fetchProjects();
        } else {
          toast.error('Failed to delete project.');
        }
      } catch {
        toast.error('Network error.');
      }
    },

    duplicateProject: async (id, name, options) => {
      try {
        const res = await fetch(`/api/protected/projects/${id}/duplicate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, ...options }),
        });
        const d = await res.json();
        if (d.success) {
          toast.success('Project cloned successfully.');
          get().fetchProjects();
          return true;
        } else {
          toast.error(d.message || 'Duplication failed.');
          return false;
        }
      } catch {
        toast.error('Network error duplicating project.');
        return false;
      }
    },

    executeBulkAction: async (action, value, projectIds) => {
      // Optimistic update for UI feel
      const originalProjects = get().projects;
      if (
        action === 'status' ||
        action === 'priority' ||
        action === 'archive' ||
        action === 'manager'
      ) {
        const updated = originalProjects.map((p) => {
          if (projectIds.includes(p._id)) {
            const clone = { ...p };
            if (action === 'status') clone.status = value;
            if (action === 'priority') clone.priority = value;
            if (action === 'archive') clone.isArchived = true;
            if (action === 'manager') clone.projectManager = value;
            return clone;
          }
          return p;
        });
        set({ projects: updated });
      }

      try {
        const res = await fetch('/api/protected/projects/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectIds, action, value }),
        });
        const d = await res.json();
        if (d.success) {
          toast.success(d.message || 'Bulk operation completed.');
          get().fetchProjects();
          return true;
        } else {
          set({ projects: originalProjects }); // revert on failure
          toast.error(d.message || 'Bulk operation failed.');
          return false;
        }
      } catch {
        set({ projects: originalProjects }); // revert
        toast.error('Network error applying bulk actions.');
        return false;
      }
    },
  };
});
