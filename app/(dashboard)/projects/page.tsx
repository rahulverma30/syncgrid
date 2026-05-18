'use client';

import React, { useEffect, useState } from 'react';
import { PageHeader, Button, Input, LoadingSpinner } from '@/components/ui';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useProjectsStore } from '@/store/projectsStore';
import {
  ProjectAnalytics,
  ProjectTable,
  ProjectCreateModal,
  ProjectDetailDrawer,
} from '@/components/projects';

export default function ProjectsPage() {
  const {
    isLoading,
    fetchProjects,
    activeSection,
    setActiveSection,
    searchQuery,
    setFilters,
    setCreateModalOpen,
  } = useProjectsStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      setMounted(true);
    }, 0);
    fetchProjects();
    return () => clearTimeout(handle);
  }, [fetchProjects]);

  if (!mounted) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner className="h-10 w-10 text-primary" />
        <p className="text-xs text-muted-foreground animate-pulse uppercase font-bold tracking-wider">
          Initializing Projects Intelligence...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Premium Page Header */}
      <PageHeader
        eyebrow="Portfolio & Delivery System"
        title="Project delivery vault"
        description="Monitor active milestone schedules, agile sprint velocity metrics, team resource allocations, and stage risk alerts."
        actions={
          <div className="flex items-center gap-2 select-none">
            <Button
              onClick={fetchProjects}
              variant="outline"
              size="sm"
              className="h-9 hover:bg-accent/40 text-xs gap-1.5 cursor-pointer"
              aria-label="Refresh project accounts"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Tally ledger
            </Button>
            <Button
              onClick={() => setCreateModalOpen(true)}
              variant="default"
              size="sm"
              className="h-9 text-xs gap-1.5 cursor-pointer"
              aria-label="Initialize new client project"
            >
              <Plus className="h-4 w-4" />
              Onboard Project
            </Button>
          </div>
        }
      />

      {/* Tabs selectors & search query */}
      <div className="border-b border-border/85 pb-0 flex justify-between items-center gap-4 flex-wrap select-none">
        <div className="flex gap-2">
          {(['analytics', 'ledger'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveSection(t)}
              className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 relative cursor-pointer ${
                activeSection === t
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'analytics' ? 'Portfolio Analytics' : 'Project Registry Ledger'}
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
        <div className="h-96 flex flex-col items-center justify-center space-y-4">
          <LoadingSpinner className="h-10 w-10 text-primary" />
          <p className="text-xs text-muted-foreground animate-pulse uppercase font-bold tracking-wider">
            Loading dynamic project portfolio vault...
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeSection === 'analytics' ? (
            <ProjectAnalytics key="analytics" />
          ) : (
            <ProjectTable key="ledger" />
          )}
        </AnimatePresence>
      )}

      {/* RENDER POPUPS & SLIDING DRAWER CHANNELS */}
      <ProjectCreateModal />
      <AnimatePresence>
        <ProjectDetailDrawer />
      </AnimatePresence>
    </div>
  );
}
