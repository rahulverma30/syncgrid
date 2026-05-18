import { create } from 'zustand';

export interface IWorkspace {
  _id: string;
  name: string;
  description?: string;
  members: Array<{ userId: string; role: 'admin' | 'member' }>;
  isActive: boolean;
}

export interface IChannel {
  _id: string;
  workspaceId: string;
  name: string;
  type: 'public' | 'private' | 'department' | 'project';
  description?: string;
  projectId?: string;
  departmentId?: string;
  members?: string[];
  isArchived: boolean;
  unreadCount?: number;
}

export interface IDirectConversation {
  _id: string;
  participants: Array<{ _id: string; name: string; email: string; avatarUrl?: string }>;
  isGroup: boolean;
  name?: string;
  unreadCount?: number;
}

export interface IMessage {
  _id: string;
  senderId:
    | {
        _id: string;
        name: string;
        email: string;
        avatarUrl?: string;
      }
    | string;
  channelId?: string;
  conversationId?: string;
  contentType: 'text' | 'rich' | 'announcement' | 'file';
  content: string;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
  replyCount?: number;
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
  editedAt?: string;
  deletedAt?: string;
  reactions?: Array<{
    emoji: string;
    users: Array<{ _id: string; name: string }>;
  }>;
}

export interface IAnnouncement {
  _id: string;
  title: string;
  content: string;
  pinnedUntil?: string;
  acknowledgedBy: string[];
  authorId: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

export interface ISharedNote {
  _id: string;
  workspaceId: string;
  title: string;
  content: string;
  updatedBy: {
    _id: string;
    name: string;
  };
  isPinned: boolean;
  updatedAt: string;
}

interface CommunicationState {
  // Loading indicators
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  operationError: string | null;
  setOperationError: (error: string | null) => void;

  // Active entities list
  workspaces: IWorkspace[];
  setWorkspaces: (workspaces: IWorkspace[]) => void;
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string | null) => void;

  channels: IChannel[];
  setChannels: (channels: IChannel[]) => void;
  activeChannelId: string | null;
  setActiveChannelId: (id: string | null) => void;

  conversations: IDirectConversation[];
  setConversations: (conversations: IDirectConversation[]) => void;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;

  messages: IMessage[];
  setMessages: (messages: IMessage[]) => void;
  addMessage: (message: IMessage) => void;
  updateMessage: (id: string, updates: Partial<IMessage>) => void;
  deleteMessage: (id: string) => void;

  // Thread sidebar panel state
  activeThreadParent: IMessage | null;
  setActiveThreadParent: (message: IMessage | null) => void;
  threadReplies: any[];
  setThreadReplies: (replies: any[]) => void;
  addThreadReply: (reply: any) => void;

  // Online Presence sessions mappings (userId -> status)
  presenceMap: Record<string, 'online' | 'offline' | 'away' | 'busy'>;
  setPresenceMap: (map: Record<string, 'online' | 'offline' | 'away' | 'busy'>) => void;
  updatePresence: (userId: string, status: 'online' | 'offline' | 'away' | 'busy') => void;

  // Typing state indicators (userId -> boolean)
  typingUsers: Record<string, boolean>;
  setTypingUsers: (typing: Record<string, boolean>) => void;
  setUserTyping: (userId: string, isTyping: boolean) => void;

  // Announcements
  announcements: IAnnouncement[];
  setAnnouncements: (announcements: IAnnouncement[]) => void;
  acknowledgeAnnouncement: (announcementId: string, userId: string) => void;

  // Shared operational notes pad
  sharedNotes: ISharedNote[];
  setSharedNotes: (notes: ISharedNote[]) => void;
  addOrUpdateNote: (note: ISharedNote) => void;

  // Fuzzy searches
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: IMessage[];
  setSearchResults: (results: IMessage[]) => void;

  // Real-time unread alerts
  unreadsCount: Record<string, number>; // key: channelId or conversationId
  setUnreadsCount: (unreads: Record<string, number>) => void;
  incrementUnread: (key: string) => void;
  clearUnread: (key: string) => void;
}

export const useCommunicationStore = create<CommunicationState>((set) => ({
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  operationError: null,
  setOperationError: (error) => set({ operationError: error }),

  workspaces: [],
  setWorkspaces: (workspaces) => set({ workspaces }),
  activeWorkspaceId: null,
  setActiveWorkspaceId: (activeWorkspaceId) => set({ activeWorkspaceId }),

  channels: [],
  setChannels: (channels) => set({ channels }),
  activeChannelId: null,
  setActiveChannelId: (activeChannelId) => set({ activeChannelId, activeConversationId: null }),

  conversations: [],
  setConversations: (conversations) => set({ conversations }),
  activeConversationId: null,
  setActiveConversationId: (activeConversationId) =>
    set({ activeConversationId, activeChannelId: null }),

  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) => (m._id === id ? { ...m, ...updates } : m)),
    })),
  deleteMessage: (id) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === id
          ? {
              ...m,
              content: 'This message has been deleted.',
              deletedAt: new Date().toISOString(),
            }
          : m
      ),
    })),

  activeThreadParent: null,
  setActiveThreadParent: (activeThreadParent) => set({ activeThreadParent, threadReplies: [] }),
  threadReplies: [],
  setThreadReplies: (threadReplies) => set({ threadReplies }),
  addThreadReply: (reply) => set((state) => ({ threadReplies: [...state.threadReplies, reply] })),

  presenceMap: {},
  setPresenceMap: (presenceMap) => set({ presenceMap }),
  updatePresence: (userId, status) =>
    set((state) => ({
      presenceMap: { ...state.presenceMap, [userId]: status },
    })),

  typingUsers: {},
  setTypingUsers: (typingUsers) => set({ typingUsers }),
  setUserTyping: (userId, isTyping) =>
    set((state) => ({
      typingUsers: { ...state.typingUsers, [userId]: isTyping },
    })),

  announcements: [],
  setAnnouncements: (announcements) => set({ announcements }),
  acknowledgeAnnouncement: (announcementId, userId) =>
    set((state) => ({
      announcements: state.announcements.map((a) =>
        a._id === announcementId
          ? { ...a, acknowledgedBy: [...Array.from(new Set([...a.acknowledgedBy, userId]))] }
          : a
      ),
    })),

  sharedNotes: [],
  setSharedNotes: (sharedNotes) => set({ sharedNotes }),
  addOrUpdateNote: (note) =>
    set((state) => {
      const exists = state.sharedNotes.some((n) => n._id === note._id);
      return {
        sharedNotes: exists
          ? state.sharedNotes.map((n) => (n._id === note._id ? note : n))
          : [...state.sharedNotes, note],
      };
    }),

  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  searchResults: [],
  setSearchResults: (searchResults) => set({ searchResults }),

  unreadsCount: {},
  setUnreadsCount: (unreadsCount) => set({ unreadsCount }),
  incrementUnread: (key) =>
    set((state) => ({
      unreadsCount: { ...state.unreadsCount, [key]: (state.unreadsCount[key] || 0) + 1 },
    })),
  clearUnread: (key) =>
    set((state) => ({
      unreadsCount: { ...state.unreadsCount, [key]: 0 },
    })),
}));
