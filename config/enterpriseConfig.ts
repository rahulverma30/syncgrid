export interface WorkflowStatus {
  id: string;
  label: string;
  category: 'backlog' | 'in-progress' | 'completed' | 'hold';
  colorToken: string;
  cssVariable: string;
  allowedTransitions: string[]; // transitions list
  isTerminal: boolean;
}

export const ENTERPRISE_WORKFLOWS: Record<string, WorkflowStatus> = {
  planning: {
    id: 'planning',
    label: 'Planning',
    category: 'backlog',
    colorToken: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    cssVariable: 'var(--status-planning, #3b82f6)',
    allowedTransitions: ['design', 'on-hold', 'cancelled'],
    isTerminal: false,
  },
  design: {
    id: 'design',
    label: 'Design Specs',
    category: 'backlog',
    colorToken: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    cssVariable: 'var(--status-design, #6366f1)',
    allowedTransitions: ['planning', 'development', 'on-hold', 'cancelled'],
    isTerminal: false,
  },
  development: {
    id: 'development',
    label: 'Development',
    category: 'in-progress',
    colorToken: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    cssVariable: 'var(--status-development, #f59e0b)',
    allowedTransitions: ['design', 'testing', 'on-hold', 'cancelled'],
    isTerminal: false,
  },
  testing: {
    id: 'testing',
    label: 'QA Testing',
    category: 'in-progress',
    colorToken: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    cssVariable: 'var(--status-testing, #a855f7)',
    allowedTransitions: ['development', 'deployment', 'on-hold', 'cancelled'],
    isTerminal: false,
  },
  deployment: {
    id: 'deployment',
    label: 'Deployment',
    category: 'in-progress',
    colorToken: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    cssVariable: 'var(--status-deployment, #06b6d4)',
    allowedTransitions: ['testing', 'completed', 'on-hold', 'cancelled'],
    isTerminal: false,
  },
  completed: {
    id: 'completed',
    label: 'Completed',
    category: 'completed',
    colorToken: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    cssVariable: 'var(--status-completed, #10b981)',
    allowedTransitions: [],
    isTerminal: true,
  },
  'on-hold': {
    id: 'on-hold',
    label: 'On Hold',
    category: 'hold',
    colorToken: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    cssVariable: 'var(--status-onhold, #64748b)',
    allowedTransitions: ['planning', 'design', 'development', 'testing', 'deployment', 'cancelled'],
    isTerminal: false,
  },
  cancelled: {
    id: 'cancelled',
    label: 'Cancelled',
    category: 'hold',
    colorToken: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    cssVariable: 'var(--status-cancelled, #f43f5e)',
    allowedTransitions: [],
    isTerminal: true,
  },
};

export const ENTERPRISE_HEALTH_WEIGHTS = {
  overdueMilestonePenalty: 12,
  hoursOverrunFactor: 15,
  capacityViolationPenalty: 5,
  criticalRiskPenalty: 20,
  highRiskPenalty: 12,
  mediumRiskPenalty: 7,
  lowRiskPenalty: 3,
};
