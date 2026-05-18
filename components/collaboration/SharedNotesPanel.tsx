'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Save, Pin, ChevronRight, CornerRightDown, Plus, Trash2 } from 'lucide-react';
import { useCommunicationStore } from '@/store';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';

export function SharedNotesPanel() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const { sharedNotes, activeWorkspaceId, addOrUpdateNote } = useCommunicationStore();

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Fetch shared notes for workspace
  useEffect(() => {
    if (!activeWorkspaceId) return;

    const fetchNotes = async () => {
      try {
        const res = await fetch(
          `/api/protected/collaboration/notes?workspaceId=${activeWorkspaceId}`
        );
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          useCommunicationStore.setState({ sharedNotes: data.data });
          // Set first note active by default
          setActiveNoteId(data.data[0]._id);
          setTitle(data.data[0].title);
          setContent(data.data[0].content);
        }
      } catch (err) {
        console.error('Failed to load shared notes:', err);
      }
    };

    fetchNotes();
  }, [activeWorkspaceId]);

  const activeNote = sharedNotes.find((n) => n._id === activeNoteId);

  const handleSelectNote = (note: any) => {
    setActiveNoteId(note._id);
    setTitle(note.title);
    setContent(note.content);
    setIsEditing(false);
  };

  const handleCreateNote = () => {
    setActiveNoteId(null);
    setTitle('New Workspace Note');
    setContent('### Sprint Checklist\n- [ ] Task 1\n- [ ] Task 2');
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!activeWorkspaceId || !title.trim()) return;

    try {
      const bodyPayload: any = {
        workspaceId: activeWorkspaceId,
        title,
        content,
      };

      if (activeNoteId) {
        bodyPayload.noteId = activeNoteId;
      }

      const res = await fetch('/api/protected/collaboration/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });
      const data = await res.json();

      if (data.success) {
        addOrUpdateNote(data.data);
        setActiveNoteId(data.data._id);
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Failed to save shared note:', err);
    }
  };

  return (
    <div className="flex h-full w-80 flex-col border-l border-border bg-slate-950/40 backdrop-blur-md">
      {/* Header Bar */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4 bg-slate-950/20">
        <div className="flex items-center gap-2 text-foreground">
          <FileText className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-bold tracking-wide">Workspace Guidelines</span>
        </div>
        <button
          onClick={handleCreateNote}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          title="Create New Note"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Index List switcher */}
      <div className="border-b border-border p-2 bg-slate-950/10">
        <span className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1 block tracking-wider">
          Pages Index
        </span>
        <div className="flex flex-col gap-0.5 max-h-[120px] overflow-y-auto mt-1">
          {sharedNotes.map((note) => (
            <button
              key={note._id}
              onClick={() => handleSelectNote(note)}
              className={cn(
                'flex items-center justify-between px-2 py-1 rounded-md text-left text-xs font-semibold transition-all',
                activeNoteId === note._id
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <ChevronRight className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{note.title}</span>
              </div>
              {note.isPinned && <Pin className="h-3 w-3 text-amber-500 flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isEditing ? (
          <div className="space-y-3 h-full flex flex-col">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Note Title"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full flex-1 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none h-48"
              placeholder="Write note contents in markdown or plain text..."
            />
          </div>
        ) : activeNote ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-sm font-bold text-foreground">{activeNote.title}</span>
              {activeNote.isPinned && (
                <span className="flex items-center gap-1 text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  <Pin className="h-3 w-3" /> Pinned
                </span>
              )}
            </div>
            <div className="prose prose-sm prose-invert max-w-none">
              <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed">
                {activeNote.content}
              </p>
            </div>
            <div className="text-[10px] text-muted-foreground pt-4 border-t border-border/40">
              Last updated by {activeNote.updatedBy?.name || 'Admin'}
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center space-y-2 py-20 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/30 animate-pulse" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              No notes selected
            </p>
          </div>
        )}
      </div>

      {/* Footer controls */}
      <div className="border-t border-border p-3 bg-slate-950/20 flex gap-2">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-black hover:bg-emerald-400 transition-all hover:scale-[1.02]"
            >
              <Save className="h-3.5 w-3.5" /> Save Note
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
            >
              Cancel
            </button>
          </>
        ) : (
          activeNoteId && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all hover:scale-[1.02]"
            >
              Edit Note
            </button>
          )
        )}
      </div>
    </div>
  );
}
