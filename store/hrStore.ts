import { create } from 'zustand';
import { toast } from 'sonner';

interface HRState {
  employees: any[];
  departmentsTree: any[];
  departmentsList: any[];
  todayPunch: any | null;
  attendanceHistory: any[];
  leaveRequests: any[];
  leaveBalances: Record<string, number>;
  performanceReviews: any[];
  announcements: any[];
  loading: Record<string, boolean>;
  error: string | null;

  // Actions
  fetchEmployees: (search?: string, filters?: Record<string, string>) => Promise<void>;
  fetchDepartments: () => Promise<void>;
  fetchAttendance: (employeeId?: string) => Promise<void>;
  fetchLeaves: () => Promise<void>;
  fetchReviews: (employeeId?: string) => Promise<void>;
  fetchAnnouncements: () => Promise<void>;

  // Mutations
  clockInOut: (workMode: string, location?: string, notes?: string) => Promise<boolean>;
  requestLeave: (payload: {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
  }) => Promise<boolean>;
  approveLeave: (
    id: string,
    status: 'approved' | 'rejected',
    managerNotes?: string
  ) => Promise<boolean>;
  createEmployee: (payload: any) => Promise<boolean>;
  updateEmployee: (id: string, payload: any) => Promise<boolean>;
  deleteEmployee: (id: string) => Promise<boolean>;
  createDepartment: (payload: any) => Promise<boolean>;
  submitPerformanceReview: (payload: any) => Promise<boolean>;
  postAnnouncement: (payload: any) => Promise<boolean>;
  runHrSeeder: () => Promise<boolean>;
}

export const useHRStore = create<HRState>((set, get) => ({
  employees: [],
  departmentsTree: [],
  departmentsList: [],
  todayPunch: null,
  attendanceHistory: [],
  leaveRequests: [],
  leaveBalances: { casualDays: 12, sickDays: 10, paidDays: 15 },
  performanceReviews: [],
  announcements: [],
  loading: {},
  error: null,

  fetchEmployees: async (search = '', filters = {}) => {
    set((state) => ({ loading: { ...state.loading, employees: true }, error: null }));
    try {
      const params = new URLSearchParams({ search });
      Object.entries(filters).forEach(([key, val]) => {
        if (val) params.append(key, val);
      });

      const res = await fetch(`/api/protected/hr?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        set({ employees: json.data });
      } else {
        set({ error: json.message || 'Failed to fetch employees' });
      }
    } catch (err: any) {
      set({ error: err.message || 'Error fetching employees' });
    } finally {
      set((state) => ({ loading: { ...state.loading, employees: false } }));
    }
  },

  fetchDepartments: async () => {
    set((state) => ({ loading: { ...state.loading, departments: true }, error: null }));
    try {
      const res = await fetch('/api/protected/hr/departments');
      const json = await res.json();
      if (json.success) {
        set({
          departmentsTree: json.data.tree,
          departmentsList: json.data.list,
        });
      }
    } catch (err: any) {
      set({ error: err.message || 'Error fetching departments' });
    } finally {
      set((state) => ({ loading: { ...state.loading, departments: false } }));
    }
  },

  fetchAttendance: async (employeeId = '') => {
    set((state) => ({ loading: { ...state.loading, attendance: true } }));
    try {
      const params = employeeId ? `?employeeId=${employeeId}` : '';
      const res = await fetch(`/api/protected/hr/attendance${params}`);
      const json = await res.json();
      if (json.success) {
        set({
          todayPunch: json.data.todayPunch,
          attendanceHistory: json.data.history,
        });
      }
    } catch (err: any) {
      console.error('Error fetching attendance logs:', err);
    } finally {
      set((state) => ({ loading: { ...state.loading, attendance: false } }));
    }
  },

  fetchLeaves: async () => {
    set((state) => ({ loading: { ...state.loading, leaves: true } }));
    try {
      const res = await fetch('/api/protected/hr/leaves');
      const json = await res.json();
      if (json.success) {
        set({
          leaveRequests: json.data.requests,
          leaveBalances: json.data.balances,
        });
      }
    } catch (err: any) {
      console.error('Error fetching leaves:', err);
    } finally {
      set((state) => ({ loading: { ...state.loading, leaves: false } }));
    }
  },

  fetchReviews: async (employeeId = '') => {
    set((state) => ({ loading: { ...state.loading, reviews: true } }));
    try {
      const params = employeeId ? `?employeeId=${employeeId}` : '';
      const res = await fetch(`/api/protected/hr/performance${params}`);
      const json = await res.json();
      if (json.success) {
        set({ performanceReviews: json.data });
      }
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
    } finally {
      set((state) => ({ loading: { ...state.loading, reviews: false } }));
    }
  },

  fetchAnnouncements: async () => {
    set((state) => ({ loading: { ...state.loading, announcements: true } }));
    try {
      const res = await fetch('/api/protected/hr/announcements');
      const json = await res.json();
      if (json.success) {
        set({ announcements: json.data });
      }
    } catch (err: any) {
      console.error('Error fetching announcements:', err);
    } finally {
      set((state) => ({ loading: { ...state.loading, announcements: false } }));
    }
  },

  clockInOut: async (workMode, location = '', notes = '') => {
    set((state) => ({ loading: { ...state.loading, punchAction: true } }));
    try {
      const res = await fetch('/api/protected/hr/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workMode, location, notes }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(
          json.action === 'clocked_in'
            ? `Successfully punched IN (${workMode})`
            : 'Successfully punched OUT! Shift hours updated.'
        );
        // Refresh local punches
        await get().fetchAttendance();
        return true;
      } else {
        toast.error(json.message || 'Action failed');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || 'Clock action failed');
      return false;
    } finally {
      set((state) => ({ loading: { ...state.loading, punchAction: false } }));
    }
  },

  requestLeave: async (payload) => {
    set((state) => ({ loading: { ...state.loading, requestLeave: true } }));
    try {
      const res = await fetch('/api/protected/hr/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Leave request submitted for approval!');
        await get().fetchLeaves();
        return true;
      } else {
        toast.error(json.message || 'Failed to submit leave request');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error submitting request');
      return false;
    } finally {
      set((state) => ({ loading: { ...state.loading, requestLeave: false } }));
    }
  },

  approveLeave: async (id, status, managerNotes = '') => {
    set((state) => ({ loading: { ...state.loading, approveLeave: true } }));
    try {
      const res = await fetch(`/api/protected/hr/leaves?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, managerNotes }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Leave request successfully ${status}!`);
        await get().fetchLeaves();
        // Also refresh employee list to get updated leave balances
        await get().fetchEmployees();
        return true;
      } else {
        toast.error(json.message || 'Approvals action failed');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error processing leave request');
      return false;
    } finally {
      set((state) => ({ loading: { ...state.loading, approveLeave: false } }));
    }
  },

  createEmployee: async (payload) => {
    set((state) => ({ loading: { ...state.loading, editEmployee: true } }));
    try {
      const res = await fetch('/api/protected/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Successfully enrolled ${payload.fullName}!`);
        await get().fetchEmployees();
        return true;
      } else {
        toast.error(json.message || 'Failed to enroll employee');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error enrolling employee');
      return false;
    } finally {
      set((state) => ({ loading: { ...state.loading, editEmployee: false } }));
    }
  },

  updateEmployee: async (id, payload) => {
    set((state) => ({ loading: { ...state.loading, editEmployee: true } }));
    try {
      const res = await fetch(`/api/protected/hr/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Employee profile updated successfully!');
        await get().fetchEmployees();
        return true;
      } else {
        toast.error(json.message || 'Failed to update employee profile');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating profile');
      return false;
    } finally {
      set((state) => ({ loading: { ...state.loading, editEmployee: false } }));
    }
  },

  deleteEmployee: async (id) => {
    set((state) => ({ loading: { ...state.loading, editEmployee: true } }));
    try {
      const res = await fetch(`/api/protected/hr/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Employee offboarded successfully');
        await get().fetchEmployees();
        return true;
      } else {
        toast.error(json.message || 'Failed to delete employee profile');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error offboarding employee');
      return false;
    } finally {
      set((state) => ({ loading: { ...state.loading, editEmployee: false } }));
    }
  },

  createDepartment: async (payload) => {
    set((state) => ({ loading: { ...state.loading, createDept: true } }));
    try {
      const res = await fetch('/api/protected/hr/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Department "${payload.name}" registered successfully!`);
        await get().fetchDepartments();
        return true;
      } else {
        toast.error(json.message || 'Failed to create department');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creating department');
      return false;
    } finally {
      set((state) => ({ loading: { ...state.loading, createDept: false } }));
    }
  },

  submitPerformanceReview: async (payload) => {
    set((state) => ({ loading: { ...state.loading, submitReview: true } }));
    try {
      const res = await fetch('/api/protected/hr/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Performance review score evaluated successfully!');
        await get().fetchReviews(payload.employeeId);
        await get().fetchEmployees();
        return true;
      } else {
        toast.error(json.message || 'Failed to submit review');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error submitting review');
      return false;
    } finally {
      set((state) => ({ loading: { ...state.loading, submitReview: false } }));
    }
  },

  postAnnouncement: async (payload) => {
    set((state) => ({ loading: { ...state.loading, postAnnouncement: true } }));
    try {
      const res = await fetch('/api/protected/hr/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Announcement broadcast notice posted!');
        await get().fetchAnnouncements();
        return true;
      } else {
        toast.error(json.message || 'Failed to post announcement');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error posting notice');
      return false;
    } finally {
      set((state) => ({ loading: { ...state.loading, postAnnouncement: false } }));
    }
  },

  runHrSeeder: async () => {
    set((state) => ({ loading: { ...state.loading, seeder: true } }));
    try {
      const res = await fetch('/api/protected/hr/seed', {
        method: 'POST',
      });
      const json = await res.json();
      if (json.success) {
        toast.success('HR Workspace seeded with demo dataset successfully!');
        // Refresh all store states!
        await Promise.all([
          get().fetchEmployees(),
          get().fetchDepartments(),
          get().fetchAttendance(),
          get().fetchLeaves(),
          get().fetchAnnouncements(),
        ]);
        return true;
      } else {
        toast.error(json.message || 'Seeder failed');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error seeding database');
      return false;
    } finally {
      set((state) => ({ loading: { ...state.loading, seeder: false } }));
    }
  },
}));
