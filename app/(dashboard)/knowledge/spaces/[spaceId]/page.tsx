'use client';

import React, { useEffect, useState } from 'react';
import { useKnowledgeStore } from '@/store';
import { useSession } from 'next-auth/react';
import { useKnowledgeRealtime } from '@/hooks/useKnowledgeRealtime';
import { WikiTree } from '@/components/knowledge/WikiTree';
import { EditorCanvas } from '@/components/knowledge/EditorCanvas';
import { CommentThreads } from '@/components/knowledge/CommentThreads';
import { HistoryVersionList } from '@/components/knowledge/HistoryVersionList';
import { ReadingAcknowledgePanel } from '@/components/knowledge/ReadingAcknowledgePanel';
import { ChevronLeft, MessageSquare, History, ShieldCheck, Folder } from 'lucide-react';
import Link from 'next/link';

interface WikiSpacePageProps {
  params: {
    spaceId: string;
  };
}

export default function WikiSpaceWorkspace({ params }: WikiSpacePageProps) {
  const { spaceId } = params;
  const { data: session } = useSession();
  const companyId = session?.user?.companyId;

  // Initialize SSE collaborative sync hook
  useKnowledgeRealtime(companyId);

  const {
    spaces,
    fetchSpaces,
    documents,
    fetchDocuments,
    fetchCategories,
    activeSpaceId,
    setActiveSpaceId,
    activeDocument,
    setActiveDocument,
  } = useKnowledgeStore();

  const [activeRightDrawer, setActiveRightDrawer] = useState<
    'comments' | 'history' | 'progress' | null
  >(null);

  useEffect(() => {
    if (companyId) {
      fetchSpaces();
      fetchCategories();
      setActiveSpaceId(spaceId);
      fetchDocuments(spaceId);
    }
  }, [companyId, spaceId, fetchSpaces, fetchCategories, setActiveSpaceId, fetchDocuments]);

  // Find target space info
  const currentSpace = spaces.find((s) => s._id === spaceId);

  // Automatically select the first root document page if none is currently selected
  useEffect(() => {
    if (documents.length > 0 && !activeDocument) {
      const rootDocs = documents.filter((d) => d.spaceId === spaceId && !d.parentDocumentId);
      if (rootDocs.length > 0) {
        setActiveDocument(rootDocs[0]);
      }
    }
  }, [documents, activeDocument, setActiveDocument, spaceId]);

  const toggleRightDrawer = (drawerType: 'comments' | 'history' | 'progress') => {
    if (activeRightDrawer === drawerType) {
      setActiveRightDrawer(null);
    } else {
      setActiveRightDrawer(drawerType);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden text-slate-100 bg-slate-950/10">
      {/* Top Header workspace toolbar */}
      <div className="flex h-14 items-center justify-between border-b border-border/30 bg-slate-950/40 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0 pr-8">
          <Link
            href="/knowledge"
            className="flex h-8 w-8 items-center justify-center rounded bg-slate-900 border border-border/40 hover:border-emerald-500/30 text-slate-400 hover:text-emerald-400 transition-colors"
            title="Back to Knowledge Center"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-1.5 min-w-0">
            <Folder className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold truncate text-slate-200">
              {currentSpace?.name || 'Wiki Workspace'}
            </h2>
          </div>
        </div>

        {/* Right drawer selectors panel buttons */}
        {activeDocument && (
          <div className="flex items-center gap-2">
            {activeDocument.isSop && (
              <button
                onClick={() => toggleRightDrawer('progress')}
                className={`flex h-8 px-3 items-center gap-1.5 rounded-lg border text-xs font-semibold font-mono transition-colors ${
                  activeRightDrawer === 'progress'
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                    : 'bg-slate-900 border-border/40 text-slate-400 hover:text-slate-200'
                }`}
                title="Mandatory SOP Compliance progression signoff"
              >
                <ShieldCheck className="h-3.5 w-3.5" /> SOP Sign-off
              </button>
            )}

            <button
              onClick={() => toggleRightDrawer('comments')}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                activeRightDrawer === 'comments'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-900 border-border/40 text-slate-400 hover:text-slate-200'
              }`}
              title="Page Annotations and Discussions"
            >
              <MessageSquare className="h-4 w-4" />
            </button>

            <button
              onClick={() => toggleRightDrawer('history')}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                activeRightDrawer === 'history'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-900 border-border/40 text-slate-400 hover:text-slate-200'
              }`}
              title="Document Revision history list and checkmarks rollbacks"
            >
              <History className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main split-screen panel container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left pane: collapsible dynamic hierarchy navigation tree */}
        <div className="w-64 border-r border-border/20 bg-slate-950/20 flex flex-col p-2 select-none">
          <WikiTree spaceId={spaceId} />
        </div>

        {/* Center: main markdown workspace text canvas */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          <EditorCanvas />
        </div>

        {/* Right slide-out drawers panels */}
        {activeDocument && activeRightDrawer && (
          <div className="w-80 border-l border-border/20 bg-slate-950/30 p-4 flex flex-col select-none">
            {activeRightDrawer === 'comments' && <CommentThreads />}
            {activeRightDrawer === 'history' && <HistoryVersionList />}
            {activeRightDrawer === 'progress' && <ReadingAcknowledgePanel />}
          </div>
        )}
      </div>
    </div>
  );
}
