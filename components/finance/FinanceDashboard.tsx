import React from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  FileText,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface FinanceDashboardProps {
  data: any;
  role: string;
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ data, role }) => {
  if (!data || (!data.kpis && (!data.cashflowTrends || data.cashflowTrends.length === 0))) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4 select-none text-center max-w-md mx-auto">
        <ShieldAlert className="h-10 w-10 text-amber-500/80" />
        <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
          No Active Financial Records Detected
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          SyncGrid has initialized an empty secure ledger. Go to the Receivables Invoices, Operating
          Expenses, or Ceilings Budgets tabs to add record entries.
        </p>
      </div>
    );
  }

  const { kpis, cashflowTrends = [], expenseBreakdown = [], budgetStatus = [] } = data;

  const cards = [
    {
      title: 'Total gross revenue',
      value: `$${(kpis.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: 'Gross Inflow Ledger',
      icon: DollarSign,
      color: 'from-emerald-500/20 to-teal-500/5 text-emerald-500 border-emerald-500/30',
    },
    {
      title: 'Total operating expenses',
      value: `$${(kpis.totalExpenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: 'Corporate Payouts Ledger',
      icon: ArrowDownRight,
      color: 'from-rose-500/20 to-orange-500/5 text-rose-500 border-rose-500/30',
    },
    {
      title: 'Net operational profit',
      value: `$${(kpis.netProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: `Margin Ratio: ${(kpis.profitMargin || 0).toFixed(1)}%`,
      icon: ArrowUpRight,
      color: 'from-indigo-500/20 to-violet-500/5 text-indigo-400 border-indigo-500/30',
    },
    {
      title: 'Outstanding accounts',
      value: `$${(kpis.totalOutstanding || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: `Overdue Claims: $${(kpis.totalOverdue || 0).toLocaleString()}`,
      icon: Clock,
      color: 'from-amber-500/20 to-yellow-500/5 text-amber-500 border-amber-500/30',
    },
  ];

  // Simple SVG math for chart rendering
  const maxIncomeVal = Math.max(
    ...cashflowTrends.map((t: any) => Math.max(t.income, t.expense, 1000))
  );

  return (
    <div className="space-y-6">
      {/* Ledger Status Indicator */}
      <div className="flex items-center gap-3 bg-card/40 border border-border/80 p-4 rounded-xl backdrop-blur-md select-none">
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
          Ledger status: <span className="text-foreground">Live active ledger synchronized</span>
        </p>
      </div>

      {/* KPI Card Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className={`p-5 rounded-xl border bg-gradient-to-br ${card.color} backdrop-blur-sm shadow-md flex flex-col justify-between select-none`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] uppercase tracking-widest font-bold opacity-75">
                {card.title}
              </span>
              <card.icon className="h-4 w-4 opacity-80" />
            </div>
            <div className="my-4">
              <h3 className="text-2xl font-extrabold tracking-tight text-foreground">
                {card.value}
              </h3>
            </div>
            <div className="text-[10px] font-bold tracking-wider uppercase opacity-80">
              {card.change}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Alarm Flags for breached budgets */}
      {budgetStatus.some((b: any) => b.alertFired) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="border border-rose-500/40 bg-rose-500/10 p-4 rounded-xl flex items-start gap-3 backdrop-blur-md select-none"
        >
          <ShieldAlert className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">
              Critical Budget Overflow Threshold Breached
            </h4>
            <p className="text-xs text-muted-foreground">
              The following operational departments spend caps have exceeded alert bounds:
              {budgetStatus
                .filter((b: any) => b.alertFired)
                .map((b: any) => (
                  <span key={b.id} className="block mt-1 font-semibold text-foreground">
                    • {b.name} ({b.projectName}): Spent {b.percentage.toFixed(1)}% of $
                    {b.allocated.toLocaleString()} ceiling limit.
                  </span>
                ))}
            </p>
          </div>
        </motion.div>
      )}

      {/* Cashflow Trends and Expense Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Cashflow Graph Card */}
        <div className="lg:col-span-2 p-5 bg-card/30 border border-border/80 rounded-xl flex flex-col select-none">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Gross Operating Cashflow
              </h3>
              <p className="text-[10px] text-muted-foreground">
                Monthly aggregate income vs expense streams (Last 6 Months)
              </p>
            </div>
            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Inflow</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-rose-500" />
                <span>Outflow</span>
              </div>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-4 border-b border-border/60 pb-2 relative">
            {cashflowTrends.map((t: any) => {
              const incomeHeight = `${(t.income / maxIncomeVal) * 80}%`;
              const expenseHeight = `${(t.expense / maxIncomeVal) * 80}%`;
              return (
                <div key={t.month} className="flex-1 flex flex-col items-center group relative">
                  <div className="w-full flex items-end justify-center gap-1.5 h-48">
                    {/* Income Bar */}
                    <div
                      style={{ height: incomeHeight }}
                      className="w-4 bg-emerald-500/80 rounded-t-sm hover:bg-emerald-500 transition-all duration-300 relative group"
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[8px] font-bold px-1.5 py-0.5 rounded shadow border border-border/80 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none mb-1 white-space-nowrap">
                        ${t.income.toLocaleString()}
                      </div>
                    </div>
                    {/* Expense Bar */}
                    <div
                      style={{ height: expenseHeight }}
                      className="w-4 bg-rose-500/80 rounded-t-sm hover:bg-rose-500 transition-all duration-300 relative group"
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[8px] font-bold px-1.5 py-0.5 rounded shadow border border-border/80 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none mb-1 white-space-nowrap">
                        ${t.expense.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground mt-2 uppercase">
                    {t.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expense Category Split */}
        <div className="p-5 bg-card/30 border border-border/80 rounded-xl flex flex-col select-none">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider">Spend Categorization</h3>
            <p className="text-[10px] text-muted-foreground">Distribution of operating outflows</p>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-4 my-6">
            {expenseBreakdown.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-10">
                No outflows recorded
              </div>
            ) : (
              expenseBreakdown.map((item: any) => {
                const totalExp = expenseBreakdown.reduce(
                  (sum: number, curr: any) => sum + curr.value,
                  0
                );
                const percent = totalExp > 0 ? (item.value / totalExp) * 100 : 0;
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold tracking-wider uppercase">
                      <span>{item.name}</span>
                      <span className="text-muted-foreground">
                        ${item.value.toLocaleString()} ({percent.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-border/40 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percent}%` }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
