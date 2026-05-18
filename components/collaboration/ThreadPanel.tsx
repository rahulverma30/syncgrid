'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare, CornerDownRight } from 'lucide-react';
import { useCommunicationStore } from '@/store';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';

export function ThreadPanel() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const repliesEndRef = useRef<HTMLDivElement>(null);

  const {
    activeThreadParent,
    setActiveThreadParent,
    threadReplies,
    addThreadReply,
    updateMessage,
  } = useCommunicationStore();

  const [text, setText] = useState('');

  // Fetch replies when thread parent selected
  useEffect(() => {
    if (!activeThreadParent) return;

    const fetchReplies = async () => {
      try {
        const res = await fetch(
          `/api/protected/collaboration/threads?parentMessageId=${activeThreadParent._id}`
        );
        const data = await res.json();
        if (data.success) {
          useCommunicationStore.setState({ threadReplies: data.data });
        }
      } catch (err) {
        console.error('Failed to load thread replies:', err);
      }
    };

    fetchReplies();
  }, [activeThreadParent]);

  // Scroll to bottom on new replies
  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadReplies]);

  if (!activeThreadParent) return null;

  const handleSendReply = async () => {
    if (!text.trim()) return;

    try {
      const tempReply = {
        _id: Math.random().toString(36).substring(7),
        senderId: {
          _id: currentUserId || 'me',
          name: session?.user?.name || 'Me',
          email: session?.user?.email || '',
        },
        content: text,
        createdAt: new Date().toISOString(),
      };

      // Append reply immediately to UI for lag-free typing
      addThreadReply(tempReply);

      // Increment parent reply count in state
      const nextCount = (activeThreadParent.replyCount || 0) + 1;
      updateMessage(activeThreadParent._id, { replyCount: nextCount });

      setText('');

      const res = await fetch('/api/protected/collaboration/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentMessageId: activeThreadParent._id,
          content: text,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Replace temp reply with populated DB reply
        useCommunicationStore.setState((state) => ({
          threadReplies: state.threadReplies.map((r) => (r._id === tempReply._id ? data.data : r)),
        }));
      }
    } catch (err) {
      console.error('Failed to dispatch thread reply:', err);
    }
  };

  const parentSenderName =
    typeof activeThreadParent.senderId === 'object'
      ? activeThreadParent.senderId.name
      : 'Collaborator';

  return (
    <div className="flex h-full w-80 flex-col border-l border-border bg-slate-950/40 backdrop-blur-md">
      {/* Thread Top Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4 bg-slate-950/20">
        <div className="flex items-center gap-2 text-foreground">
          <CornerDownRight className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold tracking-wide">Thread discussion</span>
        </div>
        <button
          onClick={() => setActiveThreadParent(null)}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Main Replies Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Parent Message Bubble Context */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
              {parentSenderName.substring(0, 1).toUpperCase()}
            </div>
            <span className="text-xs font-bold text-foreground">{parentSenderName}</span>
            <span className="text-[9px] text-muted-foreground">
              {new Date(activeThreadParent.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <p className="text-xs text-foreground/90 break-words leading-relaxed">
            {activeThreadParent.content}
          </p>
        </div>

        <div className="h-px bg-border my-2" />

        {/* Replies List */}
        {threadReplies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-2">
            <MessageSquare className="h-7 w-7 text-muted-foreground/30 animate-pulse" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              No replies posted yet
            </p>
          </div>
        ) : (
          threadReplies.map((rep) => {
            const senderName =
              typeof rep.senderId === 'object' ? rep.senderId.name : 'Collaborator';
            return (
              <motion.div
                key={rep._id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-3 p-2 rounded-lg hover:bg-muted/30"
              >
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-[10px] flex-shrink-0">
                  {senderName.substring(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-foreground">{senderName}</span>
                    <span className="text-[8px] text-muted-foreground">
                      {new Date(rep.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-foreground/90 break-words">
                    {rep.content}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={repliesEndRef} />
      </div>

      {/* Quick Reply Composer Input */}
      <div className="border-t border-border p-3 bg-slate-950/20">
        <div className="flex gap-2 rounded-lg border border-border bg-background px-3 py-1.5 focus-within:ring-1 focus-within:ring-primary items-center">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendReply();
            }}
            placeholder="Reply in thread..."
            className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            onClick={handleSendReply}
            disabled={!text.trim()}
            className={cn(
              'rounded p-1 bg-primary text-primary-foreground transition-all hover:scale-105',
              !text.trim() && 'opacity-40 cursor-not-allowed'
            )}
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
