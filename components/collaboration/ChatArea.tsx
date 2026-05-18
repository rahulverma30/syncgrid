'use client';

import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { useCommunicationStore } from '@/store';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';

interface ChatAreaProps {
  allUsers: any[];
}

export function ChatArea({ allUsers }: ChatAreaProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    activeChannelId,
    activeConversationId,
    channels,
    typingUsers,
    setUserTyping,
    updateMessage,
  } = useCommunicationStore();

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const currentChannel = channels.find((c) => c._id === activeChannelId);
  const otherParticipant = allUsers.find((u) => u._id === activeConversationId);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    } catch (err) {
      console.error('Failed to submit message edit:', err);
    }
  };

  const handleDelete = async (msgId: string) => {
    if (!confirm('Are you sure you want to delete this message? This is permanent.')) return;

    try {
      updateMessage(msgId, {
        content: 'This message has been deleted.',
        deletedAt: new Date().toISOString(),
      });

      await fetch(`/api/protected/collaboration/messages/${msgId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const handleToggleReaction = async (msgId: string, emoji: string) => {
    try {
      // Optimistic update would require store reaction map triggers, let's trigger database and wait for broadcast
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

  return (
    <div className="flex flex-1 flex-col bg-slate-900/10">
      {/* Chat Area Top Status Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-6 bg-slate-950/20 backdrop-blur-md">
        <div className="flex items-center gap-2">
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
              <span className="text-xs text-muted-foreground ml-2 border-l border-border pl-3 truncate max-w-[300px]">
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

      {/* Messages Viewer Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
          messages.map((msg) => {
            const isOwner =
              currentUserId &&
              (typeof msg.senderId === 'object'
                ? msg.senderId._id === currentUserId
                : msg.senderId === currentUserId);

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
                        isDeleted && 'text-muted-foreground italic'
                      )}
                    >
                      {msg.content}
                    </p>
                  )}

                  {/* Attachment Previews */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {msg.attachments.map((file, fIdx) => (
                        <a
                          key={fIdx}
                          href={file.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 rounded-lg border border-border bg-slate-950/20 px-3 py-2 text-xs text-foreground hover:bg-slate-900/40 transition-all max-w-[240px] truncate"
                        >
                          <Folder className="h-4 w-4 text-primary" />
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
                    <div className="flex flex-wrap gap-1.5 mt-2">
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
                  <div className="absolute right-4 top-2 hidden group-hover:flex items-center gap-1 bg-slate-950/90 border border-border rounded-lg p-1 shadow-xl backdrop-blur-md">
                    {/* Emojis Toolbar */}
                    {['👍', '🎉', '🔥', '❤️'].map((emo) => (
                      <button
                        key={emo}
                        onClick={() => handleToggleReaction(msg._id, emo)}
                        className="hover:bg-muted p-1 rounded transition-colors text-sm hover:scale-110"
                      >
                        {emo}
                      </button>
                    ))}
                    {isOwner && (
                      <>
                        <button
                          onClick={() => {
                            setEditingMessageId(msg._id);
                            setEditText(msg.content);
                          }}
                          className="hover:bg-muted p-1 rounded transition-colors"
                          title="Edit Message"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(msg._id)}
                          className="hover:bg-muted p-1 rounded transition-colors"
                          title="Delete Message"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-rose-500 hover:text-rose-400" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicators Alarm */}
      {typingString && (
        <div className="px-6 py-1 bg-slate-950/10">
          <span className="text-[10px] text-primary italic font-semibold animate-pulse">
            {typingString}
          </span>
        </div>
      )}
    </div>
  );
}
