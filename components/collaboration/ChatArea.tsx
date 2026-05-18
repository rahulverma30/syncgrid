'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Hash,
  Lock,
  MessageCircle,
  Smile,
  Trash2,
  Edit3,
  Paperclip,
  Check,
  AlertCircle,
  Folder,
  ArrowUp,
  RefreshCw,
  MoreHorizontal,
} from 'lucide-react';
import { useCommunicationStore } from '@/store';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ConfirmationModal } from '@/components/ui';

interface ChatAreaProps {
  allUsers: any[];
}

export function ChatArea({ allUsers }: ChatAreaProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const roles = session?.user?.roles || [];

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollTopRef = useRef(0);

  const {
    messages,
    activeChannelId,
    activeConversationId,
    channels,
    typingUsers,
    setUserTyping,
    updateMessage,
    setMessages,
  } = useCommunicationStore();

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Infinite Scroll & Cursor Pagination State
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [announcementMsg, setAnnouncementMsg] = useState('');

  // Delete message confirmation modal states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [messageToDeleteId, setMessageToDeleteId] = useState<string | null>(null);

  // Custom Native Row Virtualization State
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const averageRowHeight = 84; // Average message row height in pixels

  const currentChannel = channels.find((c) => c._id === activeChannelId);
  const otherParticipant = allUsers.find((u) => u._id === activeConversationId);

  // Measure container height on mount/resize
  useEffect(() => {
    if (!messagesContainerRef.current) return;
    setContainerHeight(messagesContainerRef.current.clientHeight);

    const handleResize = () => {
      if (messagesContainerRef.current) {
        setContainerHeight(messagesContainerRef.current.clientHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Monitor scroll for virtualization slicing
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);
    scrollTopRef.current = target.scrollTop;

    // Auto-load older messages when hitting near the top of the scrollbar (threshold 100px)
    if (target.scrollTop <= 100 && !loadingOlder && hasMore && messages.length >= 30) {
      handleLoadOlderMessages();
    }
  };

  // 1. DYNAMIC SLICE WINDOWING ENGINE: Calculates O(1) viewport ranges
  const { startIndex, endIndex, visibleMessages, paddingTop, paddingBottom } = useMemo(() => {
    const totalCount = messages.length;
    if (totalCount === 0) {
      return { startIndex: 0, endIndex: 0, visibleMessages: [], paddingTop: 0, paddingBottom: 0 };
    }

    // Determine the first visible item index
    let start = Math.floor(scrollTop / averageRowHeight) - 10; // buffer 10 items above
    start = Math.max(0, start);

    // Determine the last visible item index
    let end = Math.floor((scrollTop + containerHeight) / averageRowHeight) + 15; // buffer 15 items below
    end = Math.min(totalCount, end);

    const slice = messages.slice(start, end);
    const topPad = start * averageRowHeight;
    const bottomPad = (totalCount - end) * averageRowHeight;

    return {
      startIndex: start,
      endIndex: end,
      visibleMessages: slice,
      paddingTop: topPad,
      paddingBottom: bottomPad,
    };
  }, [messages, scrollTop, containerHeight]);

  // Scroll to bottom on first load/new messages
  useEffect(() => {
    if (messages.length > 0 && scrollTopRef.current === 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Reset pagination checks when switching channels
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasMore(true);
      setLoadingOlder(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [activeChannelId, activeConversationId]);

  // Load older messages backwards (Cursor Pagination)
  const handleLoadOlderMessages = async () => {
    if (loadingOlder || !hasMore || messages.length === 0) return;

    setLoadingOlder(true);
    const earliestMessage = messages[0];
    const earliestTime = earliestMessage?.createdAt;

    try {
      const queryParam = activeChannelId
        ? `channelId=${activeChannelId}`
        : `conversationId=${activeConversationId}`;

      const res = await fetch(
        `/api/protected/collaboration/messages?${queryParam}&cursor=${earliestTime}&limit=30`
      );
      const data = await res.json();

      if (data.success) {
        if (data.data.length === 0) {
          setHasMore(false);
          toast.info('Loaded all previous chat history.');
        } else {
          // Prepend older messages seamlessly to preserve order
          setMessages([...data.data, ...messages]);
          setAnnouncementMsg(`Loaded ${data.data.length} older messages.`);
        }
      }
    } catch (err) {
      console.error('Failed to load older messages:', err);
    } finally {
      setLoadingOlder(false);
    }
  };

  const handleEditSubmit = async (msgId: string) => {
    if (!editText.trim()) return;

    try {
      updateMessage(msgId, { content: editText, editedAt: new Date().toISOString() });
      setEditingMessageId(null);

      await fetch(`/api/protected/collaboration/messages/${msgId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editText }),
      });
      toast.success('Message updated.');
    } catch (err) {
      console.error('Failed to submit message edit:', err);
    }
  };

  const handleDelete = (msgId: string) => {
    setMessageToDeleteId(msgId);
    setIsDeleteConfirmOpen(true);
  };

  const handleToggleReaction = async (msgId: string, emoji: string) => {
    try {
      await fetch('/api/protected/collaboration/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msgId, emoji }),
      });
    } catch (err) {
      console.error('Failed to toggle emoji reaction:', err);
    }
  };

  const typingArray = Object.keys(typingUsers).filter((k) => typingUsers[k]);
  const typingString =
    typingArray.length > 0
      ? `${typingArray
          .map((id) => allUsers.find((u) => u._id === id)?.name || 'Someone')
          .join(', ')} is typing...`
      : '';

  // Trigger WCAG Screen-reader announcers on dynamic updates
  useEffect(() => {
    if (typingString) {
      const timer = setTimeout(() => {
        setAnnouncementMsg(typingString);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [typingString]);

  return (
    <div
      className="flex flex-1 flex-col bg-slate-900/10 min-w-0"
      role="main"
      aria-label="Chat Stream Area"
    >
      {/* Dynamic ARIA Live announcements banner region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcementMsg}
      </div>

      {/* Chat Area Top Status Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-6 bg-slate-950/20 backdrop-blur-md">
        <div className="flex items-center gap-2 min-w-0 pr-24">
          {currentChannel ? (
            <>
              {currentChannel.type === 'private' ? (
                <Lock className="h-5 w-5 text-rose-400" />
              ) : (
                <Hash className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="text-sm font-bold tracking-wide text-foreground">
                {currentChannel.name}
              </span>
              <span className="text-xs text-muted-foreground ml-2 border-l border-border pl-3 truncate max-w-[200px] md:max-w-[400px]">
                {currentChannel.description || 'Channel collaboration room.'}
              </span>
            </>
          ) : otherParticipant ? (
            <>
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold text-foreground">
                Direct Chat with {otherParticipant.name}
              </span>
            </>
          ) : (
            <span className="text-sm font-medium text-muted-foreground">
              Select a channel to begin
            </span>
          )}
        </div>
      </div>

      {/* Messages Viewer Area (Optimized Viewport Container) */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 space-y-4 relative"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center space-y-3">
            <MessageSquare className="h-10 w-10 text-muted-foreground/30 animate-pulse" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              No conversations logged yet
            </p>
            <p className="text-[11px] text-muted-foreground/60 max-w-sm text-center">
              Post your first message below or load sandbox channels templates to seed history.
            </p>
          </div>
        ) : (
          <div style={{ paddingTop, paddingBottom }} className="space-y-4">
            {/* Pagination manual trigger spinner at upper bounds */}
            {hasMore && messages.length >= 30 && (
              <div className="flex justify-center pb-2">
                <button
                  onClick={handleLoadOlderMessages}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-border bg-slate-950/40 text-xs font-bold text-muted-foreground hover:text-foreground transition-all hover:bg-slate-900/40"
                  disabled={loadingOlder}
                  aria-label="Load older messages"
                >
                  <RefreshCw className={cn('h-3.5 w-3.5', loadingOlder && 'animate-spin')} />
                  <span>{loadingOlder ? 'Loading history...' : 'Load previous messages'}</span>
                </button>
              </div>
            )}

            {visibleMessages.map((msg) => {
              const isOwner =
                currentUserId &&
                (typeof msg.senderId === 'object'
                  ? msg.senderId._id === currentUserId
                  : msg.senderId === currentUserId);

              const userRoles = roles || [];
              const isAdmin = userRoles.includes('Admin') || userRoles.includes('Super Admin');

              const senderObj = typeof msg.senderId === 'object' ? msg.senderId : null;
              const senderName = senderObj?.name || 'Collaborator';

              const isDeleted = !!msg.deletedAt;

              return (
                <motion.div
                  key={msg._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex gap-4 p-3 rounded-lg group transition-all relative border border-transparent',
                    isOwner ? 'hover:border-primary/10 hover:bg-primary/5' : 'hover:bg-muted/30'
                  )}
                  style={{ minHeight: `${averageRowHeight}px` }}
                >
                  {/* User Avatar Bubble */}
                  <div className="h-9 w-9 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center font-bold text-primary flex-shrink-0 text-sm">
                    {senderName.substring(0, 1).toUpperCase()}
                  </div>

                  {/* Message Context */}
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground hover:underline cursor-pointer">
                        {senderName}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {msg.editedAt && (
                        <span className="text-[9px] text-muted-foreground italic">(edited)</span>
                      )}
                    </div>

                    {editingMessageId === msg._id ? (
                      <div className="flex gap-2 mt-1.5">
                        <input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="flex-1 rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          autoFocus
                          aria-label="Edit message text input"
                        />
                        <button
                          onClick={() => handleEditSubmit(msg._id)}
                          className="rounded-md bg-primary px-3 py-1 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-all"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingMessageId(null)}
                          className="rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <p
                        className={cn(
                          'text-sm leading-relaxed text-foreground/90 break-words',
                          isDeleted && 'text-muted-foreground/60 italic'
                        )}
                      >
                        {msg.content}
                      </p>
                    )}

                    {/* Lazy Attachment Previews */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {msg.attachments.map((file, fIdx) => (
                          <a
                            key={fIdx}
                            href={file.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 rounded-lg border border-border bg-slate-950/20 px-3 py-2 text-xs text-foreground hover:bg-slate-900/40 transition-all max-w-[240px] truncate"
                            aria-label={`Attachment preview: ${file.fileName}`}
                          >
                            <Folder className="h-4 w-4 text-primary animate-pulse" />
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold truncate">{file.fileName}</span>
                              <span className="text-[9px] text-muted-foreground">
                                {Math.round(file.fileSize / 1024)} KB
                              </span>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Emoji Reactions Row */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div
                        className="flex flex-wrap gap-1.5 mt-2"
                        role="group"
                        aria-label="Emoji reactions list"
                      >
                        {msg.reactions.map((r, rIdx) => {
                          const hasReacted =
                            currentUserId && r.users.some((u) => u._id === currentUserId);
                          return (
                            <button
                              key={rIdx}
                              onClick={() => handleToggleReaction(msg._id, r.emoji)}
                              className={cn(
                                'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border transition-all hover:scale-105',
                                hasReacted
                                  ? 'bg-primary/20 border-primary/30 text-primary font-bold'
                                  : 'bg-slate-950/20 border-border text-muted-foreground hover:text-foreground'
                              )}
                              title={r.users.map((u) => u.name).join(', ')}
                              aria-label={`Emoji ${r.emoji} reacted by ${r.users.length} people`}
                            >
                              <span>{r.emoji}</span>
                              <span className="text-[10px]">{r.users.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Message Hover Actions Toolbar */}
                  {!isDeleted && (
                    <div
                      className="absolute right-4 top-2 hidden group-hover:flex items-center gap-1 bg-slate-950/90 border border-border rounded-lg p-1 shadow-xl backdrop-blur-md z-10"
                      role="toolbar"
                      aria-label="Message action items"
                    >
                      {/* Emojis Toolbar */}
                      {['👍', '🎉', '🔥', '❤️'].map((emo) => (
                        <button
                          key={emo}
                          onClick={() => handleToggleReaction(msg._id, emo)}
                          className="hover:bg-muted p-1 rounded transition-colors text-sm hover:scale-110"
                          aria-label={`Quick react with ${emo}`}
                        >
                          {emo}
                        </button>
                      ))}
                      {(isOwner || isAdmin) && (
                        <>
                          <button
                            onClick={() => {
                              setEditingMessageId(msg._id);
                              setEditText(msg.content);
                            }}
                            className="hover:bg-muted p-1 rounded transition-colors"
                            title="Edit Message"
                            aria-label="Edit message content text"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                          </button>
                          <button
                            onClick={() => handleDelete(msg._id)}
                            className="hover:bg-muted p-1 rounded transition-colors"
                            title={isAdmin && !isOwner ? 'Admin Moderate Delete' : 'Delete Message'}
                            aria-label="Delete message content text"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-500 hover:text-rose-400" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicators Alarm */}
      {typingString && (
        <div className="px-6 py-1 bg-slate-950/10">
          <span
            className="text-[10px] text-primary italic font-semibold animate-pulse"
            aria-live="assertive"
          >
            {typingString}
          </span>
        </div>
      )}

      {/* Delete Message Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={async () => {
          if (messageToDeleteId) {
            try {
              updateMessage(messageToDeleteId, {
                content: 'This message has been deleted.',
                deletedAt: new Date().toISOString(),
              });

              const res = await fetch(
                `/api/protected/collaboration/messages/${messageToDeleteId}`,
                {
                  method: 'DELETE',
                }
              );
              const data = await res.json();
              if (data.success) {
                toast.success('Message deleted successfully.');
              }
            } catch (err) {
              console.error('Failed to delete message:', err);
            } finally {
              setIsDeleteConfirmOpen(false);
            }
          }
        }}
        title="Delete Message"
        message="Are you absolutely sure you want to delete this message? This action is tracked and cannot be undone."
        confirmLabel="Delete Message"
        cancelLabel="Cancel"
        type="danger"
      />
    </div>
  );
}
