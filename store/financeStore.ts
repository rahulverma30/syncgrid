import { create } from 'zustand';
import { toast } from 'sonner';
import { socketGateway } from '@/lib/socketGateway';

interface FinanceState {
  invoices: any[];
  transactions: any[];
  expenses: any[];
  budgets: any[];
  vendors: any[];
  purchaseOrders: any[];
  clientBillingProfiles: any[];
  dashboardData: any | null;
  loading: Record<string, boolean>;
  error: string | null;

  // Actions
  fetchInvoices: (search?: string, filters?: Record<string, string>) => Promise<void>;
  fetchTransactions: (filters?: Record<string, string>) => Promise<void>;
  fetchExpenses: (filters?: Record<string, string>) => Promise<void>;
  fetchBudgets: () => Promise<void>;
  fetchVendors: () => Promise<void>;
  fetchPurchaseOrders: () => Promise<void>;
  fetchClientBillingProfiles: () => Promise<void>;
  fetchDashboardData: (range?: string) => Promise<void>;

  // Mutations
  createInvoice: (payload: any) => Promise<boolean>;
  updateInvoice: (id: string, payload: any) => Promise<boolean>;
  duplicateInvoice: (id: string) => Promise<boolean>;
  archiveInvoice: (id: string) => Promise<boolean>;
  deleteInvoice: (id: string) => Promise<boolean>;
  sendInvoice: (id: string) => Promise<boolean>;
  markInvoicePaid: (id: string, recordPayload: any) => Promise<boolean>;
  recordTransaction: (payload: any) => Promise<boolean>;
  reconcileTransaction: (id: string, notes?: string) => Promise<boolean>;
  submitExpense: (payload: any) => Promise<boolean>;
  approveExpense: (id: string, status: 'approved' | 'rejected', comments?: string) => Promise<boolean>;
  saveBudget: (payload: any) => Promise<boolean>;
  saveVendor: (payload: any) => Promise<boolean>;
  createPurchaseOrder: (payload: any) => Promise<boolean>;
  approvePurchaseOrder: (id: string, status: 'approved' | 'rejected', comments?: string) => Promise<boolean>;
  runFinanceSeeder: () => Promise<boolean>;
  initializeRealtime: (companyId: string) => () => void;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  invoices: [],
  transactions: [],
  expenses: [],
  budgets: [],
  vendors: [],
  purchaseOrders: [],
  clientBillingProfiles: [],
  dashboardData: null,
  loading: {},
  error: null,

  fetchInvoices: async (search = '', filters = {}) => {
    set((state) => ({ loading: { ...state.loading, invoices: true }, error: null }));
    try {
      const params = new URLSearchParams({ search });
      Object.entries(filters).forEach(([key, val]) => {
        if (val) params.append(key, val);
      });
      const res = await fetch(`/api/protected/finance/invoices?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        set({ invoices: json.data });
      } else {
        set({ error: json.message || 'Failed to fetch invoices' });
      }
    } catch (err: any) {
      set({ error: err.message || 'Error fetching invoices' });
    } finally {
      set((state) => ({ loading: { ...state.loading, invoices: false } }));
    }
  },

  fetchTransactions: async (filters = {}) => {
    set((state) => ({ loading: { ...state.loading, transactions: true }, error: null }));
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val) params.append(key, val);
      });
      const res = await fetch(`/api/protected/finance/transactions?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        set({ transactions: json.data });
      } else {
        set({ error: json.message || 'Failed to fetch transactions' });
      }
    } catch (err: any) {
      set({ error: err.message || 'Error fetching transactions' });
    } finally {
      set((state) => ({ loading: { ...state.loading, transactions: false } }));
    }
  },

  fetchExpenses: async (filters = {}) => {
    set((state) => ({ loading: { ...state.loading, expenses: true }, error: null }));
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val) params.append(key, val);
      });
      const res = await fetch(`/api/protected/finance/expenses?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        set({ expenses: json.data });
      } else {
        set({ error: json.message || 'Failed to fetch expenses' });
      }
    } catch (err: any) {
      set({ error: err.message || 'Error fetching expenses' });
    } finally {
      set((state) => ({ loading: { ...state.loading, expenses: false } }));
    }
  },

  fetchBudgets: async () => {
    set((state) => ({ loading: { ...state.loading, budgets: true }, error: null }));
    try {
      const res = await fetch('/api/protected/finance/budgets');
      const json = await res.json();
      if (json.success) {
        set({ budgets: json.data });
      } else {
        set({ error: json.message || 'Failed to fetch budgets' });
      }
    } catch (err: any) {
      set({ error: err.message || 'Error fetching budgets' });
    } finally {
      set((state) => ({ loading: { ...state.loading, budgets: false } }));
    }
  },

  fetchVendors: async () => {
    set((state) => ({ loading: { ...state.loading, vendors: true }, error: null }));
    try {
      const res = await fetch('/api/protected/finance/vendors');
      const json = await res.json();
      if (json.success) {
        set({ vendors: json.data });
      } else {
        set({ error: json.message || 'Failed to fetch vendors' });
      }
    } catch (err: any) {
      set({ error: err.message || 'Error fetching vendors' });
    } finally {
      set((state) => ({ loading: { ...state.loading, vendors: false } }));
    }
  },

  fetchPurchaseOrders: async () => {
    set((state) => ({ loading: { ...state.loading, purchaseOrders: true }, error: null }));
    try {
      const res = await fetch('/api/protected/finance/purchase-orders');
      const json = await res.json();
      if (json.success) {
        set({ purchaseOrders: json.data });
      } else {
        set({ error: json.message || 'Failed to fetch purchase orders' });
      }
    } catch (err: any) {
      set({ error: err.message || 'Error fetching purchase orders' });
    } finally {
      set((state) => ({ loading: { ...state.loading, purchaseOrders: false } }));
    }
  },

  fetchClientBillingProfiles: async () => {
    set((state) => ({ loading: { ...state.loading, clientBillingProfiles: true }, error: null }));
    try {
      const res = await fetch('/api/protected/finance/client-billing');
      const json = await res.json();
      if (json.success) {
        set({ clientBillingProfiles: json.data });
      } else {
        set({ error: json.message || 'Failed to fetch client billing profiles' });
      }
    } catch (err: any) {
      set({ error: err.message || 'Error fetching client billing' });
    } finally {
      set((state) => ({ loading: { ...state.loading, clientBillingProfiles: false } }));
    }
  },

  fetchDashboardData: async (range = 'monthly') => {
    set((state) => ({ loading: { ...state.loading, dashboard: true }, error: null }));
    try {
      const res = await fetch(`/api/protected/finance/dashboard?range=${range}`);
      const json = await res.json();
      if (json.success) {
        set({ dashboardData: json.data });
      } else {
        set({ error: json.message || 'Failed to fetch dashboard analytics' });
      }
    } catch (err: any) {
      set({ error: err.message || 'Error fetching dashboard data' });
    } finally {
      set((state) => ({ loading: { ...state.loading, dashboard: false } }));
    }
  },

  createInvoice: async (payload) => {
    set((state) => ({ loading: { ...state.loading, action: true } }));
    try {
      const res = await fetch('/api/protected/finance/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Invoice ${json.data.invoiceNumber} created successfully!`);
        get().fetchInvoices();
        get().fetchDashboardData();
        return true;
      } else {
        toast.error(json.message || 'Failed to create invoice');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error creating invoice');
      return false;
    } finally {
      set((state) => ({ loading: { ...state.loading, action: false } }));
    }
  },

  updateInvoice: async (id, payload) => {
    set((state) => ({ loading: { ...state.loading, action: true } }));
    try {
      const res = await fetch(`/api/protected/finance/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Invoice updated successfully!`);
        get().fetchInvoices();
        get().fetchDashboardData();
        return true;
      } else {
        toast.error(json.message || 'Failed to update invoice');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error updating invoice');
      return false;
    } finally {
      set((state) => ({ loading: { ...state.loading, action: false } }));
    }
  },

  duplicateInvoice: async (id) => {
    set((state) => ({ loading: { ...state.loading, action: true } }));
    try {
      const res = await fetch(`/api/protected/finance/invoices/${id}?action=duplicate`, {
        method: 'POST',
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Invoice duplicated as ${json.data.invoiceNumber}!`);
        get().fetchInvoices();
        get().fetchDashboardData();
        return true;
      } else {
        toast.error(json.message || 'Failed to duplicate invoice');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error duplicating invoice');
      return false;
    } finally {
      set((state) => ({ loading: { ...state.loading, action: false } }));
    }
  },

  archiveInvoice: async (id) => {
    try {
      const res = await fetch(`/api/protected/finance/invoices/${id}?action=archive`, {
        method: 'PUT',
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Invoice archived successfully`);
        get().fetchInvoices();
        get().fetchDashboardData();
        return true;
      } else {
        toast.error(json.message || 'Failed to archive invoice');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error archiving invoice');
      return false;
    }
  },

  deleteInvoice: async (id) => {
    try {
      const res = await fetch(`/api/protected/finance/invoices/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Invoice deleted successfully`);
        get().fetchInvoices();
        get().fetchDashboardData();
        return true;
      } else {
        toast.error(json.message || 'Failed to delete invoice');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error deleting invoice');
      return false;
    }
  },

  sendInvoice: async (id) => {
    try {
      const res = await fetch(`/api/protected/finance/invoices/${id}?action=send`, {
        method: 'PUT',
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Invoice sent successfully to customer contacts!`);
        get().fetchInvoices();
        return true;
      } else {
        toast.error(json.message || 'Failed to transmit invoice');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error sending invoice');
      return false;
    }
  },

  markInvoicePaid: async (id, recordPayload) => {
    set((state) => ({ loading: { ...state.loading, action: true } }));
    try {
      const res = await fetch(`/api/protected/finance/invoices/${id}?action=record-payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordPayload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Payment recorded for invoice successfully!`);
        get().fetchInvoices();
        get().fetchTransactions();
        get().fetchDashboardData();
        return true;
      } else {
        toast.error(json.message || 'Failed to record payment');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error recording payment');
      return false;
    } finally {
      set((state) => ({ loading: { ...state.loading, action: false } }));
    }
  },

  recordTransaction: async (payload) => {
    set((state) => ({ loading: { ...state.loading, action: true } }));
    try {
      const res = await fetch('/api/protected/finance/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Transaction logged successfully in general ledger.`);
        get().fetchTransactions();
        get().fetchDashboardData();
        return true;
      } else {
        toast.error(json.message || 'Failed to record transaction');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error recording transaction');
      return false;
    } finally {
      set((state) => ({ loading: { ...state.loading, action: false } }));
    }
  },

  reconcileTransaction: async (id, notes = '') => {
    try {
      const res = await fetch(`/api/protected/finance/transactions?id=${id}&action=reconcile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Transaction reconciled successfully!`);
        get().fetchTransactions();
        get().fetchDashboardData();
        return true;
      } else {
        toast.error(json.message || 'Reconciliation failed');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error during reconciliation');
      return false;
    }
  },

  submitExpense: async (payload) => {
    set((state) => ({ loading: { ...state.loading, action: true } }));
    try {
      const res = await fetch('/api/protected/finance/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Expense ${json.data.expenseNumber} filed successfully!`);
        get().fetchExpenses();
        get().fetchDashboardData();
        return true;
      } else {
        toast.error(json.message || 'Failed to submit expense');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error submitting expense');
      return false;
    } finally {
      set((state) => ({ loading: { ...state.loading, action: false } }));
    }
  },

  approveExpense: async (id, status, comments = '') => {
    try {
      const res = await fetch('/api/protected/finance/expenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, comments }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Expense successfully ${status}!`);
        get().fetchExpenses();
        get().fetchDashboardData();
        return true;
      } else {
        toast.error(json.message || 'Failed to approve expense');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating expense approval');
      return false;
    }
  },

  saveBudget: async (payload) => {
    set((state) => ({ loading: { ...state.loading, action: true } }));
    try {
      const res = await fetch('/api/protected/finance/budgets', {
        method: payload._id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(payload._id ? `Budget updated successfully!` : `New Budget allocated successfully!`);
        get().fetchBudgets();
        get().fetchDashboardData();
        return true;
      } else {
        toast.error(json.message || 'Failed to save budget settings');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error saving budget');
      return false;
    } finally {
      set((state) => ({ loading: { ...state.loading, action: false } }));
    }
  },

  saveVendor: async (payload) => {
    set((state) => ({ loading: { ...state.loading, action: true } }));
    try {
      const res = await fetch('/api/protected/finance/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Vendor registered successfully!`);
        get().fetchVendors();
        return true;
      } else {
        toast.error(json.message || 'Failed to save vendor details');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error saving vendor');
      return false;
    } finally {
      set((state) => ({ loading: { ...state.loading, action: false } }));
    }
  },

  createPurchaseOrder: async (payload) => {
    set((state) => ({ loading: { ...state.loading, action: true } }));
    try {
      const res = await fetch('/api/protected/finance/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Purchase Order ${json.data.poNumber} created successfully!`);
        get().fetchPurchaseOrders();
        return true;
      } else {
        toast.error(json.message || 'Failed to generate PO');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creating PO');
      return false;
    } finally {
      set((state) => ({ loading: { ...state.loading, action: false } }));
    }
  },

  approvePurchaseOrder: async (id, status, comments = '') => {
    try {
      const res = await fetch('/api/protected/finance/purchase-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, comments }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Purchase Order successfully ${status}!`);
        get().fetchPurchaseOrders();
        return true;
      } else {
        toast.error(json.message || 'Failed to resolve PO status');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error approving PO');
      return false;
    }
  },

  runFinanceSeeder: async () => {
    set((state) => ({ loading: { ...state.loading, seeder: true } }));
    try {
      const res = await fetch('/api/protected/finance/seed', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        toast.success('High-fidelity ERP Finance dataset seeded successfully!');
        // Fetch all updated lists
        await Promise.all([
          get().fetchInvoices(),
          get().fetchTransactions(),
          get().fetchExpenses(),
          get().fetchBudgets(),
          get().fetchVendors(),
          get().fetchPurchaseOrders(),
          get().fetchClientBillingProfiles(),
          get().fetchDashboardData(),
        ]);
        return true;
      } else {
        toast.error(json.message || 'Failed to seed finance variables');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error seeding finance data');
      return false;
    } finally {
      set((state) => ({ loading: { ...state.loading, seeder: false } }));
    }
  },

  initializeRealtime: (companyId: string) => {
    const handleInvoiceEvent = (event: any) => {
      if (event.companyId === companyId) {
        get().fetchInvoices();
        get().fetchDashboardData();
        toast.info(`Realtime Update: Invoice activity detected!`);
      }
    };

    const handlePaymentEvent = (event: any) => {
      if (event.companyId === companyId) {
        get().fetchTransactions();
        get().fetchInvoices();
        get().fetchDashboardData();
        toast.info(`Realtime Update: Corporate payment cleared!`);
      }
    };

    const handleExpenseEvent = (event: any) => {
      if (event.companyId === companyId) {
        get().fetchExpenses();
        get().fetchDashboardData();
        toast.info(`Realtime Update: Business expense adjusted!`);
      }
    };

    // Subscriptions
    socketGateway.on('finance:invoice_update', handleInvoiceEvent);
    socketGateway.on('finance:payment_update', handlePaymentEvent);
    socketGateway.on('finance:expense_update', handleExpenseEvent);

    return () => {
      socketGateway.off('finance:invoice_update', handleInvoiceEvent);
      socketGateway.off('finance:payment_update', handlePaymentEvent);
      socketGateway.off('finance:expense_update', handleExpenseEvent);
    };
  },
}));
