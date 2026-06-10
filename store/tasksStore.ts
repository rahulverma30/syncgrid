import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface TaskType {
  _id: string;
  code: string;
  title: string;
  description: string;
  projectId: any;
  sprintId?: string;
  milestoneId?: string;
  parentId?: string | null;
  assignees: any[];
  watchers: any[];
  statusId: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  severity: 'low' | 'medium' | 'high' | 'critical';
  storyPoints: number;
  estimatedHours: number;
  actualHours: number;
  dueDate?: string;
  startDate?: string;
  completedDate?: string;
  isArchived: boolean;
  healthScore: number;
  requiresClientApproval?: boolean;
  clientApprovalStatus?: 'pending' | 'approved' | 'rejected';
  checklistItems: any[];
  attachments: any[];
  dependencies: any[];
  subtasks?: TaskType[];
  followers?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface StatusType {
  _id: string;
  name: string;
  key: string;
  category: 'backlog' | 'todo' | 'in_progress' | 'done';
  color: string;
  order: number;
  isDefault: boolean;
  isSystem: boolean;
}

export interface LabelType {
  _id: string;
  name: string;
  color: string;
  description: string;
}

interface TasksFilter {
  search: string;
  projectId: string;
  sprintId: string;
  statusId: string;
  priority: string;
  severity: string;
  assigneeId: string;
  isArchived: boolean;
}

interface TasksState {
  tasks: TaskType[];
  statuses: StatusType[];
  labels: LabelType[];
  activeTask: TaskType | null;
  filters: TasksFilter;
  isLoading: boolean;
  isFetchingActiveTask: boolean;
  runningTimer: {
    taskId: string;
    startTime: string;
    taskTitle?: string;
    projectName?: string;
    estimatedHours?: number;
  } | null;

  // Actions
  fetchTasks: () => Promise<void>;
  fetchStatuses: () => Promise<void>;
  fetchLabels: () => Promise<void>;
  fetchSingleTask: (idOrCode: string) => Promise<void>;
  setActiveTask: (task: TaskType | null) => void;
  setFilters: (filters: Partial<TasksFilter>) => void;
  resetFilters: () => void;

  // Task Mutations
  createTask: (payload: any) => Promise<boolean>;
  updateTask: (taskId: string, payload: any) => Promise<boolean>;
  updateTaskStatusOptimistic: (taskId: string, targetStatusId: string) => Promise<boolean>;
  deleteTask: (taskId: string) => Promise<boolean>;

  // Checklist Actions
  addChecklistItem: (taskId: string, title: string) => Promise<void>;
  toggleChecklistItem: (taskId: string, itemId: string) => Promise<void>;

  // Dependency Actions
  addDependency: (
    taskId: string,
    targetTaskId: string,
    type: 'blocked_by' | 'blocks' | 'relates_to'
  ) => Promise<boolean>;

  // Timelog Actions
  startTimer: (taskId: string) => Promise<void>;
  stopTimer: (taskId: string, description: string, billable: boolean) => Promise<void>;
  logManualTime: (taskId: string, payload: any) => Promise<void>;

  // Realtime Connector
  connectRealtime: (projectId?: string) => () => void;
}

const initialFilters: TasksFilter = {
  search: '',
  projectId: '',
  sprintId: '',
  statusId: '',
  priority: '',
  severity: '',
  assigneeId: '',
  isArchived: false,
};

export const useTasksStore = create<TasksState>()(
  devtools((set, get) => ({
    tasks: [],
    statuses: [],
    labels: [],
    activeTask: null,
    filters: initialFilters,
    isLoading: false,
    isFetchingActiveTask: false,
    runningTimer: null,

    fetchTasks: async () => {
      set({ isLoading: true });
      try {
        const {
          search,
          projectId,
          sprintId,
          statusId,
          priority,
          severity,
          assigneeId,
          isArchived,
        } = get().filters;

        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (projectId) params.append('projectId', projectId);
        if (sprintId) params.append('sprintId', sprintId);
        if (statusId) params.append('statusId', statusId);
        if (priority) params.append('priority', priority);
        if (severity) params.append('severity', severity);
        if (assigneeId) params.append('assigneeId', assigneeId);
        params.append('isArchived', isArchived.toString());

        const res = await fetch(`/api/protected/tasks?${params.toString()}`);
        const result = await res.json();
        if (result.success) {
          set({ tasks: result.data });
        }
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
      } finally {
        set({ isLoading: false });
      }
    },

    fetchStatuses: async () => {
      try {
        const res = await fetch('/api/protected/tasks/settings/statuses');
        const result = await res.json();
        if (result.success) {
          set({ statuses: result.data });
        }
      } catch (err) {
        console.error('Failed to fetch custom statuses:', err);
      }
    },

    fetchLabels: async () => {
      try {
        const res = await fetch('/api/protected/tasks/settings/labels');
        const result = await res.json();
        if (result.success) {
          set({ labels: result.data });
        }
      } catch (err) {
        console.error('Failed to fetch labels:', err);
      }
    },

    fetchSingleTask: async (idOrCode: string) => {
      set({ isFetchingActiveTask: true });
      try {
        const res = await fetch(`/api/protected/tasks/${idOrCode}`);
        const result = await res.json();
        if (result.success) {
          set({ activeTask: result.data });
        }
      } catch (err) {
        console.error('Failed to fetch active task details:', err);
      } finally {
        set({ isFetchingActiveTask: false });
      }
    },

    setActiveTask: (task) => set({ activeTask: task }),

    setFilters: (newFilters) => {
      set((state) => ({ filters: { ...state.filters, ...newFilters } }));
      get().fetchTasks();
    },

    resetFilters: () => {
      set({ filters: initialFilters });
      get().fetchTasks();
    },

    createTask: async (payload) => {
      set({ isLoading: true });
      try {
        const res = await fetch('/api/protected/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (result.success) {
          set((state) => ({ tasks: [result.data, ...state.tasks] }));
          return true;
        }
        return false;
      } catch (err) {
        console.error('Failed to create task:', err);
        return false;
      } finally {
        set({ isLoading: false });
      }
    },

    updateTask: async (taskId, payload) => {
      try {
        const res = await fetch(`/api/protected/tasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (result.success) {
          // Update flat task list
          set((state) => ({
            tasks: state.tasks.map((t) => (t._id === taskId ? result.data : t)),
            activeTask:
              state.activeTask?._id === taskId
                ? { ...state.activeTask, ...result.data }
                : state.activeTask,
          }));
          return true;
        }
        return false;
      } catch (err) {
        console.error('Failed to update task:', err);
        return false;
      }
    },

    updateTaskStatusOptimistic: async (taskId, targetStatusId) => {
      const originalTasks = get().tasks;
      const taskToMove = originalTasks.find((t) => t._id === taskId);
      if (!taskToMove) return false;

      const targetStatus = get().statuses.find((s) => s._id === targetStatusId);
      if (!targetStatus) return false;

      // 1. Instantly update UI State (Optimistic Update)
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t._id === taskId ? { ...t, statusId: { ...t.statusId, ...targetStatus } } : t
        ),
        activeTask:
          state.activeTask?._id === taskId
            ? { ...state.activeTask, statusId: { ...state.activeTask.statusId, ...targetStatus } }
            : state.activeTask,
      }));

      try {
        // 2. Perform server sync call
        const res = await fetch(`/api/protected/tasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ statusId: targetStatusId }),
        });
        const result = await res.json();

        if (!result.success) {
          // Rollback on server error
          set({ tasks: originalTasks });
          return false;
        }

        // Apply automation engine side-effects (or updated payload from server)
        if (result.data) {
          set((state) => {
            const index = state.tasks.findIndex((t) => t._id === taskId);
            const newTasks = [...state.tasks];
            if (index > -1) {
              newTasks[index] = result.data;
            }
            return {
              tasks: newTasks,
              activeTask: state.activeTask?._id === taskId ? result.data : state.activeTask,
            };
          });
        }

        return true;
      } catch (err) {
        console.error('Status transition sync error, rolling back:', err);
        // Rollback on network failure
        set({ tasks: originalTasks });
        return false;
      }
    },

    deleteTask: async (taskId) => {
      try {
        const res = await fetch(`/api/protected/tasks/${taskId}`, {
          method: 'DELETE',
        });
        const result = await res.json();
        if (result.success) {
          set((state) => ({
            tasks: state.tasks.filter((t) => t._id !== taskId),
            activeTask: state.activeTask?._id === taskId ? null : state.activeTask,
          }));
          return true;
        }
        return false;
      } catch (err) {
        console.error('Failed to delete task:', err);
        return false;
      }
    },

    addChecklistItem: async (taskId, title) => {
      try {
        const res = await fetch(`/api/protected/tasks/${taskId}/checklist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
        });
        const result = await res.json();
        if (result.success) {
          set((state) => ({
            activeTask:
              state.activeTask?._id === taskId
                ? { ...state.activeTask, checklistItems: result.data }
                : state.activeTask,
            tasks: state.tasks.map((t) =>
              t._id === taskId ? { ...t, checklistItems: result.data } : t
            ),
          }));
        }
      } catch (err) {
        console.error('Failed to add checklist item:', err);
      }
    },

    toggleChecklistItem: async (taskId, itemId) => {
      try {
        const res = await fetch(`/api/protected/tasks/${taskId}/checklist?itemId=${itemId}`, {
          method: 'PUT',
        });
        const result = await res.json();
        if (result.success) {
          set((state) => ({
            activeTask:
              state.activeTask?._id === taskId
                ? { ...state.activeTask, checklistItems: result.data }
                : state.activeTask,
            tasks: state.tasks.map((t) =>
              t._id === taskId ? { ...t, checklistItems: result.data } : t
            ),
          }));
        }
      } catch (err) {
        console.error('Failed to toggle checklist item:', err);
      }
    },

    addDependency: async (taskId, targetTaskId, type) => {
      try {
        const res = await fetch(`/api/protected/tasks/${taskId}/dependencies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, targetTaskId }),
        });
        const result = await res.json();
        if (result.success) {
          // Re-fetch active task details to refresh dependency graphs
          get().fetchSingleTask(taskId);
          return true;
        }
        return false;
      } catch (err) {
        console.error('Failed to link dependencies:', err);
        return false;
      }
    },

    startTimer: async (taskId) => {
      try {
        const res = await fetch(`/api/protected/tasks/${taskId}/timelogs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start' }),
        });
        const result = await res.json();
        if (result.success) {
          // Fetch task details for the widget display
          let taskTitle = 'Task';
          let projectName = '';
          let estimatedHours = 0;
          try {
            const taskRes = await fetch(`/api/protected/tasks/${taskId}`);
            const taskResult = await taskRes.json();
            if (taskResult.success) {
              taskTitle = taskResult.data.title || 'Task';
              projectName = taskResult.data.projectId?.name || '';
              estimatedHours = taskResult.data.estimatedHours || 0;
            }
          } catch (e) {
            console.error('Failed to fetch task info for timer widget:', e);
          }
          const running = {
            taskId,
            startTime: new Date().toISOString(),
            taskTitle,
            projectName,
            estimatedHours,
          };
          set({ runningTimer: running });
          localStorage.setItem('syncgrid_running_timer', JSON.stringify(running));
        }
      } catch (err) {
        console.error('Failed to start timer:', err);
      }
    },

    stopTimer: async (taskId, description, billable) => {
      try {
        const res = await fetch(`/api/protected/tasks/${taskId}/timelogs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'stop', description, billable }),
        });
        const result = await res.json();
        if (result.success) {
          set({ runningTimer: null });
          localStorage.removeItem('syncgrid_running_timer');
          get().fetchTasks(); // update actual logged hours on main grid
          if (get().activeTask?._id === taskId) {
            get().fetchSingleTask(taskId);
          }
        }
      } catch (err) {
        console.error('Failed to stop timer:', err);
      }
    },

    logManualTime: async (taskId, payload) => {
      try {
        const res = await fetch(`/api/protected/tasks/${taskId}/timelogs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'manual', ...payload }),
        });
        const result = await res.json();
        if (result.success) {
          get().fetchTasks();
          if (get().activeTask?._id === taskId) {
            get().fetchSingleTask(taskId);
          }
        }
      } catch (err) {
        console.error('Failed to log manual time:', err);
      }
    },

    connectRealtime: (projectId?: string) => {
      if (typeof window === 'undefined') return () => {};

      // Close any active event source
      const existing = (window as any).__tasksEventSource__;
      if (existing) {
        existing.close();
      }

      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);

      const eventSource = new EventSource(`/api/protected/tasks/realtime?${params.toString()}`);
      (window as any).__tasksEventSource__ = eventSource;

      eventSource.addEventListener('task_updated', (event: any) => {
        try {
          const sseEvent = JSON.parse(event.data);
          const updatedTask = sseEvent.payload || sseEvent;

          if (!updatedTask || !updatedTask._id) return;

          set((state) => {
            const index = state.tasks.findIndex((t) => t._id === updatedTask._id);
            let newTasks = [...state.tasks];
            if (index > -1) {
              newTasks[index] = updatedTask;
            } else {
              newTasks = [updatedTask, ...newTasks];
            }

            return {
              tasks: newTasks,
              activeTask:
                state.activeTask?._id === updatedTask._id ? updatedTask : state.activeTask,
            };
          });
        } catch (err) {
          console.error('SSE task_updated parse error:', err);
        }
      });

      return () => {
        eventSource.close();
        if ((window as any).__tasksEventSource__ === eventSource) {
          (window as any).__tasksEventSource__ = null;
        }
      };
    },
  }))
);
