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

interface WikiTreeProps {
  spaceId: string;
}

export function WikiTree({ spaceId }: WikiTreeProps) {
  const { documents, createDocument, deleteDocument, activeDocument, setActiveDocument } =
    useKnowledgeStore();

  // Root elements have no parentDocumentId
  const rootDocs = documents.filter((d) => d.spaceId === spaceId && !d.parentDocumentId);

  const handleCreateRoot = async () => {
    const title = prompt('Enter page title:');
    if (!title) return;
    const newDoc = await createDocument({
      spaceId,
      title,
      content: '<h3>Write something...</h3>',
      icon: 'page',
      visibility: 'internal',
    });
    if (newDoc) {
      setActiveDocument(newDoc);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="flex items-center justify-between border-b border-border/40 pb-2 px-2">
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Pages</span>
        <button
          onClick={handleCreateRoot}
          className="flex h-5 w-5 items-center justify-center rounded border border-border bg-slate-950/40 hover:bg-emerald-500/10 hover:border-emerald-500/40 text-slate-400 hover:text-emerald-400 transition-colors"
          title="Add new root page"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      <div className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
        {rootDocs.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500 italic">
            No pages created yet. Click &quot;+&quot; to start.
          </div>
        ) : (
          rootDocs.map((doc) => <WikiTreeNode key={doc._id} doc={doc} depth={0} />)
        )}
      </div>
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

  const children = documents.filter((d) => d.parentDocumentId === doc._id);
  const isActive = activeDocument?._id === doc._id;

  const handleSelect = () => {
    setActiveDocument(doc);
  };

  const handleAddChild = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const title = prompt(`Enter sub-page title for "${doc.title}":`);
    if (!title) return;
    const newDoc = await createDocument({
      spaceId: doc.spaceId,
      parentDocumentId: doc._id,
      title,
      content: '<h3>Start writing sub-page...</h3>',
      icon: 'page',
      visibility: 'internal',
    });
    if (newDoc) {
      setIsOpen(true);
      setActiveDocument(newDoc);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      confirm(
        `Are you sure you want to delete "${doc.title}"? This will recursively soft-delete all child sub-pages.`
      )
    ) {
      await deleteDocument(doc._id);
    }
  };

  return (
    <div className="flex flex-col">
      <div
        onClick={handleSelect}
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
        className={cn(
          'group flex items-center justify-between py-1.5 px-2 rounded-md cursor-pointer transition-colors text-sm',
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
            className="p-0.5 rounded hover:bg-slate-950/40 text-slate-500 hover:text-slate-300 transition-colors"
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
            className="p-1 rounded hover:bg-slate-950/60 hover:text-emerald-400 text-slate-500"
            title="Create nested sub-page"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 rounded hover:bg-slate-950/60 hover:text-rose-400 text-slate-500"
            title="Soft delete page recursively"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {isOpen && children.length > 0 && (
        <div className="flex flex-col mt-0.5 pl-1 border-l border-border/10 ml-3">
          {children.map((child) => (
            <WikiTreeNode key={child._id} doc={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
