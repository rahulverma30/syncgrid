/**
 * Enterprise Automation & Workflow Zustand Store
 * Manages builders visual canvas states, execution tracers, templates, and active approvals list.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface IWorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition';
  x: number;
  y: number;
  data: {
    label: string;
    type: string; // e.g. 'task_created', 'create_task', 'kpi_breached'
    options?: Record<string, any>;
    conditions?: {
      logicalOperator: 'and' | 'or';
      rules: Array<{
        field: string;
        operator: string;
        value: any;
      }>;
    };
  };
}

export interface IWorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: 'success' | 'failure' | 'default';
}

interface AutomationState {
  // Tabs Navigation
  activeTab: 'builder' | 'executions' | 'approvals' | 'templates';
  setActiveTab: (tab: 'builder' | 'executions' | 'approvals' | 'templates') => void;

  // Active definition in builder canvas
  activeWorkflowId: string | null;
  setActiveWorkflowId: (id: string | null) => void;
  workflowName: string;
  setWorkflowName: (name: string) => void;
  workflowDescription: string;
  setWorkflowDescription: (desc: string) => void;
  workflowCategory: 'hr' | 'finance' | 'project' | 'operations' | 'general';
  setWorkflowCategory: (category: 'hr' | 'finance' | 'project' | 'operations' | 'general') => void;
  workflowStatus: 'draft' | 'active' | 'paused';
  setWorkflowStatus: (status: 'draft' | 'active' | 'paused') => void;

  // Visual Nodes Canvas
  nodes: IWorkflowNode[];
  setNodes: (nodes: IWorkflowNode[] | ((prev: IWorkflowNode[]) => IWorkflowNode[])) => void;
  edges: IWorkflowEdge[];
  setEdges: (edges: IWorkflowEdge[] | ((prev: IWorkflowEdge[]) => IWorkflowEdge[])) => void;

  // Selection & Inspector
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;

  // Monitoring Console States
  executions: any[];
  setExecutions: (executions: any[]) => void;
  selectedExecution: any | null;
  setSelectedExecution: (exec: any | null) => void;
  executionLogs: any[];
  setExecutionLogs: (logs: any[]) => void;

  // Approvals & Tasks States
  approvals: any[];
  setApprovals: (approvals: any[]) => void;

  // Sandbox & Seeding Indicators
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // Reset helper
  clearCanvas: () => void;
}

export const useAutomationStore = create<AutomationState>()(
  devtools((set) => ({
    activeTab: 'builder',
    setActiveTab: (activeTab) => set({ activeTab }),

    activeWorkflowId: null,
    setActiveWorkflowId: (activeWorkflowId) => set({ activeWorkflowId }),
    workflowName: 'New Automation Workflow',
    workflowDescription:
      'Triggers operations, tasks dispatch, or sequential approvals in real-time.',
    workflowCategory: 'general',
    setWorkflowCategory: (workflowCategory) => set({ workflowCategory }),
    workflowStatus: 'draft',
    setWorkflowStatus: (workflowStatus) => set({ workflowStatus }),

    setWorkflowName: (workflowName) => set({ workflowName }),
    setWorkflowDescription: (workflowDescription) => set({ workflowDescription }),

    nodes: [],
    setNodes: (nodesInput) =>
      set((state) => ({
        nodes: typeof nodesInput === 'function' ? nodesInput(state.nodes) : nodesInput,
      })),

    edges: [],
    setEdges: (edgesInput) =>
      set((state) => ({
        edges: typeof edgesInput === 'function' ? edgesInput(state.edges) : edgesInput,
      })),

    selectedNodeId: null,
    setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),

    executions: [],
    setExecutions: (executions) => set({ executions }),
    selectedExecution: null,
    setSelectedExecution: (selectedExecution) => set({ selectedExecution }),
    executionLogs: [],
    setExecutionLogs: (executionLogs) => set({ executionLogs }),

    approvals: [],
    setApprovals: (approvals) => set({ approvals }),

    isLoading: false,
    setIsLoading: (isLoading) => set({ isLoading }),
    error: null,
    setError: (error) => set({ error }),

    clearCanvas: () =>
      set({
        activeWorkflowId: null,
        workflowName: 'New Automation Workflow',
        workflowDescription:
          'Triggers operations, tasks dispatch, or sequential approvals in real-time.',
        workflowCategory: 'general',
        workflowStatus: 'draft',
        nodes: [],
        edges: [],
        selectedNodeId: null,
      }),
  }))
);
