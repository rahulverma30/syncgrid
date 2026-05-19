'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Smile,
  Paperclip,
  Bold,
  Italic,
  Code,
  X,
  File,
  Eye,
  EyeOff,
  Sparkles,
  Command,
  UploadCloud,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { useCommunicationStore } from '@/store';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/cn';
import { toast } from 'sonner';

interface MessageComposerProps {
  onSendMessage: (content: string, attachments?: any[]) => void;
}

const AVAILABLE_SLASH_COMMANDS = [
  { cmd: '/pin', desc: 'Pin a critical message to this channel workspace', icon: Sparkles },
  {
    cmd: '/announce',
    desc: 'Post a major announcement warning to all team members',
    icon: Command,
  },
  { cmd: '/mute', desc: 'Mute notifications from this active collaboration channel', icon: EyeOff },
  { cmd: '/archive', desc: 'Archive this workspace thread room', icon: X },
];

export function MessageComposer({ onSendMessage }: MessageComposerProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const { activeChannelId, activeConversationId } = useCommunicationStore();
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Live Markdown & Layout States
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [selectedCmdIndex, setSelectedCmdIndex] = useState(0);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 1. DRAFT AUTOSAVE ENGINE: Caches unposted messages locally per channel
  const draftKey = activeChannelId
    ? `syncgrid:draft:channel:${activeChannelId}`
    : activeConversationId
      ? `syncgrid:draft:dm:${activeConversationId}`
      : '';

  useEffect(() => {
    if (!draftKey) return;
    const cached = localStorage.getItem(draftKey);
    const timer = setTimeout(() => {
      setText(cached || '');
    }, 0);
    return () => clearTimeout(timer);
  }, [draftKey]);

  const handleTextChange = (value: string) => {
    setText(value);
    if (draftKey) {
      localStorage.setItem(draftKey, value);
    }

    // Trigger Slash Command Helper overlay
    if (value.startsWith('/')) {
      setShowCommands(true);
    } else {
      setShowCommands(false);
    }

    // Debounce active typing indicators
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    handleTypingHeartbeat();

    typingTimeoutRef.current = setTimeout(async () => {
      // 2.5s user silent, clear indicator
    }, 2500);
  };

  // Keyboard power shortcuts support (Ctrl+Enter to send, Esc to discard)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommands) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCmdIndex((prev) => (prev + 1) % AVAILABLE_SLASH_COMMANDS.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCmdIndex(
          (prev) => (prev - 1 + AVAILABLE_SLASH_COMMANDS.length) % AVAILABLE_SLASH_COMMANDS.length
        );
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        applySlashCommand(AVAILABLE_SLASH_COMMANDS[selectedCmdIndex].cmd);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowCommands(false);
        return;
      }
    }

    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSubmit();
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const applySlashCommand = (cmd: string) => {
    setText(cmd + ' ');
    setShowCommands(false);
    textareaRef.current?.focus();
    if (draftKey) {
      localStorage.setItem(draftKey, cmd + ' ');
    }
  };

  const handleTypingHeartbeat = async () => {
    if (!currentUserId) return;
    try {
      await fetch('/api/protected/collaboration/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'online', currentChannelId: activeChannelId || undefined }),
      });
    } catch (err) {
      // Silent typing indicators failover
    }
  };

  // 2. TRUE CLOUD STORAGE UPLOAD: Presigned URL orchestration workflow
  const triggerSecureCloudUpload = () => {
    // Dynamically spawn a file chooser
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '*/*'; // Accept all file formats

    fileInput.onchange = async (event: any) => {
      const file = event.target?.files?.[0];
      if (!file) return;

      // Restrict payload to safe bounds (e.g. 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size exceeds the 50MB enterprise limit.');
        return;
      }

      setUploadingFile(true);
      setUploadProgress(0);

      try {
        // Step A: Request isolated presigned URL and verification token from API
        const res = await fetch('/api/protected/collaboration/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type || 'application/octet-stream',
          }),
        });
        const creds = await res.json();

        if (creds.success) {
          const { uploadUrl, fileUrl, token, key } = creds.data;

          // Step B: Direct PUT binary stream using XHR for realtime upload progress updates
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', uploadUrl);
          xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

          xhr.upload.onprogress = (progressEvent) => {
            if (progressEvent.lengthComputable) {
              const percentage = Math.round((progressEvent.loaded / progressEvent.total) * 100);
              setUploadProgress(percentage);
            }
          };

          xhr.onload = () => {
            if (xhr.status === 200) {
              const attachmentMetadata = {
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type || 'application/octet-stream',
                fileUrl,
                key,
                uploadToken: token,
              };

              setAttachments((prev) => [...prev, attachmentMetadata]);
              toast.success(`Uploaded ${file.name} successfully.`);
            } else {
              toast.error(`Upload failed with status code ${xhr.status}.`);
            }
            setUploadProgress(null);
            setUploadingFile(false);
          };

          xhr.onerror = () => {
            toast.error('Network connection error uploading attachment.');
            setUploadProgress(null);
            setUploadingFile(false);
          };

          xhr.send(file);
        } else {
          toast.error(creds.message || 'Presign credentials check failed.');
          setUploadProgress(null);
          setUploadingFile(false);
        }
      } catch (err) {
        toast.error('Cloud attachment upload failed.');
        console.error(err);
        setUploadProgress(null);
        setUploadingFile(false);
      }
    };

    fileInput.click();
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const applyFormatting = (tag: string) => {
    const textarea = textareaRef.current;
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
    if (draftKey) {
      localStorage.setItem(draftKey, newText);
    }
  };

  const appendEmoji = (emoji: string) => {
    const updated = text + emoji;
    setText(updated);
    if (draftKey) {
      localStorage.setItem(draftKey, updated);
    }
  };

  const handleSubmit = () => {
    if (!text.trim() && attachments.length === 0) return;
    onSendMessage(text, attachments);
    setText('');
    setAttachments([]);
    setShowCommands(false);
    setIsPreviewOpen(false);
    if (draftKey) {
      localStorage.removeItem(draftKey);
    }
  };

  // 3. LIVE MARKDOWN RENDER ENGINE: Parse formatting in real-time
  const renderedMarkdown = () => {
    let html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(
        /`(.*?)`/g,
        '<code class="bg-slate-900 px-1 py-0.5 rounded text-rose-400 font-mono text-xs">$1</code>'
      );
    return {
      __html:
        html || '<span class="text-muted-foreground/40 italic">Type to preview rendering...</span>',
    };
  };

  return (
    <div
      className="border-t border-border bg-slate-950/20 p-4 backdrop-blur-md relative"
      role="form"
      aria-label="Message Composer Form"
    >
      {/* Autocomplete Slash Commands Overlay panel */}
      {showCommands && (
        <div
          className="absolute bottom-full left-4 right-4 mb-2 bg-slate-950/95 border border-border rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl z-20"
          role="listbox"
          aria-label="Slash commands autocomplete list"
        >
          <div className="px-4 py-2 border-b border-border bg-slate-900/50 flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Available Workspace Actions
            </span>
            <span className="text-[9px] text-muted-foreground/60">
              Press Up/Down to navigate, Enter to select
            </span>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {AVAILABLE_SLASH_COMMANDS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.cmd}
                  onClick={() => applySlashCommand(item.cmd)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-2.5 text-xs text-left transition-all',
                    idx === selectedCmdIndex
                      ? 'bg-primary/20 text-primary font-bold border-l-2 border-primary'
                      : 'text-foreground/95 hover:bg-muted/40'
                  )}
                  role="option"
                  aria-selected={idx === selectedCmdIndex}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    <span className="font-mono text-primary font-bold">{item.cmd}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate">{item.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* File Upload List */}
      {(attachments.length > 0 || uploadingFile) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 rounded-lg border border-border bg-slate-950/40 px-3 py-1.5 text-xs text-foreground animate-pulse"
            >
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <div className="flex flex-col">
                <span className="font-semibold">{file.fileName}</span>
                <span className="text-[9px] text-muted-foreground">
                  {Math.round(file.fileSize / 1024)} KB | Cloud Storage Secure Key
                </span>
              </div>
              <button
                onClick={() => removeAttachment(idx)}
                className="text-muted-foreground hover:text-rose-400 p-0.5 rounded transition-colors ml-1"
                aria-label="Remove uploaded attachment file"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {uploadingFile && uploadProgress !== null && (
            <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs text-foreground animate-pulse">
              <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
              <div className="flex flex-col min-w-[120px]">
                <span className="font-semibold text-primary">Uploading to Cloud...</span>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="bg-primary h-full transition-all duration-150"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
              <span className="text-[10px] font-bold text-primary shrink-0">{uploadProgress}%</span>
            </div>
          )}
        </div>
      )}

      {/* Editor & Live Preview Container splits */}
      <div className="rounded-xl border border-border bg-background focus-within:ring-1 focus-within:ring-primary/80 overflow-hidden shadow-2xl relative">
        {isPreviewOpen ? (
          <div
            className="w-full px-4 py-3.5 text-sm text-foreground/90 h-20 overflow-y-auto bg-slate-950/45 border-b border-border/20"
            dangerouslySetInnerHTML={renderedMarkdown()}
            aria-live="polite"
          />
        ) : (
          <textarea
            ref={textareaRef}
            id="composer-textarea"
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              activeChannelId
                ? 'Type message or use markdown... Press Ctrl+Enter to dispatch'
                : 'Write a direct message... Ctrl+Enter to dispatch'
            }
            className="w-full bg-transparent px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none resize-none h-20"
            aria-label="Composer input field text editor"
          />
        )}

        {/* Toolbar Helpers Controls */}
        <div className="flex items-center justify-between border-t border-border bg-slate-950/10 px-3 py-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => applyFormatting('bold')}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Apply Bold markdown selection"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              onClick={() => applyFormatting('italic')}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Apply Italic markdown selection"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              onClick={() => applyFormatting('code')}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Apply Code Block formatting"
            >
              <Code className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-border mx-1" />
            <button
              onClick={triggerSecureCloudUpload}
              disabled={uploadingFile}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Upload Secure File to Cloud bucket"
              aria-label="Attach local file upload to cloud storage"
            >
              <UploadCloud
                className={cn('h-4 w-4', uploadingFile && 'animate-bounce text-primary')}
              />
            </button>

            {/* Markdown Preview Tab */}
            <div className="h-4 w-px bg-border mx-1" />
            <button
              onClick={() => setIsPreviewOpen(!isPreviewOpen)}
              className={cn(
                'rounded px-2 py-0.5 text-[10px] font-bold border transition-colors flex items-center gap-1',
                isPreviewOpen
                  ? 'bg-primary/20 border-primary/30 text-primary'
                  : 'bg-transparent border-border text-muted-foreground hover:text-foreground'
              )}
              title="Toggle Live Markdown Formatting Preview pane"
            >
              {isPreviewOpen ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              <span>Preview</span>
            </button>

            {/* Quick Emoji Toolbar pickers */}
            <div className="h-4 w-px bg-border mx-1 hidden sm:block" />
            <div className="hidden sm:flex items-center">
              {['👍', '🎉', '🔥', '💡', '🚀'].map((emo) => (
                <button
                  key={emo}
                  onClick={() => appendEmoji(emo)}
                  className="hover:bg-muted px-1.5 py-0.5 rounded transition-colors text-xs hover:scale-125"
                  aria-label={`Insert emoji ${emo}`}
                >
                  {emo}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!text.trim() && attachments.length === 0}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow transition-all hover:bg-primary/95',
              !text.trim() && attachments.length === 0 && 'opacity-40 cursor-not-allowed'
            )}
            title="Send Message (Ctrl+Enter)"
            aria-label="Submit message envelope"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
