'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useFinanceStore } from '@/store/financeStore';
import { PageHeader, Button } from '@/components/ui';
import {
  Sparkles,
  LayoutDashboard,
  FileText,
  DollarSign,
  Briefcase,
  Settings,
  Scale,
  Database,
  ArrowRightLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Sub components
import { FinanceDashboard } from '@/components/finance/FinanceDashboard';
import { InvoiceManager } from '@/components/finance/InvoiceManager';
import { InvoiceBuilder } from '@/components/finance/InvoiceBuilder';
import { ExpenseManager } from '@/components/finance/ExpenseManager';
import { BudgetPlanner } from '@/components/finance/BudgetPlanner';
import { ClientVendorSettings } from '@/components/finance/ClientVendorSettings';
import { ProfitabilityVault } from '@/components/finance/ProfitabilityVault';

export default function FinancePage() {
  const { data: session } = useSession();
  const role = session?.user?.roles?.[0] || 'employee';

  const {
    invoices,
    transactions,
    expenses,
    budgets,
    vendors,
    purchaseOrders,
    clientBillingProfiles,
    dashboardData,
    loading,
    fetchInvoices,
    fetchTransactions,
    fetchExpenses,
    fetchBudgets,
    fetchVendors,
    fetchPurchaseOrders,
    fetchClientBillingProfiles,
    fetchDashboardData,
    createInvoice,
    sendInvoice,
    duplicateInvoice,
    archiveInvoice,
    deleteInvoice,
    markInvoicePaid,
    recordTransaction,
    reconcileTransaction,
    submitExpense,
    approveExpense,
    saveBudget,
    saveVendor,
    createPurchaseOrder,
    approvePurchaseOrder,
    initializeRealtime,
  } = useFinanceStore();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [builderOpen, setBuilderOpen] = useState(false);

  // Load initial dataset
  useEffect(() => {
    Promise.all([
      fetchInvoices(),
      fetchTransactions(),
      fetchExpenses(),
      fetchBudgets(),
      fetchVendors(),
      fetchPurchaseOrders(),
      fetchClientBillingProfiles(),
      fetchDashboardData(),
    ]);
  }, [
    fetchInvoices,
    fetchTransactions,
    fetchExpenses,
    fetchBudgets,
    fetchVendors,
    fetchPurchaseOrders,
    fetchClientBillingProfiles,
    fetchDashboardData,
  ]);

  // Realtime sockets registration
  useEffect(() => {
    if (session?.user?.companyId) {
      const cleanup = initializeRealtime(session.user.companyId);
      return cleanup;
    }
  }, [session?.user?.companyId, initializeRealtime]);

  const tabs = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Receivables Invoices', icon: FileText },
    { id: 'expenses', label: 'Operating Expenses', icon: DollarSign },
    { id: 'budgets', label: 'Ceilings Budgets', icon: Briefcase },
    { id: 'settings', label: 'Directory Settings', icon: Settings },
    { id: 'profitability', label: 'Profitability Vault', icon: Scale },
  ];

  return (
    <div className="space-y-6 relative min-h-screen pb-12 select-none">
      {/* Page header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <PageHeader
          eyebrow="Financial Operations"
          title="Enterprise Finance & Billing Cockpit"
          description="Track accounts receivable invoices, control budget margins, reimburse employee claims, and verify profitability indices."
        />
      </div>

      {/* Navigation submenus tabs */}
      <div className="border-b border-border bg-card/25 backdrop-blur-md sticky top-0 z-10 py-2.5 flex gap-2 overflow-x-auto scrollbar-none select-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setBuilderOpen(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 text-[13px] font-bold rounded-lg transition-all duration-200 whitespace-nowrap focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary-rgb),0.15)] font-bold'
                  : 'hover:bg-accent/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Render active Tab panels */}
      <div className="relative z-0 min-h-[50vh]">
        {activeTab === 'dashboard' && <FinanceDashboard data={dashboardData} role={role} />}

        {activeTab === 'invoices' && (
          <>
            {builderOpen ? (
              <InvoiceBuilder
                onClose={() => setBuilderOpen(false)}
                onSubmit={async (payload) => {
                  const success = await createInvoice(payload);
                  if (success) setBuilderOpen(false);
                }}
                role={role}
              />
            ) : (
              <InvoiceManager
                invoices={invoices}
                onOpenCreate={() => setBuilderOpen(true)}
                onSend={sendInvoice}
                onDuplicate={duplicateInvoice}
                onArchive={archiveInvoice}
                onDelete={deleteInvoice}
                onRecordPayment={markInvoicePaid}
                role={role}
              />
            )}
          </>
        )}

        {activeTab === 'expenses' && (
          <ExpenseManager
            expenses={expenses}
            onSubmitClaim={submitExpense}
            onApprove={approveExpense}
            role={role}
          />
        )}

        {activeTab === 'budgets' && (
          <BudgetPlanner budgets={budgets} onSaveBudget={saveBudget} role={role} />
        )}

        {activeTab === 'settings' && (
          <ClientVendorSettings
            clientBilling={clientBillingProfiles}
            vendors={vendors}
            purchaseOrders={purchaseOrders}
            onSaveBilling={async (payload) => {
              const res = await fetch('/api/protected/finance/client-billing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });
              const json = await res.json();
              if (json.success) {
                fetchClientBillingProfiles();
              }
            }}
            onSaveVendor={saveVendor}
            onCreatePO={createPurchaseOrder}
            onApprovePO={approvePurchaseOrder}
            role={role}
          />
        )}

        {activeTab === 'profitability' && (
          <ProfitabilityVault dashboardData={dashboardData} role={role} />
        )}
      </div>
    </div>
  );
}
