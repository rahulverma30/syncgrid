'use client';

import React, { useState } from 'react';
import { useKnowledgeStore } from '@/store';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Plus,
  Trash2,
  FolderOpen,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button, CenteredModal, ConfirmationModal } from '@/components/ui';

interface WikiTreeProps {
  spaceId: string;
}

export function WikiTree({ spaceId }: WikiTreeProps) {
  const { documents, createDocument, activeDocument, setActiveDocument } = useKnowledgeStore();
  const [isRootModalOpen, setIsRootModalOpen] = useState(false);
  const [rootTitle, setRootTitle] = useState('');

  // Root elements have no parentDocumentId
  const rootDocs = documents.filter((d) => d.spaceId === spaceId && !d.parentDocumentId);

  const handleCreateRoot = () => {
    setRootTitle('');
    setIsRootModalOpen(true);
  };

  return (
    <div
      className="flex flex-col gap-2 p-2 h-full"
      role="tree"
      aria-label="Wiki Workspace Pages Tree"
    >
      <div className="flex items-center justify-between border-b border-border/40 pb-2 px-2">
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Pages</span>
        <button
          onClick={handleCreateRoot}
          className="flex h-5 w-5 items-center justify-center rounded border border-border bg-slate-950/40 hover:bg-emerald-500/10 hover:border-emerald-500/40 text-slate-400 hover:text-emerald-400 transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500"
          title="Add new root page"
          aria-label="Add new root page"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      <div
        className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1"
        role="presentation"
      >
        {rootDocs.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500 italic" role="status">
            No pages created yet. Click &quot;+&quot; to start.
          </div>
        ) : (
          rootDocs.map((doc) => <WikiTreeNode key={doc._id} doc={doc} depth={0} />)
        )}
      </div>

      {/* Create New Root Page Modal */}
      <CenteredModal
        isOpen={isRootModalOpen}
        onClose={() => setIsRootModalOpen(false)}
        title="Create New Page"
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Page Title
            </label>
            <input
              value={rootTitle}
              onChange={(e) => setRootTitle(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="e.g., Marketing Strategy"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-border/40 pt-4">
            <Button variant="outline" size="sm" onClick={() => setIsRootModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={async () => {
                if (rootTitle.trim()) {
                  const newDoc = await createDocument({
                    spaceId,
                    title: rootTitle.trim(),
                    content: '<h3>Write something...</h3>',
                    icon: 'page',
                    visibility: 'internal',
                  });
                  if (newDoc) setActiveDocument(newDoc);
                  setIsRootModalOpen(false);
                }
              }}
              disabled={!rootTitle.trim()}
            >
              Create Page
            </Button>
          </div>
        </div>
      </CenteredModal>
    </div>
  );
}

interface TreeNodeProps {
  doc: any;
  depth: number;
}

function WikiTreeNode({ doc, depth }: TreeNodeProps) {
  const { documents, activeDocument, setActiveDocument, createDocument, deleteDocument } =
    useKnowledgeStore();
  const [isOpen, setIsOpen] = useState(true);

  // Local Modal States
  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  const [childTitle, setChildTitle] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const children = documents.filter((d) => d.parentDocumentId === doc._id);
  const isActive = activeDocument?._id === doc._id;

  const handleSelect = () => {
    setActiveDocument(doc);
  };

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    setChildTitle('');
    setIsChildModalOpen(true);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteConfirmOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = Array.from(document.querySelectorAll('[role="treeitem"]')) as HTMLElement[];
    const index = items.indexOf(e.currentTarget as HTMLElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = items[index + 1];
      if (next) next.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = items[index - 1];
      if (prev) prev.focus();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (children.length > 0 && !isOpen) {
        setIsOpen(true);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (isOpen) {
        setIsOpen(false);
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect();
    }
  };

  return (
    <div className="flex flex-col" role="presentation">
      <div
        role="treeitem"
        aria-selected={isActive}
        aria-expanded={children.length > 0 ? isOpen : undefined}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onClick={handleSelect}
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
        className={cn(
          'group flex items-center justify-between py-1.5 px-2 rounded-md cursor-pointer transition-colors text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50',
          isActive
            ? 'bg-emerald-500/10 border-l-2 border-emerald-500 text-emerald-400 font-medium'
            : 'hover:bg-slate-900/30 text-slate-300 hover:text-slate-100'
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            tabIndex={-1}
            className="p-0.5 rounded hover:bg-slate-950/40 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label={isOpen ? 'Collapse section' : 'Expand section'}
          >
            {children.length > 0 ? (
              isOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )
            ) : (
              <div className="w-4 h-4 flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-slate-400" />
              </div>
            )}
          </button>

          {doc.isSop ? (
            <span title="SOP Document">
              <BookOpen className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
            </span>
          ) : doc.isTemplate ? (
            <span title="Template Asset">
              <FolderOpen className="h-3.5 w-3.5 flex-shrink-0 text-cyan-500" />
            </span>
          ) : (
            <FileText className="h-3.5 w-3.5 flex-shrink-0 text-slate-400 group-hover:text-slate-200" />
          )}

          <span className="truncate pr-2">{doc.title}</span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleAddChild}
            tabIndex={-1}
            className="p-1 rounded hover:bg-slate-950/60 hover:text-emerald-400 text-slate-500"
            title="Create nested sub-page"
            aria-label="Create nested sub-page"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleDelete}
            tabIndex={-1}
            className="p-1 rounded hover:bg-slate-950/60 hover:text-rose-400 text-slate-500"
            title="Soft delete page recursively"
            aria-label="Soft delete page recursively"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {isOpen && children.length > 0 && (
        <div className="flex flex-col mt-0.5 pl-1 border-l border-border/10 ml-3" role="group">
          {children.map((child) => (
            <WikiTreeNode key={child._id} doc={child} depth={depth + 1} />
          ))}
        </div>
      )}

      {/* Create New Child Page Modal */}
      <CenteredModal
        isOpen={isChildModalOpen}
        onClose={() => setIsChildModalOpen(false)}
        title={`Create Sub-page under "${doc.title}"`}
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Sub-page Title
            </label>
            <input
              value={childTitle}
              onChange={(e) => setChildTitle(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="e.g., Sub-module Blueprint"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-border/40 pt-4">
            <Button variant="outline" size="sm" onClick={() => setIsChildModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={async () => {
                if (childTitle.trim()) {
                  const newDoc = await createDocument({
                    spaceId: doc.spaceId,
                    parentDocumentId: doc._id,
                    title: childTitle.trim(),
                    content: '<h3>Start writing sub-page...</h3>',
                    icon: 'page',
                    visibility: 'internal',
                  });
                  if (newDoc) {
                    setIsOpen(true);
                    setActiveDocument(newDoc);
                  }
                  setIsChildModalOpen(false);
                }
              }}
              disabled={!childTitle.trim()}
            >
              Create Sub-page
            </Button>
          </div>
        </div>
      </CenteredModal>

      {/* Recursively Delete Page Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={async () => {
          await deleteDocument(doc._id);
          setIsDeleteConfirmOpen(false);
        }}
        title="Delete Page Recursively"
        message={`Are you absolutely sure you want to delete "${doc.title}"? This will recursively soft-delete all child sub-pages.`}
        confirmLabel="Delete Page"
        cancelLabel="Cancel"
        type="danger"
      />
    </div>
  );
}
