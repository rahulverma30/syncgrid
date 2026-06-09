'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PageHeader, Button, Input, SkeletonPage } from '@/components/ui';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useProjectsStore } from '@/store/projectsStore';
import { ProjectAnalytics, ProjectTable, ProjectCreateModal } from '@/components/projects';

export default function ProjectsPage() {
  const {
    isLoading,
    fetchProjects,
    activeSection,
    setActiveSection,
    searchQuery,
    statusFilter,
    priorityFilter,
    managerFilter,
    riskFilter,
    billingFilter,
    isArchivedFilter,
    setFilters,
    setCreateModalOpen,
  } = useProjectsStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(handle);
  }, []);

  // Debounce API calls when filters change
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchProjects();
    }, 300);
    return () => clearTimeout(handler);
  }, [
    searchQuery,
    statusFilter,
    priorityFilter,
    managerFilter,
    riskFilter,
    billingFilter,
    isArchivedFilter,
    fetchProjects,
  ]);

  if (!mounted) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="text-sm text-muted-foreground">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Premium Page Header */}
      <PageHeader
        eyebrow="Projects"
        title="All Projects"
        description="Monitor project progress, track milestones, manage team allocations, and stay on top of delivery timelines."
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={fetchProjects}
              variant="outline"
              size="sm"
              className="gap-1.5"
              aria-label="Refresh projects"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button
              onClick={() => setCreateModalOpen(true)}
              variant="default"
              size="sm"
              className="gap-1.5"
              aria-label="Create new project"
            >
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        }
      />

      {/* Tabs selectors & search query */}
      <div className="border-b border-border/85 pb-0 flex justify-between items-center gap-4 flex-wrap select-none">
        <div className="flex gap-1">
          {(['analytics', 'ledger'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveSection(t)}
              className={`pb-2.5 px-4 text-sm font-medium transition-colors border-b-2 relative cursor-pointer ${
                activeSection === t
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'analytics' ? 'Overview' : 'All Projects'}
            </button>
          ))}
        </div>

        {/* Global filter fuzzy search bar */}
        <div className="relative w-full max-w-[220px] mb-2 sm:mb-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
          <Input
            value={searchQuery}
            onChange={(e) => setFilters({ searchQuery: e.target.value })}
            placeholder="Search projects..."
            className="pl-8 h-8 text-xs bg-background/30"
          />
        </div>
      </div>

      {isLoading ? (
        <SkeletonPage cards={4} />
      ) : (
        <AnimatePresence mode="wait">
          {activeSection === 'analytics' ? (
            <ProjectAnalytics key="analytics" />
          ) : (
            <ProjectTable key="ledger" />
          )}
        </AnimatePresence>
      )}

      {/* RENDER POPUPS */}
      <ProjectCreateModal />
    </div>
  );
}
