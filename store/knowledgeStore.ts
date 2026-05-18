import { create } from 'zustand';
import { toast } from 'sonner';

interface KnowledgeState {
  spaces: any[];
  categories: any[];
  documents: any[];
  activeSpaceId: string | null;
  activeDocument: any | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  searchResults: any[];
  analytics: any | null;
  isSopFilter: boolean;
  isTemplateFilter: boolean;

  // Actions
  fetchSpaces: () => Promise<void>;
  createSpace: (spaceData: any) => Promise<boolean>;
  fetchCategories: () => Promise<void>;
  createCategory: (categoryData: any) => Promise<boolean>;
  fetchDocuments: (spaceId?: string) => Promise<void>;
  createDocument: (docData: any) => Promise<any>;
  updateDocument: (docId: string, updateData: any) => Promise<boolean>;
  deleteDocument: (docId: string) => Promise<boolean>;
  fetchDocumentDetails: (docId: string) => Promise<void>;
  fetchAnalytics: () => Promise<void>;
  searchDocuments: (query: string) => Promise<void>;
  acknowledgeProgress: (docId: string) => Promise<boolean>;
  triggerRollback: (docId: string, versionNumber: number) => Promise<boolean>;
  postComment: (docId: string, content: string) => Promise<boolean>;
  seedSandbox: () => Promise<boolean>;

  // Sync actions
  setActiveSpaceId: (spaceId: string | null) => void;
  setActiveDocument: (doc: any | null) => void;
  setIsSopFilter: (val: boolean) => void;
  setIsTemplateFilter: (val: boolean) => void;
}

export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
  spaces: [],
  categories: [],
  documents: [],
  activeSpaceId: null,
  activeDocument: null,
  loading: false,
  error: null,
  searchQuery: '',
  searchResults: [],
  analytics: null,
  isSopFilter: false,
  isTemplateFilter: false,

  fetchSpaces: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/protected/knowledge/spaces');
      const json = await res.json();
      if (json.success) {
        set({ spaces: json.data, error: null });
      } else {
        set({ error: json.message });
      }
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  createSpace: async (spaceData) => {
    try {
      const res = await fetch('/api/protected/knowledge/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(spaceData),
      });
      const json = await res.json();
      if (json.success) {
        set((state) => ({ spaces: [...state.spaces, json.data] }));
        toast.success(`Space "${spaceData.name}" created successfully`);
        return true;
      } else {
        toast.error(json.message || 'Failed to create space');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message);
      return false;
    }
  },

  fetchCategories: async () => {
    try {
      const res = await fetch('/api/protected/knowledge/categories');
      const json = await res.json();
      if (json.success) {
        set({ categories: json.data });
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  },

  createCategory: async (categoryData) => {
    try {
      const res = await fetch('/api/protected/knowledge/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });
      const json = await res.json();
      if (json.success) {
        set((state) => ({ categories: [...state.categories, json.data] }));
        toast.success('Category registered');
        return true;
      } else {
        toast.error(json.message);
        return false;
      }
    } catch (err: any) {
      toast.error(err.message);
      return false;
    }
  },

  fetchDocuments: async (spaceId) => {
    const targetSpace = spaceId || get().activeSpaceId;
    if (!targetSpace) return;
    set({ loading: true });
    try {
      const res = await fetch(`/api/protected/knowledge/documents?spaceId=${targetSpace}`);
      const json = await res.json();
      if (json.success) {
        set({ documents: json.data, error: null });
      } else {
        set({ error: json.message });
      }
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  createDocument: async (docData) => {
    try {
      const res = await fetch('/api/protected/knowledge/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docData),
      });
      const json = await res.json();
      if (json.success) {
        set((state) => ({ documents: [...state.documents, json.data] }));
        toast.success(`Page "${docData.title}" created`);
        return json.data;
      } else {
        toast.error(json.message);
        return null;
      }
    } catch (err: any) {
      toast.error(err.message);
      return null;
    }
  },

  updateDocument: async (docId, updateData) => {
    try {
      const res = await fetch(`/api/protected/knowledge/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      const json = await res.json();
      if (json.success) {
        set((state) => ({
          documents: state.documents.map((d) => (d._id === docId ? json.data : d)),
          activeDocument: state.activeDocument?._id === docId ? json.data : state.activeDocument,
        }));
        return true;
      } else {
        toast.error(json.message);
        return false;
      }
    } catch (err: any) {
      toast.error(err.message);
      return false;
    }
  },

  deleteDocument: async (docId) => {
    try {
      const res = await fetch(`/api/protected/knowledge/documents/${docId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        set((state) => ({
          documents: state.documents.filter((d) => d._id !== docId && d.parentDocumentId !== docId),
          activeDocument: state.activeDocument?._id === docId ? null : state.activeDocument,
        }));
        toast.success('Document successfully soft-deleted');
        return true;
      } else {
        toast.error(json.message);
        return false;
      }
    } catch (err: any) {
      toast.error(err.message);
      return false;
    }
  },

  fetchDocumentDetails: async (docId) => {
    try {
      const res = await fetch(`/api/protected/knowledge/documents/${docId}`);
      const json = await res.json();
      if (json.success) {
        set({ activeDocument: json.data });
      }
    } catch (err) {
      console.error('Failed to load document details:', err);
    }
  },

  fetchAnalytics: async () => {
    try {
      const res = await fetch('/api/protected/knowledge/analytics');
      const json = await res.json();
      if (json.success) {
        set({ analytics: json.data });
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  },

  searchDocuments: async (query) => {
    set({ searchQuery: query });
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    try {
      const res = await fetch(`/api/protected/knowledge/search?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.success) {
        set({ searchResults: json.data });
      }
    } catch (err) {
      console.error('Search failed:', err);
    }
  },

  acknowledgeProgress: async (docId) => {
    try {
      const res = await fetch(`/api/protected/knowledge/documents/${docId}/progress`, {
        method: 'POST',
      });
      const json = await res.json();
      if (json.success) {
        toast.success('SOP Reading Confirmed!');
        get().fetchDocumentDetails(docId);
        get().fetchAnalytics();
        return true;
      } else {
        toast.error(json.message);
        return false;
      }
    } catch (err: any) {
      toast.error(err.message);
      return false;
    }
  },

  triggerRollback: async (docId, versionNumber) => {
    try {
      const res = await fetch(`/api/protected/knowledge/documents/${docId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionNumber }),
      });
      const json = await res.json();
      if (json.success) {
        set((state) => ({
          documents: state.documents.map((d) => (d._id === docId ? json.data : d)),
          activeDocument: json.data,
        }));
        toast.success(`Document rolled back to version ${versionNumber}!`);
        return true;
      } else {
        toast.error(json.message);
        return false;
      }
    } catch (err: any) {
      toast.error(err.message);
      return false;
    }
  },

  postComment: async (docId, content) => {
    try {
      const res = await fetch(`/api/protected/knowledge/documents/${docId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const json = await res.json();
      if (json.success) {
        get().fetchDocumentDetails(docId); // Reload document details to populate populated comment senders
        toast.success('Comment posted');
        return true;
      } else {
        toast.error(json.message);
        return false;
      }
    } catch (err: any) {
      toast.error(err.message);
      return false;
    }
  },

  seedSandbox: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/protected/knowledge/seed', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        toast.success('Sandbox data successfully populated!');
        await get().fetchSpaces();
        await get().fetchCategories();
        await get().fetchAnalytics();
        return true;
      } else {
        toast.error(json.message);
        return false;
      }
    } catch (err: any) {
      toast.error(err.message);
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // Sync state helpers
  setActiveSpaceId: (spaceId) => set({ activeSpaceId: spaceId, activeDocument: null }),
  setActiveDocument: (doc) => set({ activeDocument: doc }),
  setIsSopFilter: (val) => set({ isSopFilter: val }),
  setIsTemplateFilter: (val) => set({ isTemplateFilter: val }),
}));
