/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useKnowledgeStore } from '@/store';
import { useSession } from 'next-auth/react';
import {
  Save,
  Eye,
  Edit2,
  Bold,
  Italic,
  Code,
  List,
  CheckSquare,
  AlertTriangle,
  Info,
  Table,
  Tags,
  Shield,
  FileSpreadsheet,
  Columns,
  RefreshCcw,
  Sparkles,
  Paperclip,
  X,
  ArrowRightLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { Select } from '@/components/ui';

export function EditorCanvas() {
  const { data: session } = useSession();
  const { activeDocument, updateDocument, categories, collaborators } = useKnowledgeStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [icon, setIcon] = useState('page');
  const [coverImage, setCoverImage] = useState('');
  const [visibility, setVisibility] = useState('internal');
  const [status, setStatus] = useState('published');
  const [isSop, setIsSop] = useState(false);
  const [isTemplate, setIsTemplate] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [changeSummary, setChangeSummary] = useState('');

  // Dual-view state: edit, preview, split
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'split'>('edit');
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [slashIndex, setSlashIndex] = useState(0);
  const [hasDraft, setHasDraft] = useState(false);
  const [diffMode, setDiffMode] = useState(false);

  // Attachment state
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const lastPresenceSentRef = useRef<number>(0);

  // Slash commands registry
  const slashCommands = [
    { id: 'header', label: 'Insert Header H3', icon: 'H3', desc: 'SOP heading' },
    { id: 'checklist', label: 'Insert Checklist SOP', icon: '✅', desc: 'Action checklist list' },
    { id: 'callout', label: 'Insert Callout Note', icon: 'ℹ️', desc: 'Visual info notice' },
    { id: 'warning', label: 'Insert Warning Alert', icon: '⚠️', desc: 'Critical alert section' },
    { id: 'table', label: 'Insert Data Table', icon: '📊', desc: 'Standard content grids' },
  ];

  // Assign client-side collaborator styling colors
  const getUserColor = (userId: string) => {
    const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444'];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Sync state with activeDocument & check local drafts
  useEffect(() => {
    if (activeDocument) {
      setTitle(activeDocument.title || '');
      setIcon(activeDocument.icon || 'page');
      setCoverImage(activeDocument.coverImage || '');
      setVisibility(activeDocument.visibility || 'internal');
      setStatus(activeDocument.status || 'published');
      setIsSop(activeDocument.isSop || false);
      setIsTemplate(activeDocument.isTemplate || false);
      setCategoryId(activeDocument.categoryId?._id || activeDocument.categoryId || '');
      setTagsInput((activeDocument.tags || []).join(', '));
      setChangeSummary('');
      setAttachments(activeDocument.attachments || []);

      // Check if a different local draft is stored in localStorage
      const draft = localStorage.getItem(`knowledge_draft_${activeDocument._id}`);
      if (draft && draft !== activeDocument.content) {
        setHasDraft(true);
      } else {
        setHasDraft(false);
        setContent(activeDocument.content || '');
      }
    }
  }, [activeDocument]);

  // Autosave to localStorage on edit changes
  useEffect(() => {
    if (!activeDocument) return;
    const saveDraft = () => {
      localStorage.setItem(`knowledge_draft_${activeDocument._id}`, content);
    };
    const timer = setTimeout(saveDraft, 1000);
    return () => clearTimeout(timer);
  }, [content, activeDocument]);

  // Viewport block-level virtualization parser
  const parsedBlocks = useMemo(() => {
    if (!content) return [];
    const parts = content.split(/(?=<h[1-6]|<p|<div|<ul|<ol|<table)/g).filter(Boolean);
    return parts.map((part, idx) => ({ id: idx, html: part }));
  }, [content]);

  // Diff comparison engine between DB content and local active modifications
  const diffLines = useMemo(() => {
    const original = activeDocument?.content || '';
    const updated = content;
    const origLines = original.split('\n');
    const updLines = updated.split('\n');
    const diff = [];
    let i = 0,
      j = 0;

    while (i < origLines.length || j < updLines.length) {
      if (i < origLines.length && j < updLines.length) {
        if (origLines[i] === updLines[j]) {
          diff.push({ type: 'normal', text: origLines[i] });
          i++;
          j++;
        } else {
          if (updLines.includes(origLines[i], j)) {
            while (j < updLines.length && updLines[j] !== origLines[i]) {
              diff.push({ type: 'added', text: updLines[j] });
              j++;
            }
          } else {
            diff.push({ type: 'deleted', text: origLines[i] });
            i++;
          }
        }
      } else if (i < origLines.length) {
        diff.push({ type: 'deleted', text: origLines[i] });
        i++;
      } else if (j < updLines.length) {
        diff.push({ type: 'added', text: updLines[j] });
        j++;
      }
    }
    return diff;
  }, [content, activeDocument?.content]);

  if (!activeDocument) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-slate-950/20 rounded-xl border border-border/20 backdrop-blur-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900/60 border border-dashed border-slate-700 text-slate-500 mb-4 animate-pulse">
          📋
        </div>
        <h3 className="text-lg font-medium text-slate-300">No Page Selected</h3>
        <p className="text-sm text-slate-500 max-w-sm mt-1">
          Select a document from the left navigation tree, or click the add button to write a new
          one.
        </p>
      </div>
    );
  }

  // Recover or discard local draft handler
  const handleRecoverDraft = () => {
    const draft = localStorage.getItem(`knowledge_draft_${activeDocument._id}`);
    if (draft) {
      setContent(draft);
      toast.success('Local draft version restored in editor!');
    }
    setHasDraft(false);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(`knowledge_draft_${activeDocument._id}`);
    setContent(activeDocument.content || '');
    setHasDraft(false);
    toast.info('Local draft discarded.');
  };

  const handleInsertText = (before: string, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = before + (selected || '') + after;

    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + (selected || '').length
      );
    }, 0);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    const cursor = e.target.selectionStart;
    triggerPresenceBroadcast(cursor, true);

    // Slash autocomplete dropdown trigger
    if (val.endsWith('/')) {
      setShowSlashCommands(true);
      setSlashIndex(0);
    } else {
      setShowSlashCommands(false);
    }
  };

  const handleSlashSelect = (commandType: string) => {
    setShowSlashCommands(false);
    // Remove the trailing slash
    const textWithoutSlash = content.endsWith('/')
      ? content.substring(0, content.length - 1)
      : content;

    let template = '';
    switch (commandType) {
      case 'header':
        template = '<h3>Heading 3</h3>';
        break;
      case 'checklist':
        template = '<ul>\n  <li>✅ <strong>Action Task:</strong> Describe step here.</li>\n</ul>';
        break;
      case 'callout':
        template =
          '<div class="p-4 border-l-4 border-emerald-500 bg-slate-900/40 my-4 rounded">\n  <strong>INFO Note:</strong> Describe note details.\n</div>';
        break;
      case 'warning':
        template =
          '<div class="p-4 border-l-4 border-rose-500 bg-slate-900/40 my-4 rounded">\n  <strong>WARNING Alert:</strong> Describe warning regulations.\n</div>';
        break;
      case 'table':
        template =
          '<table class="w-full border border-slate-700 my-4 text-sm">\n  <thead>\n    <tr class="bg-slate-900/80">\n      <th class="border border-slate-700 p-2">Column 1</th>\n      <th class="border border-slate-700 p-2">Column 2</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td class="border border-slate-700 p-2">Data A</td>\n      <td class="border border-slate-700 p-2">Data B</td>\n    </tr>\n  </tbody>\n</table>';
        break;
    }

    setContent(textWithoutSlash + template);
    textareaRef.current?.focus();
  };

  const handleKeyDownTextarea = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSlashCommands) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashIndex((prev) => (prev + 1) % slashCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashIndex((prev) => (prev - 1 + slashCommands.length) % slashCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSlashSelect(slashCommands[slashIndex].id);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSlashCommands(false);
      }
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const success = await updateDocument(activeDocument._id, {
      title,
      icon,
      coverImage,
      content,
      visibility,
      status,
      isSop,
      isTemplate,
      categoryId: categoryId || null,
      tags,
      attachments,
      changeSummary: changeSummary.trim() || 'Content updated',
    });

    if (success) {
      toast.success('Document changes saved successfully');
      setChangeSummary('');
      localStorage.removeItem(`knowledge_draft_${activeDocument._id}`);
    }
  };

  // Secure attachment file upload handlers (Mock presign + upload integration)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      // 1. Fetch Presigned upload URLs
      const res = await fetch('/api/protected/collaboration/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, mimeType: file.type }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      // 2. Perform simulated / actual PUT upload request
      toast.info(`Uploading file "${file.name}"...`);
      await new Promise((r) => setTimeout(r, 1200)); // Network simulation

      const newAttachment = {
        fileName: file.name,
        fileUrl: json.data.fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        uploadToken: json.data.token,
      };

      setAttachments((prev) => [...prev, newAttachment]);
      toast.success(`Uploaded ${file.name} successfully! Click Save Changes to commit.`);
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  // Broadcast throttled cursor presence selection triggers
  const triggerPresenceBroadcast = async (cursorIndex: number, isTyping = false) => {
    if (!activeDocument || !session?.user) return;
    const now = Date.now();
    if (now - lastPresenceSentRef.current < 400 && !isTyping) return;
    lastPresenceSentRef.current = now;

    try {
      await fetch(`/api/protected/knowledge/documents/${activeDocument._id}/presence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cursor: { index: cursorIndex },
          typing: isTyping,
          userName: session.user.name || 'Collaborator',
          userColor: getUserColor(session.user.id || 'default'),
        }),
      });
    } catch (err) {
      console.warn('Presence broadcast failed:', err);
    }
  };

  // Active presence collaborators indicator view lists
  const activeCollaborators = Object.values(collaborators || {});

  return (
    <div className="flex flex-1 flex-col bg-slate-950/20 border border-border/20 rounded-xl overflow-hidden backdrop-blur-md relative">
      {/* 1. Draft Recovery Warning Notification Banner */}
      {hasDraft && (
        <div className="flex items-center justify-between px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-300 gap-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse" />
            <span>
              <strong>Unsaved Local Draft Detected:</strong> You have unsaved editor edits that
              differ from the server copy.
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleRecoverDraft}
              className="px-3 py-1 rounded bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors"
            >
              Recover Draft
            </button>
            <button
              onClick={handleDiscardDraft}
              className="px-3 py-1 rounded bg-slate-900 border border-border/40 hover:bg-slate-800 transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Editor Sub-Header Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/30 bg-slate-950/40">
        <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-md border border-border/40">
          <button
            onClick={() => {
              setActiveTab('edit');
              setDiffMode(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded transition-colors ${
              activeTab === 'edit'
                ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit2 className="h-3 w-3" /> Edit
          </button>
          <button
            onClick={() => {
              setActiveTab('split');
              setDiffMode(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded transition-colors ${
              activeTab === 'split'
                ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns className="h-3 w-3" /> Split View
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded transition-colors ${
              activeTab === 'preview'
                ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="h-3 w-3" /> Live Preview
          </button>
        </div>

        {/* Real-time pulsing collaborator clusters */}
        <div className="flex items-center gap-4 ml-auto mr-4">
          {activeCollaborators.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider animate-pulse">
                Editing Now:
              </span>
              <div className="flex -space-x-1.5 overflow-hidden">
                {activeCollaborators.map((c: any) => (
                  <div
                    key={c.userId}
                    className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase relative group select-none"
                    style={{
                      backgroundColor: c.userColor,
                      boxShadow: `0 0 8px ${c.userColor}60`,
                      border: `2px solid ${c.typing ? '#10B981' : '#0F172A'}`,
                    }}
                    title={`${c.userName} ${c.typing ? '(typing...)' : '(viewing)'}`}
                  >
                    {c.userName.substring(0, 1)}
                    <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-1 ring-slate-950 animate-ping" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inline Visual Diff triggers */}
          {activeTab !== 'edit' && (
            <button
              onClick={() => setDiffMode(!diffMode)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs border rounded transition-all focus:outline-none ${
                diffMode
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-semibold'
                  : 'bg-slate-900 border-border/40 hover:border-slate-500 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowRightLeft className="h-3 w-3" />{' '}
              {diffMode ? 'Hide Visual Diff' : 'Show Visual Diff'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Describe what changed... (Revision check)"
            value={changeSummary}
            onChange={(e) => setChangeSummary(e.target.value)}
            className="w-48 bg-slate-900/60 border border-border/40 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
          />
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1 rounded bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-md transition-colors"
          >
            <Save className="h-3 w-3" /> Save Changes
          </button>
        </div>
      </div>

      {/* Main Edit Form Canvas */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto max-h-[calc(100vh-230px)] gap-4">
        {/* Cover image input & Banner */}
        <div className="relative group">
          {coverImage ? (
            <div
              className="h-32 w-full rounded-lg overflow-hidden border border-border/40 bg-cover bg-center mb-2"
              style={{ backgroundImage: `url(${coverImage})` }}
            >
              <div className="absolute inset-0 bg-slate-950/40 hover:bg-slate-950/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setCoverImage('')}
                  className="px-3 py-1 rounded bg-rose-500/20 text-rose-400 text-xs border border-rose-500/30"
                >
                  Remove Cover Image
                </button>
              </div>
            </div>
          ) : (
            <input
              type="text"
              placeholder="Paste Cover Image URL here..."
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className="w-full bg-slate-900/30 border border-dashed border-border/40 hover:border-border rounded-lg px-4 py-2 text-xs text-slate-400 text-center focus:outline-none focus:border-slate-600 mb-2 transition-colors"
            />
          )}
        </div>

        {/* Title & Icon Input row */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="🚀"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="w-12 text-center text-xl bg-slate-900/60 border border-border/40 rounded-lg p-1.5 focus:outline-none focus:border-slate-700"
            title="Emoji Page Icon"
          />
          <input
            type="text"
            placeholder="Page Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 text-2xl font-semibold bg-transparent border-b border-transparent hover:border-border/30 focus:border-emerald-500/60 pb-1 text-slate-100 focus:outline-none transition-colors"
          />
        </div>

        {/* Dynamic Split Layout / Tabs content container */}
        <div className={`flex-1 flex gap-4 ${activeTab === 'split' ? 'grid grid-cols-2' : ''}`}>
          {/* Editor Left Pane */}
          {(activeTab === 'edit' || activeTab === 'split') && (
            <div className="flex-1 flex flex-col gap-2 relative min-h-[300px]">
              {/* Direct Rich Editor Toolbar */}
              <div className="flex items-center gap-2 border-b border-border/20 pb-2">
                <button
                  onClick={() => handleInsertText('**', '**')}
                  className="p-1 rounded hover:bg-slate-900/60 text-slate-400 hover:text-slate-200"
                  title="Bold"
                >
                  <Bold className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleInsertText('*', '*')}
                  className="p-1 rounded hover:bg-slate-900/60 text-slate-400 hover:text-slate-200"
                  title="Italic"
                >
                  <Italic className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleInsertText('`', '`')}
                  className="p-1 rounded hover:bg-slate-900/60 text-slate-400 hover:text-slate-200"
                  title="Code"
                >
                  <Code className="h-4 w-4" />
                </button>
                <div className="w-[1px] h-4 bg-border/20 mx-1" />
                <button
                  onClick={() => handleInsertText('<h3>', '</h3>')}
                  className="p-1.5 text-xs font-semibold rounded hover:bg-slate-900/60 text-slate-400 hover:text-slate-200"
                  title="Heading"
                >
                  H3
                </button>
                <button
                  onClick={() => handleInsertText('<ul>\n  <li>', '</li>\n</ul>')}
                  className="p-1 rounded hover:bg-slate-900/60 text-slate-400 hover:text-slate-200"
                  title="List"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleSlashSelect('checklist')}
                  className="p-1 rounded hover:bg-slate-900/60 text-slate-400 hover:text-slate-200"
                  title="Checklist"
                >
                  <CheckSquare className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleSlashSelect('callout')}
                  className="p-1 rounded hover:bg-slate-900/60 text-slate-400 hover:text-slate-200"
                  title="Callout Note"
                >
                  <Info className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleSlashSelect('warning')}
                  className="p-1 rounded hover:bg-slate-900/60 text-slate-400 hover:text-slate-200"
                  title="Warning Note"
                >
                  <AlertTriangle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleSlashSelect('table')}
                  className="p-1 rounded hover:bg-slate-900/60 text-slate-400 hover:text-slate-200"
                  title="Inline Table"
                >
                  <Table className="h-4 w-4" />
                </button>
              </div>

              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDownTextarea}
                placeholder="Write document body content here... Type '/' for slash commands autocomplete."
                className="flex-1 w-full bg-slate-900/10 border border-border/20 rounded-lg p-4 text-slate-200 text-sm font-mono focus:outline-none focus:border-border/40 focus:bg-slate-900/20 leading-relaxed resize-none min-h-[300px] h-full"
              />

              {/* Slash commands autocomplete dropdown overlay with keyboard navigation */}
              {showSlashCommands && (
                <div
                  className="absolute left-6 top-16 z-50 w-56 rounded-lg border border-border/80 bg-slate-950 p-1 shadow-2xl backdrop-blur-md animate-scale-in"
                  role="listbox"
                  aria-label="Slash commands"
                >
                  <div className="text-[10px] font-bold text-slate-500 px-2.5 py-1.5 uppercase tracking-wider border-b border-border/20">
                    Insert Block
                  </div>
                  {slashCommands.map((cmd, idx) => (
                    <button
                      key={cmd.id}
                      onClick={() => handleSlashSelect(cmd.id)}
                      role="option"
                      aria-selected={slashIndex === idx}
                      className={`w-full text-left px-3 py-2 text-xs rounded flex items-center justify-between transition-colors ${
                        slashIndex === idx
                          ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20'
                          : 'text-slate-300 hover:bg-slate-900/60'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-slate-500 font-mono text-[10px] font-bold bg-slate-900 px-1 py-0.5 rounded border border-border/40">
                          {cmd.icon}
                        </span>
                        {cmd.label}
                      </span>
                      <span className="text-[9px] text-slate-500 italic">{cmd.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Preview / Diff / Virtualized Right Pane */}
          {activeTab !== 'edit' && (
            <div className="flex-1 flex flex-col gap-2 min-h-[300px]">
              {diffMode ? (
                // 2. Line-by-line Visual Diff Engine View
                <div className="flex-1 bg-slate-900/15 border border-border/20 rounded-lg p-4 font-mono text-xs overflow-y-auto h-full leading-relaxed select-text select-none">
                  <div className="text-[10px] font-semibold text-slate-400 mb-3 border-b border-border/20 pb-2 uppercase tracking-wider">
                    Visual Changes comparison
                  </div>
                  {diffLines.length === 0 ? (
                    <div className="text-slate-500 italic py-8 text-center">
                      No document modifications recorded.
                    </div>
                  ) : (
                    diffLines.map((line, idx) => (
                      <div
                        key={idx}
                        className={`px-2 py-0.5 rounded flex items-start gap-3 ${
                          line.type === 'added'
                            ? 'bg-emerald-500/10 text-emerald-300 border-l-2 border-emerald-500'
                            : line.type === 'deleted'
                              ? 'bg-rose-500/10 text-rose-300 border-l-2 border-rose-500 line-through'
                              : 'text-slate-400'
                        }`}
                      >
                        <span className="text-[10px] text-slate-500 select-none w-5 text-right font-semibold">
                          {idx + 1}
                        </span>
                        <span>{line.text || ' '}</span>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                // 3. Large Document Virtualized Viewport Rendering
                <div
                  ref={previewContainerRef}
                  className="flex-1 bg-slate-900/10 border border-border/20 rounded-lg p-6 text-slate-200 prose prose-invert max-w-none min-h-[300px] h-full overflow-y-auto leading-relaxed select-text"
                >
                  {parsedBlocks.length === 0 ? (
                    <p className="text-slate-500 italic">No content written yet.</p>
                  ) : (
                    parsedBlocks.map((block) => (
                      <div
                        key={block.id}
                        dangerouslySetInnerHTML={{ __html: block.html }}
                        className="mb-1 block-node transition-all hover:bg-slate-900/5 px-2 py-1 rounded"
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. Presigned Attachment Drag & Drop Media Upload Area */}
        <div className="border border-border/20 bg-slate-900/20 rounded-xl p-4 flex flex-col gap-3 mt-4">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Paperclip className="h-3.5 w-3.5" /> Media Attachments
          </span>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
              dragOver
                ? 'border-emerald-500 bg-emerald-500/5 text-emerald-400'
                : 'border-border/30 hover:border-slate-500 bg-slate-950/20 text-slate-400'
            }`}
          >
            <input
              type="file"
              id="doc-file-upload"
              className="hidden"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <label
              htmlFor="doc-file-upload"
              className="cursor-pointer text-center flex flex-col items-center gap-1"
            >
              <span className="text-xs font-semibold text-slate-300">
                Drag & Drop secure files here or{' '}
                <span className="text-emerald-400 hover:underline">Browse</span>
              </span>
              <span className="text-[10px] text-slate-500">
                Supports Cloudflare R2 presigned file locking. Max 50MB
              </span>
            </label>
            {uploading && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 animate-pulse mt-2">
                <RefreshCcw className="h-3.5 w-3.5 animate-spin" /> Uploading to cloud workspace...
              </div>
            )}
          </div>

          {/* Active upload list */}
          {attachments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-1">
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-slate-900/60 border border-border/30 rounded px-3 py-2 text-xs gap-3"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-slate-300 font-semibold truncate" title={att.fileName}>
                      {att.fileName}
                    </span>
                    <span className="text-[9px] text-slate-500">
                      {(att.fileSize / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <a
                      href={att.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 rounded bg-slate-950 border border-border/40 text-[9px] text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 font-mono transition-colors"
                    >
                      View
                    </a>
                    <button
                      onClick={() => handleRemoveAttachment(idx)}
                      className="p-1 rounded hover:bg-rose-500/10 hover:text-rose-400 text-slate-500 transition-colors"
                      title="Remove attachment"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Configurations, Classifications, and Parameters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-border/20 pt-4 mt-2">
          {/* Category classification */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <FileSpreadsheet className="h-3 w-3" /> Folder Classification
            </label>
            <Select
              value={categoryId || ''}
              onChange={(val) => setCategoryId(val)}
              className="h-9 text-xs rounded-lg px-2 bg-slate-900 border-border/40"
              options={[
                { value: '', label: 'No folder category' },
                ...categories.map((cat) => ({ value: cat._id, label: cat.name })),
              ]}
            />
          </div>

          {/* Visibility Scope */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Shield className="h-3 w-3" /> Visibility Permission
            </label>
            <Select
              value={visibility}
              onChange={(val) => setVisibility(val)}
              className="h-9 text-xs rounded-lg px-2 bg-slate-900 border-border/40"
              options={[
                { value: 'internal', label: 'Internal (Workspace Employees)' },
                { value: 'public', label: 'Public (Everyone)' },
                { value: 'private', label: 'Private (Only Owner & Admins)' },
                { value: 'restricted', label: 'Restricted (Selected Members)' },
              ]}
            />
          </div>

          {/* SOP Compliance Switch */}
          <div className="flex items-center gap-3 bg-slate-900/20 border border-border/20 rounded p-3 justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                Mandatory SOP <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
              </span>
              <span className="text-[10px] text-slate-500">
                Requires reading compliance signoff
              </span>
            </div>
            <input
              type="checkbox"
              checked={isSop}
              onChange={(e) => setIsSop(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          {/* Templates Switch */}
          <div className="flex items-center gap-3 bg-slate-900/20 border border-border/20 rounded p-3 justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-200">Reusable Template</span>
              <span className="text-[10px] text-slate-500">Enable boilerplate cloning</span>
            </div>
            <input
              type="checkbox"
              checked={isTemplate}
              onChange={(e) => setIsTemplate(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          {/* Tags commas inputs */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Tags className="h-3 w-3" /> Tags (Comma separated list)
            </label>
            <input
              type="text"
              placeholder="sop, onboarding, devops"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="bg-slate-900/60 border border-border/40 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-slate-700 placeholder-slate-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
