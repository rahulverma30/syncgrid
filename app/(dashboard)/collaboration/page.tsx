'use client';

import React, { useEffect, useState } from 'react';
import { useCommunicationStore } from '@/store';
import { useSession } from 'next-auth/react';
import { PageHeader, Button, LoadingSpinner, Modal } from '@/components/ui';
import {
  AnnouncementBanner,
  WorkspaceSidebar,
  ChatArea,
  MessageComposer,
  ThreadPanel,
  SharedNotesPanel,
} from '@/components/collaboration';
import { MessageSquare, Heart, RefreshCw, Layers } from 'lucide-react';
import { toast } from 'sonner';

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
  } = useCommunicationStore();

  // 1. Initial Load: Fetch Company Directory (Users List)
  useEffect(() => {
    Promise.resolve().then(() => setMounted(true));

    const fetchDirectory = async () => {
      try {
        const res = await fetch('/api/protected/team/members'); // Traced directory endpoint
        const data = await res.json();
        if (data.success) {
          setAllUsers(data.data);
        } else {
          // Fallback mockup profiles if company directory is empty
          setAllUsers([
            { _id: 'mock-1', name: 'Sarah Jenkins', email: 'sarah.j@syncgrid.com' },
            { _id: 'mock-2', name: 'Marcus Brody', email: 'marcus.b@syncgrid.com' },
            { _id: 'mock-3', name: 'Elena Rostova', email: 'elena.r@syncgrid.com' },
          ]);
        }
      } catch (err) {
        setAllUsers([
          { _id: 'mock-1', name: 'Sarah Jenkins', email: 'sarah.j@syncgrid.com' },
          { _id: 'mock-2', name: 'Marcus Brody', email: 'marcus.b@syncgrid.com' },
          { _id: 'mock-3', name: 'Elena Rostova', email: 'elena.r@syncgrid.com' },
        ]);
      }
    };

    fetchDirectory();
  }, []);

  // 2. Fetch Workspaces, Channels, Announcements, and Presence States
  useEffect(() => {
    if (!mounted) return;

    const bootstrapDashboard = async () => {
      setIsLoading(true);
      try {
        // Fetch Workspaces
        const wRes = await fetch('/api/protected/collaboration/workspaces');
        const wData = await wRes.json();
        if (wData.success && wData.data.length > 0) {
          setWorkspaces(wData.data);
          const activeWId = wData.data[0]._id;
          setActiveWorkspaceId(activeWId);

          // Fetch Channels
          const cRes = await fetch(
            `/api/protected/collaboration/channels?workspaceId=${activeWId}`
          );
          const cData = await cRes.json();
          if (cData.success && cData.data.length > 0) {
            setChannels(cData.data);
            setActiveChannelId(cData.data[0]._id);
          }
        }

        // Fetch Announcements
        const aRes = await fetch('/api/protected/collaboration/announcements');
        const aData = await aRes.json();
        if (aData.success) {
          setAnnouncements(aData.data);
        }

        // Fetch Users Online Presence sessions
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

  // 3. Fetch Messages Feed on activeChannelId / activeConversationId changes
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

  // 4. SSE Subscription: Stream Real-Time Events
  useEffect(() => {
    if (!companyId) return;

    // Use active SSE real-time gateway in app/api/protected/tasks/realtime
    const eventSource = new EventSource('/api/protected/tasks/realtime');

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.companyId !== companyId) return; // Tenant-level isolation guard

        const { event: sseEvent, payload } = parsed;

        if (sseEvent === 'message_posted') {
          // Check if message belongs to current channel/DM view
          if (
            (activeChannelId && payload.channelId === activeChannelId) ||
            (activeConversationId && payload.conversationId === activeConversationId)
          ) {
            addMessage(payload);
          }
        } else if (sseEvent === 'message_updated') {
          updateMessage(payload._id, payload);
        } else if (sseEvent === 'message_deleted') {
          deleteMessage(payload._id);
        } else if (sseEvent === 'presence_updated') {
          updatePresence(payload.userId, payload.status);
        } else if (sseEvent === 'announcement_posted') {
          setAnnouncements([payload, ...announcements]);
        } else if (sseEvent === 'message_reaction_toggled') {
          updateMessage(payload.messageId, { reactions: payload.reactions });
        } else if (sseEvent === 'user_typing_update') {
          setUserTyping(payload.userId, payload.isTyping);
        }
      } catch (err) {
        console.error('Failed parsing SSE payload:', err);
      }
    };

    eventSource.onerror = () => {
      console.warn('SSE subscription dropped, Next.js reconnecting automatically...');
    };

    return () => {
      eventSource.close();
    };
  }, [
    companyId,
    activeChannelId,
    activeConversationId,
    addMessage,
    updateMessage,
    deleteMessage,
    updatePresence,
    setAnnouncements,
    announcements,
    setUserTyping,
  ]);

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

      // Optimistic instant append to UI
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
        // Swap optimistic message with official DB entity
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

  // 7. Seed sandbox console action
  const handleSeedSandbox = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/protected/collaboration/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('Communication sandbox environment fully loaded!');
        window.location.reload();
      } else {
        toast.error('Failed to seed sandbox.');
      }
    } catch (err) {
      toast.error('Server error seeding sandbox.');
    } finally {
      setIsLoading(false);
    }
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
              Initialize Collaboration Sandbox
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Experience a premium Slack-like real-time workspace with nested channel subdivisions,
              unread notification badges, visual reactions toolbars, collaborative shared guidelines
              pads, and alert banners.
            </p>
          </div>
          <Button
            onClick={handleSeedSandbox}
            className="w-full flex items-center justify-center gap-2 font-bold py-2.5 hover:scale-[1.02] transition-all"
            disabled={isLoading}
          >
            {isLoading ? (
              <LoadingSpinner className="h-4 w-4" />
            ) : (
              <>
                <Layers className="h-4 w-4" /> Load Collaboration Sandbox
              </>
            )}
          </Button>
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
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950/10 border-r border-border">
          <ChatArea allUsers={allUsers} />
          {(activeChannelId || activeConversationId) && (
            <MessageComposer onSendMessage={handleSendMessage} />
          )}
        </div>

        {/* Collapsible Right Thread sidebar */}
        <ThreadPanel />

        {/* Collapsible Right Shared Notepad guidelines sidebar */}
        <SharedNotesPanel />
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
            <label className="text-xs font-bold text-muted-foreground uppercase">
              Channel Visibility
            </label>
            <select
              value={newChanType}
              onChange={(e) => setNewChanType(e.target.value as any)}
              className="w-full rounded-md border border-border bg-slate-950/40 px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="public">Public (#general)</option>
              <option value="private">Private (Invite Only)</option>
              <option value="department">Department-Linked (HR/Finance)</option>
              <option value="project">Project-Linked (Active Project)</option>
            </select>
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
