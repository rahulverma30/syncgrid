'use client';

import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';

export function EditorCanvas() {
  const { data: session } = useSession();
  const { activeDocument, updateDocument, categories, fetchDocumentDetails } = useKnowledgeStore();

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

  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state with activeDocument
  useEffect(() => {
    if (activeDocument) {
      setTitle(activeDocument.title || '');
      setContent(activeDocument.content || '');
      setIcon(activeDocument.icon || 'page');
      setCoverImage(activeDocument.coverImage || '');
      setVisibility(activeDocument.visibility || 'internal');
      setStatus(activeDocument.status || 'published');
      setIsSop(activeDocument.isSop || false);
      setIsTemplate(activeDocument.isTemplate || false);
      setCategoryId(activeDocument.categoryId?._id || activeDocument.categoryId || '');
      setTagsInput((activeDocument.tags || []).join(', '));
      setChangeSummary('');
    }
  }, [activeDocument?._id]);

  if (!activeDocument) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-slate-950/20 rounded-xl border border-border/20 backdrop-blur-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900/60 border border-dashed border-slate-700 text-slate-500 mb-4 animate-pulse">
          📋
        </div>
        <h3 className="text-lg font-medium text-slate-300">No Page Selected</h3>
        <p className="text-sm text-slate-500 max-w-sm mt-1">Select a document from the left navigation tree, or click the add button to write a new one.</p>
      </div>
    );
  }

  const handleInsertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = before + (selected || '') + after;

    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setContent(newContent);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + (selected || '').length);
    }, 0);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    // Slash autocomplete trigger
    if (val.endsWith('/')) {
      setShowSlashCommands(true);
    } else {
      setShowSlashCommands(false);
    }
  };

  const handleSlashSelect = (commandType: string) => {
    setShowSlashCommands(false);
    // Remove the trailing slash before inserting block structures
    const textWithoutSlash = content.substring(0, content.length - 1);
    setContent(textWithoutSlash);

    let template = '';
    switch (commandType) {
      case 'header':
        template = '<h3>Heading 3</h3>';
        break;
      case 'checklist':
        template = '<ul>\n  <li>✅ <strong>Action Task:</strong> Describe step here.</li>\n</ul>';
        break;
      case 'callout':
        template = '<div class="p-4 border-l-4 border-blue-500 bg-slate-950/40 my-4 rounded">\n  <strong>INFO Note:</strong> Describe note details.\n</div>';
        break;
      case 'warning':
        template = '<div class="p-4 border-l-4 border-red-500 bg-slate-950/40 my-4 rounded">\n  <strong>WARNING Alert:</strong> Describe warning regulations.\n</div>';
        break;
      case 'table':
        template = '<table class="w-full border-collapse border border-slate-700 my-4 text-sm">\n  <thead>\n    <tr class="bg-slate-900/60">\n      <th class="border border-slate-700 p-2">Column 1</th>\n      <th class="border border-slate-700 p-2">Column 2</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td class="border border-slate-700 p-2">Data A</td>\n      <td class="border border-slate-700 p-2">Data B</td>\n    </tr>\n  </tbody>\n</table>';
        break;
    }

    setContent(textWithoutSlash + template);
    textareaRef.current?.focus();
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
      changeSummary: changeSummary.trim() || 'Content updated',
    });

    if (success) {
      toast.success('Document changes saved successfully');
      setChangeSummary('');
    }
  };

  return (
    <div className="flex flex-1 flex-col bg-slate-950/20 border border-border/20 rounded-xl overflow-hidden backdrop-blur-md relative">
      {/* Editor Sub-Header Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/30 bg-slate-950/40">
        <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-md border border-border/40">
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded transition-colors ${
              activeTab === 'edit'
                ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit2 className="h-3 w-3" /> Edit
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
            className="flex items-center gap-1.5 px-4 py-1 rounded bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-medium text-xs shadow-md transition-colors"
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
            <div className="h-32 w-full rounded-lg overflow-hidden border border-border/40 bg-cover bg-center mb-2" style={{ backgroundImage: `url(${coverImage})` }}>
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

        {activeTab === 'edit' ? (
          <div className="flex-1 flex flex-col gap-2 relative min-h-[300px]">
            {/* Direct Rich Editor Toolbar */}
            <div className="flex items-center gap-2 border-b border-border/20 pb-2">
              <button onClick={() => handleInsertText('**', '**')} className="p-1 rounded hover:bg-slate-900/60 text-slate-400 hover:text-slate-200" title="Bold"><Bold className="h-4 w-4" /></button>
              <button onClick={() => handleInsertText('*', '*')} className="p-1 rounded hover:bg-slate-900/60 text-slate-400 hover:text-slate-200" title="Italic"><Italic className="h-4 w-4" /></button>
              <button onClick={() => handleInsertText('`', '`')} className="p-1 rounded hover:bg-slate-900/60 text-slate-400 hover:text-slate-200" title="Code"><Code className="h-4 w-4" /></button>
              <div className="w-[1px] h-4 bg-border/20 mx-1" />
              <button onClick={() => handleInsertText('<h3>', '</h3>')} className="p-1.5 text-xs font-semibold rounded hover:bg-slate-900/60 text-slate-400 hover:text-slate-200" title="Heading">H3</button>
              <button onClick={() => handleInsertText('<ul>\n  <li>', '</li>\n</ul>')} className="p-1 rounded hover:bg-slate-900/60 text-slate-400 hover:text-slate-200" title="List"><List className="h-4 w-4" /></button>
              <button onClick={() => handleSlashSelect('checklist')} className="p-1 rounded hover:bg-slate-900/60 text-slate-400 hover:text-slate-200" title="Checklist"><CheckSquare className="h-4 w-4" /></button>
              <button onClick={() => handleSlashSelect('callout')} className="p-1 rounded hover:bg-slate-900/60 text-slate-400 hover:text-slate-200" title="Callout Note"><Info className="h-4 w-4" /></button>
              <button onClick={() => handleSlashSelect('warning')} className="p-1 rounded hover:bg-slate-900/60 text-slate-400 hover:text-slate-200" title="Warning Note"><AlertTriangle className="h-4 w-4" /></button>
              <button onClick={() => handleSlashSelect('table')} className="p-1 rounded hover:bg-slate-900/60 text-slate-400 hover:text-slate-200" title="Inline Table"><Table className="h-4 w-4" /></button>
            </div>

            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextareaChange}
              placeholder="Write document body content here... Type '/' for slash commands helper overlays."
              className="flex-1 w-full bg-slate-900/10 border border-border/20 rounded-lg p-4 text-slate-200 text-sm font-mono focus:outline-none focus:border-border/40 focus:bg-slate-900/20 leading-relaxed resize-none min-h-[300px]"
            />

            {/* Slash commands autocomplete dropdown overlay */}
            {showSlashCommands && (
              <div className="absolute left-6 top-16 z-50 w-52 rounded-lg border border-border bg-slate-950 p-1 shadow-2xl backdrop-blur-md">
                <div className="text-[10px] font-semibold text-slate-500 px-2.5 py-1.5 uppercase tracking-wider">Slash Commands</div>
                <button onClick={() => handleSlashSelect('header')} className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-900/60 rounded flex items-center gap-2"><span>H3</span> Insert Header H3</button>
                <button onClick={() => handleSlashSelect('checklist')} className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-900/60 rounded flex items-center gap-2"><CheckSquare className="h-3 w-3 text-amber-500" /> Insert Checklist SOP</button>
                <button onClick={() => handleSlashSelect('callout')} className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-900/60 rounded flex items-center gap-2"><Info className="h-3 w-3 text-blue-400" /> Insert Callout Note</button>
                <button onClick={() => handleSlashSelect('warning')} className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-900/60 rounded flex items-center gap-2"><AlertTriangle className="h-3 w-3 text-rose-500" /> Insert Warning Alert</button>
                <button onClick={() => handleSlashSelect('table')} className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-900/60 rounded flex items-center gap-2"><Table className="h-3 w-3 text-emerald-500" /> Insert Data Table</button>
              </div>
            )}
          </div>
        ) : (
          <div
            className="flex-1 bg-slate-900/10 border border-border/20 rounded-lg p-6 text-slate-200 prose prose-invert max-w-none min-h-[300px] leading-relaxed select-text"
            dangerouslySetInnerHTML={{ __html: content || '<p class="text-slate-500 italic">No content written yet.</p>' }}
          />
        )}

        {/* Configurations, Classifications, and Parameters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-border/20 pt-4 mt-2">
          {/* Category classification */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1"><FileSpreadsheet className="h-3 w-3" /> Folder Classification</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="bg-slate-900/60 border border-border/40 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
            >
              <option value="">No folder category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Visibility Scope */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1"><Shield className="h-3 w-3" /> Visibility Permission</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="bg-slate-900/60 border border-border/40 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
            >
              <option value="internal">Internal (Workspace Employees)</option>
              <option value="public">Public (Everyone)</option>
              <option value="private">Private (Only Owner & Admins)</option>
            </select>
          </div>

          {/* SOP Compliance Switch */}
          <div className="flex items-center gap-3 bg-slate-900/20 border border-border/20 rounded p-3 justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-200">Mandatory SOP</span>
              <span className="text-[10px] text-slate-500">Requires reading confirm</span>
            </div>
            <input
              type="checkbox"
              checked={isSop}
              onChange={(e) => setIsSop(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
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
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
            />
          </div>

          {/* Tags commas inputs */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1"><Tags className="h-3 w-3" /> Tags (Comma separated list)</label>
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
