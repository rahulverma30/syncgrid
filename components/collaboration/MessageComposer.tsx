'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile, Paperclip, Bold, Italic, Code, X, File } from 'lucide-react';
import { useCommunicationStore } from '@/store';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/cn';

interface MessageComposerProps {
  onSendMessage: (content: string, attachments?: any[]) => void;
}

export function MessageComposer({ onSendMessage }: MessageComposerProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const { activeChannelId, activeConversationId } = useCommunicationStore();
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTypingHeartbeat = async () => {
    if (!currentUserId) return;

    try {
      // Pulse typing heartbeat to other connected team members via REST
      await fetch('/api/protected/collaboration/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'online', currentChannelId: activeChannelId || undefined }),
      });
    } catch (err) {
      console.error('Failed to trigger typing heartbeat:', err);
    }
  };

  const handleTextChange = (value: string) => {
    setText(value);

    // Debounce active typing indicators
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    handleTypingHeartbeat();

    typingTimeoutRef.current = setTimeout(async () => {
      // After 2.5s user stopped typing, reset heartbeat state
    }, 2500);
  };

  const addAttachment = () => {
    const mockFiles = [
      {
        fileName: 'onboarding-guidelines.pdf',
        fileSize: 1024 * 342,
        mimeType: 'application/pdf',
        fileUrl: '#',
      },
      {
        fileName: 'q2-charts-cockpit.png',
        fileSize: 1024 * 1280,
        mimeType: 'image/png',
        fileUrl: '#',
      },
      {
        fileName: 'company-budget-ledger.xlsx',
        fileSize: 1024 * 512,
        mimeType: 'application/vnd.ms-excel',
        fileUrl: '#',
      },
    ];
    // Random file select
    const file = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    setAttachments((prev) => [...prev, file]);
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const applyFormatting = (tag: string) => {
    const textarea = document.getElementById('composer-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = text.substring(start, end);
    let replacement = '';

    if (tag === 'bold') replacement = `**${selected || 'bold'}**`;
    if (tag === 'italic') replacement = `*${selected || 'italic'}*`;
    if (tag === 'code') replacement = `\`${selected || 'code'}\``;

    const newText = text.substring(0, start) + replacement + text.substring(end);
    setText(newText);
    textarea.focus();
  };

  const appendEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
  };

  const handleSubmit = () => {
    if (!text.trim() && attachments.length === 0) return;
    onSendMessage(text, attachments);
    setText('');
    setAttachments([]);
  };

  return (
    <div className="border-t border-border bg-slate-950/20 p-4 backdrop-blur-md">
      {/* File Upload List */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 rounded-lg border border-border bg-slate-950/40 px-3 py-1.5 text-xs text-foreground"
            >
              <File className="h-4 w-4 text-primary" />
              <div className="flex flex-col">
                <span className="font-semibold">{file.fileName}</span>
                <span className="text-[9px] text-muted-foreground">
                  {Math.round(file.fileSize / 1024)} KB
                </span>
              </div>
              <button
                onClick={() => removeAttachment(idx)}
                className="text-muted-foreground hover:text-rose-400 p-0.5 rounded transition-colors ml-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Editor Main Content container */}
      <div className="rounded-lg border border-border bg-background focus-within:ring-1 focus-within:ring-primary overflow-hidden shadow-inner">
        <textarea
          id="composer-textarea"
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            activeChannelId
              ? 'Post a reply, reference files, or format text with markdown...'
              : 'Write a direct message...'
          }
          className="w-full bg-transparent px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none resize-none h-20"
        />

        {/* Toolbar Helpers Controls */}
        <div className="flex items-center justify-between border-t border-border bg-slate-950/10 px-3 py-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => applyFormatting('bold')}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              onClick={() => applyFormatting('italic')}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              onClick={() => applyFormatting('code')}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Code block"
            >
              <Code className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-border mx-1" />
            <button
              onClick={addAttachment}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Attach File"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            {/* Quick Emoji Toolbar picker */}
            <div className="h-4 w-px bg-border mx-1" />
            {['👍', '🎉', '🔥', '💡', '🚀'].map((emo) => (
              <button
                key={emo}
                onClick={() => appendEmoji(emo)}
                className="hover:bg-muted px-1.5 py-0.5 rounded transition-colors text-xs hover:scale-115"
              >
                {emo}
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!text.trim() && attachments.length === 0}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow transition-all hover:bg-primary/95',
              !text.trim() && attachments.length === 0 && 'opacity-40 cursor-not-allowed'
            )}
            title="Send Message"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
