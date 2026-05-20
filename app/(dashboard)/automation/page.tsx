'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAutomationStore } from '@/store/automationStore';
import { PageHeader } from '@/components/ui/page-header';
import { WorkflowBuilder } from '@/components/automation/WorkflowBuilder';
import { ExecutionMonitor } from '@/components/automation/ExecutionMonitor';
import { ApprovalManager } from '@/components/automation/ApprovalManager';
import { TemplateGallery } from '@/components/automation/TemplateGallery';
import { GitCommit, Activity, UserCheck, FolderOpen } from 'lucide-react';

export default function AutomationPage() {
  const { activeTab, setActiveTab } = useAutomationStore();

  const tabsConfig = [
    { id: 'builder', label: 'Visual Workflow Builder', icon: <GitCommit className="h-4 w-4" /> },
    { id: 'executions', label: 'Executions Monitor', icon: <Activity className="h-4 w-4" /> },
    { id: 'approvals', label: 'Approvals Inbox', icon: <UserCheck className="h-4 w-4" /> },
    { id: 'templates', label: 'Blueprints Library', icon: <FolderOpen className="h-4 w-4" /> },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <PageHeader
          eyebrow="Orchestration Module"
          title="Business Process Automation Engine"
          description="Design multi-step visual workflows, coordinate sequential manager approvals, automate HR/Finance tasks, and track execution trace logs in real-time."
        />
      </div>

      {/* Tabs Control Switcher Console */}
      <div className="border-b border-border flex flex-wrap gap-1 select-none overflow-x-auto pb-px">
        {tabsConfig.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 outline-none -mb-px ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="activeTabGlow"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_1px_8px_rgba(var(--primary-rgb),0.5)]"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Dynamic Tab Panels */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === 'builder' && (
            <motion.div
              key="builder"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <WorkflowBuilder />
            </motion.div>
          )}

          {activeTab === 'executions' && (
            <motion.div
              key="executions"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <ExecutionMonitor />
            </motion.div>
          )}

          {activeTab === 'approvals' && (
            <motion.div
              key="approvals"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <ApprovalManager />
            </motion.div>
          )}

          {activeTab === 'templates' && (
            <motion.div
              key="templates"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <TemplateGallery />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
