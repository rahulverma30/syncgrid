import { create } from 'zustand';
import { toast } from 'sonner';

export interface SavedFilterPreset {
  name: string;
  searchQuery: string;
  typeFilter: string;
  onboardingFilter: string;
  retentionFilter: string;
  managerFilter: string;
  selectedTags: string[];
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  columnVisibility: Record<string, boolean>;
}

export interface ClientAccount {
  _id: string;
  name: string;
  clientType: 'VIP' | 'Enterprise' | 'Startup' | 'High Value' | 'Retainer' | 'Inactive';
  industry: string;
  emails: string[];
  phones: string[];
  address: string;
  timezone: string;
  website: string;
  socialLinks: Record<string, string>;
  companySize: '1-10' | '11-50' | '51-200' | '201+';
  revenueContribution: number;
  accountManager: string;
  onboardingStatus: 'pending' | 'in-progress' | 'completed';
  retentionStatus: 'retained' | 'churn-risk' | 'churned';
  healthScore: number;
  customFields: Record<string, string>;
  tags: string[];
  isArchived: boolean;
  contacts: Array<{
    _id: string;
    name: string;
    role: string;
    email: string;
    phone: string;
    isPrimary: boolean;
    communicationPref: 'email' | 'phone' | 'slack' | 'zoom';
  }>;
  notes: Array<{
    _id: string;
    content: string;
    createdByName: string;
    isPinned: boolean;
    isPrivate: boolean;
    createdAt: string;
    editHistory?: Array<{
      content: string;
      editedBy: string;
      editedAt: string;
    }>;
  }>;
  documents: Array<{
    _id: string;
    name: string;
    category: 'contract' | 'proposal' | 'NDA' | 'invoice' | 'onboarding' | 'legal';
    url: string;
    size: number;
    uploadedBy: string;
    createdAt: string;
  }>;
  contracts: Array<{
    _id: string;
    title: string;
    value: number;
    startDate?: string;
    endDate?: string;
    status: 'active' | 'expired' | 'renewal-pending';
  }>;
  meetings: Array<{
    _id: string;
    title: string;
    dueDate: string;
    attendees: string[];
    notes?: string;
    isCompleted: boolean;
  }>;
  communicationLogs: Array<{
    _id: string;
    type: 'call' | 'email' | 'meeting' | 'other';
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
}

interface ClientsState {
  // Data States
  clients: ClientAccount[];
  isLoading: boolean;
  error: string | null;

  // Orchestration States
  selectedClient: ClientAccount | null;
  activeTab: string; // Detail drawer tab ('overview', 'contacts', etc.)
  activeSection: 'analytics' | 'ledger'; // Main workspace layout toggle
  createModalOpen: boolean;

  // Search & Filter States
  searchQuery: string;
  typeFilter: string;
  onboardingFilter: string;
  retentionFilter: string;
  managerFilter: string;
  selectedTags: string[];
  isArchivedFilter: boolean;

  // Saved Filters Preset list
  savedFilters: SavedFilterPreset[];
  activePresetName: string;

  // Table States (Sorting, Pagination, Column Visibility)
  sortColumn: keyof ClientAccount | 'createdDate' | '';
  sortDirection: 'asc' | 'desc';
  currentPage: number;
  pageSize: number;
  columnVisibility: Record<string, boolean>;

  // Actions
  fetchClients: () => Promise<void>;
  setSelectedClient: (client: ClientAccount | null) => void;
  setActiveTab: (tab: string) => void;
  setActiveSection: (section: 'analytics' | 'ledger') => void;
  setCreateModalOpen: (open: boolean) => void;

  // Filter Actions
  setFilters: (
    filters: Partial<
      Pick<
        ClientsState,
        | 'searchQuery'
        | 'typeFilter'
        | 'onboardingFilter'
        | 'retentionFilter'
        | 'managerFilter'
        | 'selectedTags'
        | 'isArchivedFilter'
      >
    >
  ) => void;
  resetFilters: () => void;

  // Presets Actions
  saveFilterPreset: (name: string) => void;
  loadFilterPreset: (name: string) => void;
  deleteFilterPreset: (name: string) => void;

  // Table Actions
  setSort: (column: keyof ClientAccount | 'createdDate') => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  toggleColumnVisibility: (colName: string) => void;

  // Operations
  archiveClient: (id: string, archiveState: boolean) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  updateClientManager: (id: string, manager: string) => Promise<void>;
  bulkUpdateManager: (ids: string[], manager: string) => Promise<void>;
}

export const useClientsStore = create<ClientsState>((set, get) => {
  // Safe load presets from LocalStorage on init
  const loadInitialPresets = (): SavedFilterPreset[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem('syncgrid_saved_filters_preset');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  return {
    clients: [],
    isLoading: false,
    error: null,

    selectedClient: null,
    activeTab: 'overview',
    activeSection: 'analytics',
    createModalOpen: false,

    searchQuery: '',
    typeFilter: '',
    onboardingFilter: '',
    retentionFilter: '',
    managerFilter: '',
    selectedTags: [],
    isArchivedFilter: false,

    savedFilters: loadInitialPresets(),
    activePresetName: '',

    sortColumn: 'revenueContribution',
    sortDirection: 'desc',
    currentPage: 1,
    pageSize: 10,
    columnVisibility: {
      'Client Company': true,
      Classification: true,
      Industry: true,
      'Account Owner': true,
      'Health Index': true,
      'ARR Yield': true,
      Tags: true,
    },

    fetchClients: async () => {
      set({ isLoading: true, error: null });
      try {
        const {
          searchQuery,
          typeFilter,
          onboardingFilter,
          retentionFilter,
          managerFilter,
          selectedTags,
          isArchivedFilter,
        } = get();
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (typeFilter) params.append('clientType', typeFilter);
        if (onboardingFilter) params.append('onboardingStatus', onboardingFilter);
        if (retentionFilter) params.append('retentionStatus', retentionFilter);
        if (managerFilter) params.append('accountManager', managerFilter);
        if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));
        params.append('isArchived', isArchivedFilter ? 'true' : 'false');

        const res = await fetch(`/api/protected/clients?${params.toString()}`);
        const d = await res.json();
        if (d.success) {
          set({ clients: d.data, currentPage: 1 }); // reset page on refetch
          // If drawer has a client, refresh drawer content as well
          const selected = get().selectedClient;
          if (selected) {
            const fresh = d.data.find((c: ClientAccount) => c._id === selected._id);
            if (fresh) {
              set({ selectedClient: fresh });
            }
          }
        } else {
          set({ error: d.message || 'Failed to query dynamic customer vault.' });
        }
      } catch (e: any) {
        set({ error: e.message || 'DB connection offline. Cache failure.' });
      } finally {
        set({ isLoading: false });
      }
    },

    setSelectedClient: (client) => {
      set({ selectedClient: client, activeTab: 'overview' });
    },

    setActiveTab: (tab) => set({ activeTab: tab }),
    setActiveSection: (section) => set({ activeSection: section }),
    setCreateModalOpen: (open) => set({ createModalOpen: open }),

    setFilters: (filters) => {
      set(filters);
      get().fetchClients();
    },

    resetFilters: () => {
      set({
        searchQuery: '',
        typeFilter: '',
        onboardingFilter: '',
        retentionFilter: '',
        managerFilter: '',
        selectedTags: [],
        isArchivedFilter: false,
        activePresetName: '',
        currentPage: 1,
      });
      get().fetchClients();
    },

    saveFilterPreset: (name) => {
      if (!name) return;
      const {
        searchQuery,
        typeFilter,
        onboardingFilter,
        retentionFilter,
        managerFilter,
        selectedTags,
        sortColumn,
        sortDirection,
        columnVisibility,
        savedFilters,
      } = get();

      const newPreset: SavedFilterPreset = {
        name,
        searchQuery,
        typeFilter,
        onboardingFilter,
        retentionFilter,
        managerFilter,
        selectedTags,
        sortColumn: String(sortColumn),
        sortDirection,
        columnVisibility,
      };

      const updated = [...savedFilters.filter((p) => p.name !== name), newPreset];
      set({ savedFilters: updated, activePresetName: name });
      localStorage.setItem('syncgrid_saved_filters_preset', JSON.stringify(updated));
      toast.success(`Search filter preset "${name}" saved!`);
    },

    loadFilterPreset: (name) => {
      const preset = get().savedFilters.find((p) => p.name === name);
      if (!preset) return;

      set({
        searchQuery: preset.searchQuery,
        typeFilter: preset.typeFilter,
        onboardingFilter: preset.onboardingFilter,
        retentionFilter: preset.retentionFilter,
        managerFilter: preset.managerFilter,
        selectedTags: preset.selectedTags,
        sortColumn: preset.sortColumn as any,
        sortDirection: preset.sortDirection,
        columnVisibility: preset.columnVisibility,
        activePresetName: name,
        currentPage: 1,
      });
      get().fetchClients();
      toast.success(`Filter Preset "${name}" applied!`);
    },

    deleteFilterPreset: (name) => {
      const updated = get().savedFilters.filter((p) => p.name !== name);
      set({
        savedFilters: updated,
        activePresetName: get().activePresetName === name ? '' : get().activePresetName,
      });
      localStorage.setItem('syncgrid_saved_filters_preset', JSON.stringify(updated));
      toast.success(`Preset "${name}" deleted.`);
    },

    setSort: (column) => {
      const { sortColumn, sortDirection } = get();
      if (sortColumn === column) {
        set({ sortDirection: sortDirection === 'asc' ? 'desc' : 'asc' });
      } else {
        set({ sortColumn: column, sortDirection: 'desc' });
      }
    },

    setPage: (page) => set({ currentPage: page }),
    setPageSize: (size) => set({ pageSize: size, currentPage: 1 }),

    toggleColumnVisibility: (colName) => {
      const { columnVisibility } = get();
      set({
        columnVisibility: {
          ...columnVisibility,
          [colName]: !columnVisibility[colName],
        },
      });
    },

    archiveClient: async (id, archiveState) => {
      try {
        const res = await fetch(`/api/protected/clients/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isArchived: archiveState }),
        });
        const d = await res.json();
        if (d.success) {
          toast.success(
            archiveState ? 'Client archived successfully.' : 'Client restored successfully.'
          );
          get().fetchClients();
          if (get().selectedClient?._id === id) {
            set({ selectedClient: null });
          }
        } else {
          toast.error(d.message || 'Operation failed.');
        }
      } catch (e) {
        toast.error('Connection failure during client state sync.');
      }
    },

    deleteClient: async (id) => {
      try {
        const res = await fetch(`/api/protected/clients/${id}`, { method: 'DELETE' });
        const d = await res.json();
        if (d.success) {
          toast.success('Client profile permanently purged from core ERP ledger.');
          get().fetchClients();
          if (get().selectedClient?._id === id) {
            set({ selectedClient: null });
          }
        } else {
          toast.error(d.message || 'Delete operation unauthorized.');
        }
      } catch (e) {
        toast.error('Connection failure during database delete action.');
      }
    },

    updateClientManager: async (id, manager) => {
      try {
        const res = await fetch(`/api/protected/clients/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountManager: manager }),
        });
        const d = await res.json();
        if (d.success) {
          toast.success(`Account reassigned to ${manager}`);
          get().fetchClients();
        } else {
          toast.error(d.message || 'Reassignment failure.');
        }
      } catch (e) {
        toast.error('Reassignment communication failure.');
      }
    },

    bulkUpdateManager: async (ids, manager) => {
      try {
        const res = await fetch('/api/protected/clients', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids, accountManager: manager }),
        });
        const d = await res.json();
        if (d.success) {
          toast.success(
            `Successfully batch reassigned ${ids.length} corporate accounts to ${manager}.`
          );
          get().fetchClients();
        } else {
          toast.error(d.message || 'Batch reassignment failed.');
        }
      } catch (e) {
        toast.error('Connection failure during batch reassignments.');
      }
    },
  };
});
