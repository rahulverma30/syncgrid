'use client';

import React, { useEffect, useState } from 'react';
import { useCommunicationStore } from '@/store';
import { useSession } from 'next-auth/react';
import { PageHeader, Button, Modal, Select } from '@/components/ui';
import {
  AnnouncementBanner,
  WorkspaceSidebar,
  ChatArea,
  MessageComposer,
  ThreadPanel,
  SharedNotesPanel,
} from '@/components/collaboration';
import { MessageSquare, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useRealtime } from '@/hooks/useRealtime';

export default function CollaborationDashboard() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const companyId = session?.user?.companyId;

  const [mounted, setMounted] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [createChannelModalOpen, setCreateChannelModalOpen] = useState(false);
  const [newChanName, setNewChanName] = useState('');
  const [newChanType, setNewChanType] = useState<'public' | 'private' | 'department' | 'project'>(
    'public'
  );
  const [newChanDesc, setNewChanDesc] = useState('');

  // Advanced Responsive Layout Engine state
  const [showNotes, setShowNotes] = useState(true);

  const {
    isLoading,
    setIsLoading,
    workspaces,
    setWorkspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    channels,
    setChannels,
    activeChannelId,
    setActiveChannelId,
    activeConversationId,
    setActiveConversationId,
    messages,
    setMessages,
    addMessage,
    updateMessage,
    deleteMessage,
    presenceMap,
    setPresenceMap,
    updatePresence,
    announcements,
    setAnnouncements,
    setUserTyping,
    activeThreadParent,
    setActiveThreadParent,
  } = useCommunicationStore();

  // 1. Integrates Resilient Real-Time Event Stream with automatic reconnect & heartbeats
  useRealtime(companyId, activeChannelId, activeConversationId);

  // Auto-collapse notes panel when a thread is opened to preserve central workspace spacing
  useEffect(() => {
    if (activeThreadParent) {
      const timer = setTimeout(() => {
        setShowNotes(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activeThreadParent]);

  // 2. Initial Load: Fetch Company Directory (Users List)
  useEffect(() => {
    Promise.resolve().then(() => setMounted(true));

    const fetchDirectory = async () => {
      try {
        const res = await fetch('/api/protected/team/members');
        const data = await res.json();
        if (data.success) {
          setAllUsers(data.data);
        } else {
          setAllUsers([]);
        }
      } catch (err) {
        setAllUsers([]);
      }
    };

    fetchDirectory();
  }, []);

  // 3. Bootstrap Workspaces, Channels, Announcements, and Presence
  useEffect(() => {
    if (!mounted) return;

    const bootstrapDashboard = async () => {
      setIsLoading(true);
      try {
        const wRes = await fetch('/api/protected/collaboration/workspaces');
        const wData = await wRes.json();
        if (wData.success && wData.data.length > 0) {
          setWorkspaces(wData.data);
          const activeWId = wData.data[0]._id;
          setActiveWorkspaceId(activeWId);

          const cRes = await fetch(
            `/api/protected/collaboration/channels?workspaceId=${activeWId}`
          );
          const cData = await cRes.json();
          if (cData.success && cData.data.length > 0) {
            setChannels(cData.data);
            setActiveChannelId(cData.data[0]._id);
          }
        }

        const aRes = await fetch('/api/protected/collaboration/announcements');
        const aData = await aRes.json();
        if (aData.success) {
          setAnnouncements(aData.data);
        }

        const pRes = await fetch('/api/protected/collaboration/presence');
        const pData = await pRes.json();
        if (pData.success) {
          setPresenceMap(pData.data);
        }
      } catch (err) {
        console.error('Failed to bootstrap Collaboration Dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapDashboard();
  }, [
    mounted,
    setWorkspaces,
    setChannels,
    setActiveWorkspaceId,
    setActiveChannelId,
    setAnnouncements,
    setPresenceMap,
    setIsLoading,
  ]);

  // 4. Fetch Messages Feed on activeChannelId / activeConversationId changes
  useEffect(() => {
    if (!activeChannelId && !activeConversationId) return;

    const fetchFeed = async () => {
      try {
        const queryParam = activeChannelId
          ? `channelId=${activeChannelId}`
          : `conversationId=${activeConversationId}`;

        const res = await fetch(`/api/protected/collaboration/messages?${queryParam}`);
        const data = await res.json();
        if (data.success) {
          setMessages(data.data);
        }
      } catch (err) {
        console.error('Failed to load messages feed:', err);
      }
    };

    fetchFeed();
  }, [activeChannelId, activeConversationId, setMessages]);

  // 5. Send message action
  const handleSendMessage = async (content: string, attachments?: any[]) => {
    if (!activeChannelId && !activeConversationId) return;

    try {
      const tempId = Math.random().toString(36).substring(7);
      const tempMessage = {
        _id: tempId,
        senderId: {
          _id: currentUserId || 'me',
          name: session?.user?.name || 'Me',
          email: session?.user?.email || '',
        },
        channelId: activeChannelId || undefined,
        conversationId: activeConversationId || undefined,
        contentType: attachments && attachments.length > 0 ? 'file' : 'text',
        content,
        attachments: attachments || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reactions: [],
      };

      // Optimistic instant append
      addMessage(tempMessage as any);

      const bodyPayload = {
        channelId: activeChannelId || undefined,
        conversationId: activeConversationId || undefined,
        contentType: attachments && attachments.length > 0 ? 'file' : 'text',
        content,
        attachments: attachments || [],
      };

      const res = await fetch('/api/protected/collaboration/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (data.success) {
        useCommunicationStore.setState((state) => ({
          messages: state.messages.map((m) => (m._id === tempId ? data.data : m)),
        }));
      }
    } catch (err) {
      console.error('Failed sending message:', err);
    }
  };

  // 6. Direct Message conversation creator
  const handleStartDirectMessage = (targetUserId: string) => {
    setActiveConversationId(targetUserId);
  };

  // 8. Create channel action
  const handleCreateChannel = async () => {
    if (!newChanName.trim() || !activeWorkspaceId) return;

    try {
      const res = await fetch('/api/protected/collaboration/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          name: newChanName,
          type: newChanType,
          description: newChanDesc,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setChannels([...channels, data.data]);
        setActiveChannelId(data.data._id);
        setCreateChannelModalOpen(false);
        setNewChanName('');
        setNewChanDesc('');
        toast.success(`Channel #${data.data.name} created!`);
      }
    } catch (err) {
      console.error('Failed to create channel:', err);
    }
  };

  if (!mounted) return null;

  // Render Sandboxes Initialization Console if no Workspaces exist
  if (!isLoading && workspaces.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900/10 min-h-[500px]">
        <div className="max-w-md w-full bg-slate-950/40 border border-border rounded-2xl p-8 text-center backdrop-blur-md shadow-2xl space-y-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto shadow-inner border border-primary/20">
            <MessageSquare className="h-6 w-6 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-foreground tracking-wide Outfit">
              Collaboration Channels Not Initialized
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Experience a premium Slack-like real-time workspace with nested channel subdivisions,
              unread notification badges, visual reactions toolbars, and collaborative shared
              guidelines pads.
            </p>
            <p className="text-xs text-emerald-500/80 bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 mt-4 text-left leading-relaxed">
              <strong>Tenant Setup Required:</strong> Ensure your tenant organization is fully
              registered and active in the system dashboard. Workspaces and collaboration channels
              will synchronize automatically.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900/10 overflow-hidden relative">
      {/* Pinned Announcement warning ribbon */}
      <AnnouncementBanner />

      {/* Main Workspace split columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Switchers Sidebar */}
        <WorkspaceSidebar
          onNewChannelClick={() => setCreateChannelModalOpen(true)}
          allUsers={allUsers}
          onStartDirectMessage={handleStartDirectMessage}
        />

        {/* Center Stream Frame & Composer */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950/10 border-r border-border relative">
          {/* Quick Guidelines toggle overlay button inside top right bar */}
          <div className="absolute right-4 top-3.5 z-10">
            <button
              onClick={() => {
                setShowNotes(!showNotes);
                if (!showNotes) setActiveThreadParent(null); // Collapse thread if opening notes to guarantee layout integrity
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all border ${
                showNotes
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-950/30 border-border text-muted-foreground hover:text-foreground'
              }`}
              title="Toggle Workspace Guidelines Notes"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Guidelines</span>
            </button>
          </div>

          <ChatArea allUsers={allUsers} />
          {(activeChannelId || activeConversationId) && (
            <MessageComposer onSendMessage={handleSendMessage} />
          )}
        </div>

        {/* Collapsible Right Thread sidebar */}
        <ThreadPanel />

        {/* Collapsible Right Shared Notepad guidelines sidebar */}
        {showNotes && <SharedNotesPanel />}
      </div>

      {/* Create Channel Modal Dialog box */}
      <Modal
        isOpen={createChannelModalOpen}
        onClose={() => setCreateChannelModalOpen(false)}
        title="Create New Channel"
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase">
              Channel Name
            </label>
            <input
              value={newChanName}
              onChange={(e) => setNewChanName(e.target.value)}
              placeholder="e.g. marketing-campaign"
              className="w-full rounded-md border border-border bg-slate-950/40 px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <Select
              label="Channel Visibility"
              value={newChanType}
              onChange={(val) => setNewChanType(val as any)}
              options={[
                { value: 'public', label: 'Public (#general)' },
                { value: 'private', label: 'Private (Invite Only)' },
                { value: 'department', label: 'Department-Linked (HR/Finance)' },
                { value: 'project', label: 'Project-Linked (Active Project)' },
              ]}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase">Description</label>
            <textarea
              value={newChanDesc}
              onChange={(e) => setNewChanDesc(e.target.value)}
              placeholder="Provide a short guideline or topic for the channel..."
              className="w-full rounded-md border border-border bg-slate-950/40 px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-20 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
            <Button
              variant="outline"
              onClick={() => setCreateChannelModalOpen(false)}
              className="text-xs font-semibold py-1 px-3"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateChannel}
              disabled={!newChanName.trim()}
              className="text-xs font-bold py-1 px-3 hover:scale-105 transition-all"
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
