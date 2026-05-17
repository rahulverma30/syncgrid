import { create } from 'zustand';
import { toast } from 'sonner';
import { socketGateway } from '@/lib/socketGateway';

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

  // New hardened states
  myProfile: any | null;
  holidays: any[];
  presenceState: Record<string, string>;

  // Actions
  fetchEmployees: (search?: string, filters?: Record<string, string>) => Promise<void>;
  fetchDepartments: () => Promise<void>;
  fetchAttendance: (employeeId?: string) => Promise<void>;
  fetchLeaves: () => Promise<void>;
  fetchReviews: (employeeId?: string) => Promise<void>;
  fetchAnnouncements: () => Promise<void>;

  // Hardened actions
  fetchMyProfile: () => Promise<void>;
  updateMyProfile: (payload: any) => Promise<boolean>;
  fetchHolidays: () => Promise<void>;
  createHoliday: (payload: any) => Promise<boolean>;
  initializeRealtime: (companyId: string) => () => void;
  setPresence: (status: 'online' | 'offline' | 'away') => Promise<void>;

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
  myProfile: null,
  holidays: [],
  presenceState: {},

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

        // Broadcast realtime presence status
        const myProfile = get().myProfile;
        if (json.action === 'clocked_in') {
          socketGateway.broadcastSimulated('employee_clocked_in', {
            employeeId: myProfile?._id || 'me',
            fullName: myProfile?.fullName || 'Active User',
            workMode,
          });
        } else {
          socketGateway.broadcastSimulated('employee_clocked_out', {
            employeeId: myProfile?._id || 'me',
            fullName: myProfile?.fullName || 'Active User',
          });
        }

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

        // Broadcast realtime leave request
        socketGateway.broadcastSimulated('leave_requested', {
          fullName: get().myProfile?.fullName || 'Active User',
          reason: payload.reason,
        });

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

        // Broadcast approval/rejection
        socketGateway.broadcastSimulated(
          status === 'approved' ? 'leave_approved' : 'leave_rejected',
          {
            fullName: 'A Teammate',
          }
        );

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

        // Broadcast realtime announcement notice
        socketGateway.broadcastSimulated('announcement_published', {
          title: payload.title,
        });

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

  fetchMyProfile: async () => {
    set((state) => ({ loading: { ...state.loading, myProfile: true } }));
    try {
      const res = await fetch('/api/protected/hr/me');
      const json = await res.json();
      if (json.success) {
        set({ myProfile: json.data });
      }
    } catch (err: any) {
      console.error('Error fetching current employee profile:', err);
    } finally {
      set((state) => ({ loading: { ...state.loading, myProfile: false } }));
    }
  },

  updateMyProfile: async (payload) => {
    set((state) => ({ loading: { ...state.loading, editProfile: true } }));
    try {
      const res = await fetch('/api/protected/hr/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Your profile has been updated!');
        await get().fetchMyProfile();
        // Broadcast presence
        const profile = get().myProfile;
        if (profile) {
          socketGateway.broadcastSimulated('presence_update', {
            userId: profile.userId,
            fullName: profile.fullName,
            status: profile.presenceStatus || 'online',
          });
        }
        return true;
      } else {
        toast.error(json.message || 'Failed to update profile');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating profile');
      return false;
    } finally {
      set((state) => ({ loading: { ...state.loading, editProfile: false } }));
    }
  },

  fetchHolidays: async () => {
    set((state) => ({ loading: { ...state.loading, holidays: true } }));
    try {
      const res = await fetch('/api/protected/hr/holidays');
      const json = await res.json();
      if (json.success) {
        set({ holidays: json.data });
      }
    } catch (err: any) {
      console.error('Error fetching corporate calendar holidays:', err);
    } finally {
      set((state) => ({ loading: { ...state.loading, holidays: false } }));
    }
  },

  createHoliday: async (payload) => {
    set((state) => ({ loading: { ...state.loading, createHoliday: true } }));
    try {
      const res = await fetch('/api/protected/hr/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Holiday "${payload.name}" added to calendar!`);
        await get().fetchHolidays();
        return true;
      } else {
        toast.error(json.message || 'Failed to register holiday');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error registering holiday');
      return false;
    } finally {
      set((state) => ({ loading: { ...state.loading, createHoliday: false } }));
    }
  },

  initializeRealtime: (companyId: string) => {
    // Establish tenant connection
    socketGateway.connect(companyId);

    // Set online status on load
    get().setPresence('online');

    // Bind real-time workforce event listeners
    const unsubClockIn = socketGateway.on('employee_clocked_in', (data: any) => {
      toast.info(`[Realtime Presence] ${data.fullName} clocked in as ${data.workMode}!`);
      set((state) => ({
        employees: state.employees.map((emp) =>
          emp._id === data.employeeId
            ? { ...emp, workMode: data.workMode, presenceStatus: 'online' }
            : emp
        ),
        presenceState: { ...state.presenceState, [data.employeeId]: 'online' },
      }));
    });

    const unsubClockOut = socketGateway.on('employee_clocked_out', (data: any) => {
      toast.info(`[Realtime Presence] ${data.fullName} clocked out!`);
      set((state) => ({
        employees: state.employees.map((emp) =>
          emp._id === data.employeeId ? { ...emp, presenceStatus: 'offline' } : emp
        ),
        presenceState: { ...state.presenceState, [data.employeeId]: 'offline' },
      }));
    });

    const unsubLeaveReq = socketGateway.on('leave_requested', (data: any) => {
      toast.info(`[Realtime Leave] ${data.fullName} submitted a leave request: ${data.reason}`);
      get().fetchLeaves();
    });

    const unsubLeaveApprove = socketGateway.on('leave_approved', (data: any) => {
      toast.success(`[Realtime Leave] Leave request approved for ${data.fullName}!`);
      get().fetchLeaves();
      get().fetchEmployees();
    });

    const unsubLeaveReject = socketGateway.on('leave_rejected', (data: any) => {
      toast.error(`[Realtime Leave] Leave request rejected for ${data.fullName}.`);
      get().fetchLeaves();
    });

    const unsubAnnouncement = socketGateway.on('announcement_published', (data: any) => {
      toast.info(`[Notice Board] New announcement posted: "${data.title}"`, {
        duration: 5000,
      });
      get().fetchAnnouncements();
    });

    const unsubPresence = socketGateway.on('presence_update', (data: any) => {
      if (data.userId && data.status) {
        set((state) => ({
          presenceState: { ...state.presenceState, [data.userId]: data.status },
        }));
      }
    });

    return () => {
      unsubClockIn();
      unsubClockOut();
      unsubLeaveReq();
      unsubLeaveApprove();
      unsubLeaveReject();
      unsubAnnouncement();
      unsubPresence();
      socketGateway.disconnect();
    };
  },

  setPresence: async (status) => {
    try {
      set((state) => {
        if (state.myProfile) {
          return {
            myProfile: { ...state.myProfile, presenceStatus: status },
            presenceState: { ...state.presenceState, [state.myProfile.userId || 'me']: status },
          };
        }
        return state;
      });

      await fetch('/api/protected/hr/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presenceStatus: status }),
      });

      const profile = get().myProfile;
      if (profile) {
        socketGateway.broadcastSimulated('presence_update', {
          userId: profile.userId,
          fullName: profile.fullName,
          status,
        });
      }
    } catch (e) {
      console.error('Failed to sync presence status:', e);
    }
  },
}));
