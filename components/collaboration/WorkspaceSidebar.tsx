'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Hash,
  Lock,
  Plus,
  Compass,
  ChevronDown,
  Building,
  Briefcase,
  Users,
  Search,
  Settings,
  Bell,
  CheckCircle,
} from 'lucide-react';
import { useCommunicationStore } from '@/store';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/cn';

interface WorkspaceSidebarProps {
  onNewChannelClick: () => void;
  allUsers: any[];
  onStartDirectMessage: (userId: string) => void;
}

export function WorkspaceSidebar({
  onNewChannelClick,
  allUsers,
  onStartDirectMessage,
}: WorkspaceSidebarProps) {
  const { data: session } = useSession();
  const {
    workspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    channels,
    activeChannelId,
    setActiveChannelId,
    activeConversationId,
    setActiveConversationId,
    presenceMap,
    unreadsCount,
    clearUnread,
  } = useCommunicationStore();

  const currentWorkspace = workspaces.find((w) => w._id === activeWorkspaceId) || workspaces[0];

  const handleChannelSelect = (channelId: string) => {
    setActiveChannelId(channelId);
    clearUnread(channelId);
  };

  const handleUserSelect = (targetUserId: string) => {
    onStartDirectMessage(targetUserId);
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'private':
        return <Lock className="h-4 w-4 text-rose-400" />;
      case 'department':
        return <Building className="h-4 w-4 text-emerald-400" />;
      case 'project':
        return <Briefcase className="h-4 w-4 text-blue-400" />;
      default:
        return <Hash className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-slate-950/40 backdrop-blur-md">
      {/* Workspace Switcher */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-md">
            {currentWorkspace?.name ? currentWorkspace.name.substring(0, 2).toUpperCase() : 'SG'}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-wide text-foreground truncate max-w-[120px]">
              {currentWorkspace?.name || 'SyncGrid'}
            </span>
            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Office
            </span>
          </div>
        </div>
      </div>

      {/* Main Sections Scroll Panel */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* Workspace Channels */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <span>Communication Hub</span>
            <button
              onClick={onNewChannelClick}
              className="rounded p-0.5 hover:bg-muted hover:text-foreground transition-all"
              title="Create Channel"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-0.5">
            {channels.map((chan) => {
              const isActive = activeChannelId === chan._id;
              const unread = unreadsCount[chan._id] || 0;

              return (
                <button
                  key={chan._id}
                  onClick={() => handleChannelSelect(chan._id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm font-medium transition-all group',
                    isActive
                      ? 'bg-primary/15 border border-primary/20 text-primary'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {getChannelIcon(chan.type)}
                    <span className={cn('truncate', unread > 0 && 'font-bold text-foreground')}>
                      {chan.name}
                    </span>
                  </div>
                  {unread > 0 ? (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                      {unread}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Direct Messages */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <span>Direct Messages</span>
          </div>

          <div className="space-y-0.5">
            {allUsers
              .filter((u) => u._id !== session?.user?.id)
              .map((u) => {
                const status = presenceMap[u._id] || 'offline';
                const unread = unreadsCount[u._id] || 0;

                return (
                  <button
                    key={u._id}
                    onClick={() => handleUserSelect(u._id)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm font-medium transition-all',
                      activeConversationId && activeConversationId.includes(u._id)
                        ? 'bg-primary/15 border border-primary/20 text-primary'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative">
                        <div className="h-6 w-6 rounded-full bg-primary/25 border border-primary/25 flex items-center justify-center text-[10px] font-bold text-primary">
                          {u.name.substring(0, 1).toUpperCase()}
                        </div>
                        <span
                          className={cn(
                            'absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background shadow-sm',
                            status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'
                          )}
                        />
                      </div>
                      <span className={cn('truncate', unread > 0 && 'font-bold text-foreground')}>
                        {u.name}
                      </span>
                    </div>
                    {unread > 0 ? (
                      <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                        {unread}
                      </span>
                    ) : null}
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* Current User Session Bar */}
      <div className="mt-auto border-t border-border p-3.5 bg-slate-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center font-bold text-primary">
                {session?.user?.name ? session.user.name.substring(0, 1).toUpperCase() : 'U'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-background animate-pulse" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-foreground truncate">
                {session?.user?.name || 'Loading user...'}
              </span>
              <span className="text-[9px] text-muted-foreground truncate">
                {session?.user?.email}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
