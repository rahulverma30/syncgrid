'use client';

import React, { useEffect, useState } from 'react';
import { useKnowledgeStore } from '@/store';
import { useSession } from 'next-auth/react';
import { useKnowledgeRealtime } from '@/hooks/useKnowledgeRealtime';
import {
  BookOpen,
  FolderOpen,
  Search,
  Activity,
  AlertTriangle,
  FolderPlus,
  RefreshCcw,
  Sparkles,
  Calendar,
  ShieldCheck,
  User,
} from 'lucide-react';
import Link from 'next/link';

export default function KnowledgeBaseHub() {
  const { data: session } = useSession();
  const companyId = session?.user?.companyId;

  // Initialize SSE event transport listener
  useKnowledgeRealtime(companyId);

  const {
    spaces,
    fetchSpaces,
    fetchCategories,
    analytics,
    fetchAnalytics,
    seedSandbox,
    searchQuery,
    searchResults,
    searchDocuments,
    loading,
  } = useKnowledgeStore();

  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceDesc, setNewSpaceDesc] = useState('');
  const [newSpaceIcon, setNewSpaceIcon] = useState('book-open');
  const [newSpaceVisibility, setNewSpaceVisibility] = useState('internal');

  const { createSpace } = useKnowledgeStore();

  useEffect(() => {
    if (companyId) {
      fetchSpaces();
      fetchCategories();
      fetchAnalytics();
    }
  }, [companyId, fetchSpaces, fetchCategories, fetchAnalytics]);

  const handleCreateSpaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim()) return;

    const success = await createSpace({
      name: newSpaceName.trim(),
      description: newSpaceDesc.trim(),
      icon: newSpaceIcon,
      visibility: newSpaceVisibility,
    });

    if (success) {
      setIsCreatingSpace(false);
      setNewSpaceName('');
      setNewSpaceDesc('');
      setNewSpaceIcon('book-open');
      setNewSpaceVisibility('internal');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    searchDocuments(e.target.value);
  };

  const handleSeed = async () => {
    await seedSandbox();
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 max-w-7xl mx-auto min-h-screen text-slate-100 select-none">
      {/* Upper Glassmorphic Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/20 bg-slate-950/20 p-8 backdrop-blur-md shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2 z-10 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
              Module 14
            </span>
            <span className="text-xs text-slate-500">Enterprise Wiki & SOP Hub</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">
            Knowledge Management Center
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Centralize standard operating procedures (SOPs), company access policies, employee
            onboarding guides, and collaborative project wikis in a premium Notion/Confluence styled
            workspace.
          </p>
        </div>

        {/* Sandbox Seeder loader */}
        {spaces.length === 0 && (
          <div className="z-10 flex flex-col gap-2 items-start justify-center border border-dashed border-border/40 p-4 rounded-xl bg-slate-950/40 backdrop-blur-md max-w-xs">
            <span className="text-xs text-slate-400 font-medium">
              Ready to explore? Populate the sandbox!
            </span>
            <button
              onClick={handleSeed}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-lg transition-all disabled:opacity-40"
            >
              <Sparkles className="h-3.5 w-3.5" /> Seed Sample SOPs & Wikis
            </button>
          </div>
        )}
      </div>

      {/* Fuzzy search input container */}
      <div className="relative w-full z-10">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          placeholder="Search Wiki spaces, SOPs, policies, tags, or articles..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-3 bg-slate-950/20 border border-border/30 hover:border-slate-800 focus:border-emerald-500/60 rounded-xl text-sm text-slate-200 focus:outline-none placeholder-slate-600 shadow-md backdrop-blur-md transition-colors"
        />

        {/* Live Search Results Overlay */}
        {searchQuery.trim() && (
          <div className="absolute left-0 right-0 top-14 z-50 rounded-xl border border-border bg-slate-950/90 p-4 shadow-2xl backdrop-blur-md max-h-96 overflow-y-auto flex flex-col gap-2">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2">
              Matched Results ({searchResults.length})
            </div>
            {searchResults.length === 0 ? (
              <div className="text-center py-6 text-slate-500 italic text-xs">
                No matching articles found. Try another query.
              </div>
            ) : (
              searchResults.map((doc) => (
                <Link
                  key={doc._id}
                  href={`/knowledge/spaces/${doc.spaceId}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-900/60 border border-transparent hover:border-border/10 transition-colors"
                >
                  <span className="text-lg">{doc.icon || '📝'}</span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {doc.title}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                      {doc.spaceId?.name || 'Wiki Space'}
                    </span>
                  </div>
                  {doc.isSop && (
                    <span className="ml-auto text-[9px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-mono">
                      SOP
                    </span>
                  )}
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      {/* Main Spaces catalog grid */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-emerald-400" /> Workspace Wiki Spaces
          </h2>
          <button
            onClick={() => setIsCreatingSpace(!isCreatingSpace)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-950/20 border border-border/40 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-xs text-slate-300 hover:text-emerald-400 transition-colors font-medium"
          >
            <FolderPlus className="h-3.5 w-3.5" /> Create Space
          </button>
        </div>

        {/* Space creation inline card form */}
        {isCreatingSpace && (
          <form
            onSubmit={handleCreateSpaceSubmit}
            className="border border-border/20 bg-slate-950/20 backdrop-blur-md p-6 rounded-xl flex flex-col gap-4 max-w-xl"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              New Space Form
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold">Name</label>
                <input
                  type="text"
                  placeholder="e.g. Design Guidelines"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  className="bg-slate-900/60 border border-border/40 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold">Emoji Icon</label>
                <input
                  type="text"
                  placeholder="e.g. book-open"
                  value={newSpaceIcon}
                  onChange={(e) => setNewSpaceIcon(e.target.value)}
                  className="bg-slate-900/60 border border-border/40 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold">Description</label>
              <textarea
                placeholder="Describe this wiki scope..."
                value={newSpaceDesc}
                onChange={(e) => setNewSpaceDesc(e.target.value)}
                className="bg-slate-900/60 border border-border/40 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none h-16 resize-none"
              />
            </div>
            <div className="flex items-center justify-between border-t border-border/10 pt-4">
              <button
                type="button"
                onClick={() => setIsCreatingSpace(false)}
                className="px-3 py-1.5 rounded hover:bg-slate-900 text-xs text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs"
              >
                Create Wiki Space
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spaces.map((space) => {
            const iconEmoji =
              space.icon === 'book-open'
                ? '📖'
                : space.icon === 'user-plus'
                  ? '👥'
                  : space.icon === 'shield-alert'
                    ? '🔒'
                    : '📁';
            return (
              <Link
                key={space._id}
                href={`/knowledge/spaces/${space._id}`}
                className="group flex flex-col border border-border/20 bg-slate-950/10 hover:bg-slate-950/20 backdrop-blur-md rounded-xl p-5 shadow hover:shadow-lg transition-all border-l-4 border-l-emerald-500"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-200">
                    {iconEmoji}
                  </span>
                  <span className="text-sm font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors truncate">
                    {space.name}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2.5 leading-relaxed line-clamp-2">
                  {space.description || 'Central operational wikis and guidelines.'}
                </p>
                <div className="flex items-center gap-2 border-t border-border/10 pt-3 mt-4 text-[9px] font-mono text-slate-500">
                  <Calendar className="h-3 w-3" /> Updated recently
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Analytics Dashboard bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        {/* SOP Compliance checklist metrics card */}
        <div className="border border-border/20 bg-slate-950/10 backdrop-blur-md p-5 rounded-xl flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> Compliance Sign-offs
          </h3>
          <div className="flex-1 flex flex-col justify-center items-center py-6 gap-2">
            <div className="text-4xl font-extrabold text-emerald-400 font-mono">
              {analytics?.complianceRate || 100}%
            </div>
            <span className="text-xs text-slate-400">Total Mandatory SOP Sign-offs</span>
            <div className="w-full bg-slate-900 border border-border/40 h-2.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${analytics?.complianceRate || 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stale reviews documents alerts panel */}
        <div className="border border-border/20 bg-slate-950/10 backdrop-blur-md p-5 rounded-xl flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse" /> Stale Documents Alert
          </h3>
          <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-48 pr-1">
            {!analytics?.staleDocs || analytics.staleDocs.length === 0 ? (
              <div className="text-center py-10 text-slate-500 italic text-xs">
                All playbooks up to date. Zero stale pages!
              </div>
            ) : (
              analytics.staleDocs.map((doc: any) => (
                <Link
                  key={doc._id}
                  href={`/knowledge/spaces/${doc.spaceId?._id}`}
                  className="flex items-center justify-between p-2 rounded bg-slate-900/40 border border-border/10 hover:border-amber-500/20 text-xs text-slate-300"
                >
                  <span className="truncate pr-2 font-medium">{doc.title}</span>
                  <span className="text-[9px] text-amber-500 font-mono font-semibold">
                    Needs Review
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Contribution Activity Aggregate Timeline Feed */}
        <div className="border border-border/20 bg-slate-950/10 backdrop-blur-md p-5 rounded-xl flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-emerald-400" /> Contribution Feed
          </h3>
          <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-48 pr-1">
            {!analytics?.latestActivities || analytics.latestActivities.length === 0 ? (
              <div className="text-center py-10 text-slate-500 italic text-xs">
                No collaborative activities logged yet.
              </div>
            ) : (
              analytics.latestActivities.map((act: any) => {
                const author = act.userId?.name || 'Workspace Member';
                return (
                  <div
                    key={act._id}
                    className="flex flex-col gap-0.5 border-b border-border/10 pb-1.5 text-[11px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="h-4 w-4 rounded-full bg-slate-950/60 flex items-center justify-center text-slate-500 border border-border">
                        <User className="h-2.5 w-2.5" />
                      </div>
                      <span className="font-semibold text-slate-300">{author}</span>
                      <span className="text-[9px] text-slate-500 ml-auto">
                        {act.createdAt
                          ? new Date(act.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'now'}
                      </span>
                    </div>
                    <p className="text-slate-400 pl-5 leading-normal">{act.details}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
