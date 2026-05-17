/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from 'react';
import { TrendingUp, AlertOctagon, CheckCircle2, Users, Activity, Layers } from 'lucide-react';

export function TaskDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = () => {
    setLoading(true);
    fetch('/api/protected/tasks/dashboard')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setData(result.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-xs text-muted-foreground italic">
        Loading agile execution metrics...
      </div>
    );
  }

  const { kpis, completionTrend, burndown, velocity } = data;

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-5 gap-4">
        {/* Total */}
        <div className="bg-background border border-border/30 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Total tasks
            </span>
            <span className="text-xl font-bold text-foreground font-mono">{kpis.total}</span>
          </div>
        </div>

        {/* Assigned */}
        <div className="bg-background border border-border/30 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              My Assigned
            </span>
            <span className="text-xl font-bold text-foreground font-mono">{kpis.assigned}</span>
          </div>
        </div>

        {/* Overdue */}
        <div
          className={`bg-background border rounded-xl p-4 flex items-center gap-4 transition ${
            kpis.overdue > 0 ? 'border-rose-500/35 bg-rose-500/5 animate-pulse' : 'border-border/30'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">
              Overdue
            </span>
            <span className="text-xl font-bold text-foreground font-mono">{kpis.overdue}</span>
          </div>
        </div>

        {/* Blocked */}
        <div className="bg-background border border-border/30 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Blocked tasks
            </span>
            <span className="text-xl font-bold text-foreground font-mono">{kpis.blocked}</span>
          </div>
        </div>

        {/* Completion rate */}
        <div className="bg-background border border-border/30 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Completion Rate
            </span>
            <span className="text-xl font-bold text-foreground font-mono">
              {kpis.completionRate}%
            </span>
          </div>
        </div>
      </div>

      {/* SVG Charts Area */}
      <div className="grid grid-cols-2 gap-6">
        {/* Burndown line chart */}
        <div className="bg-background border border-border/30 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              Sprint Burndown Chart (10-Day Cycle)
            </h4>
            <div className="flex gap-3 text-[10px] font-bold text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-blue-500 block" /> Ideal Slope
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-rose-500 block" /> Actual Remaining
              </span>
            </div>
          </div>

          {/* Line Chart drawing using SVG */}
          <div className="h-64 w-full relative pt-2">
            <svg viewBox="0 0 500 200" className="w-full h-full">
              {/* Grid Lines */}
              <line
                x1="30"
                y1="20"
                x2="480"
                y2="20"
                stroke="var(--border)"
                strokeWidth="0.5"
                strokeDasharray="3"
              />
              <line
                x1="30"
                y1="80"
                x2="480"
                y2="80"
                stroke="var(--border)"
                strokeWidth="0.5"
                strokeDasharray="3"
              />
              <line
                x1="30"
                y1="140"
                x2="480"
                y2="140"
                stroke="var(--border)"
                strokeWidth="0.5"
                strokeDasharray="3"
              />
              <line x1="30" y1="180" x2="480" y2="180" stroke="var(--border)" strokeWidth="1" />

              {/* Ideal Line: from (30, 20) to (480, 180) */}
              <line
                x1="30"
                y1="20"
                x2="480"
                y2="180"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeDasharray="5"
              />

              {/* Actual Line plotting */}
              <path
                d="M 30 20 L 75 35 L 120 50 L 165 45 L 210 70 L 255 100 L 300 95 L 345 130 L 390 145 L 435 170 L 480 178"
                fill="none"
                stroke="#f43f5e"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Dots and points */}
              <circle cx="30" cy="20" r="4" fill="#f43f5e" />
              <circle cx="480" cy="178" r="4" fill="#f43f5e" />

              {/* Day Labels */}
              <text x="30" y="195" fill="var(--muted-foreground)" fontSize="8" textAnchor="middle">
                Day 0
              </text>
              <text x="120" y="195" fill="var(--muted-foreground)" fontSize="8" textAnchor="middle">
                Day 2
              </text>
              <text x="210" y="195" fill="var(--muted-foreground)" fontSize="8" textAnchor="middle">
                Day 4
              </text>
              <text x="300" y="195" fill="var(--muted-foreground)" fontSize="8" textAnchor="middle">
                Day 6
              </text>
              <text x="390" y="195" fill="var(--muted-foreground)" fontSize="8" textAnchor="middle">
                Day 8
              </text>
              <text x="480" y="195" fill="var(--muted-foreground)" fontSize="8" textAnchor="middle">
                Day 10
              </text>
            </svg>
          </div>
        </div>

        {/* Velocity Trends bar chart */}
        <div className="bg-background border border-border/30 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              Sprint Velocity Chart
            </h4>
            <div className="flex gap-3 text-[10px] font-bold text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-primary/20 border border-primary block rounded-sm" />{' '}
                Planned points
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-emerald-500/20 border border-emerald-500 block rounded-sm" />{' '}
                Completed points
              </span>
            </div>
          </div>

          {/* Bar Chart using SVG */}
          <div className="h-64 w-full pt-2">
            <svg viewBox="0 0 500 200" className="w-full h-full">
              <line
                x1="30"
                y1="20"
                x2="480"
                y2="20"
                stroke="var(--border)"
                strokeWidth="0.5"
                strokeDasharray="3"
              />
              <line
                x1="30"
                y1="80"
                x2="480"
                y2="80"
                stroke="var(--border)"
                strokeWidth="0.5"
                strokeDasharray="3"
              />
              <line
                x1="30"
                y1="140"
                x2="480"
                y2="140"
                stroke="var(--border)"
                strokeWidth="0.5"
                strokeDasharray="3"
              />
              <line x1="30" y1="180" x2="480" y2="180" stroke="var(--border)" strokeWidth="1" />

              {/* Bar 1 (Sprint 1) */}
              <rect
                x="60"
                y="90"
                width="20"
                height="90"
                fill="#3b82f6"
                fillOpacity="0.25"
                stroke="#3b82f6"
                strokeWidth="1"
              />
              <rect
                x="83"
                y="100"
                width="20"
                height="80"
                fill="#10b981"
                fillOpacity="0.25"
                stroke="#10b981"
                strokeWidth="1"
              />
              <text x="81" y="195" fill="var(--muted-foreground)" fontSize="8" textAnchor="middle">
                Sprint 1
              </text>

              {/* Bar 2 (Sprint 2) */}
              <rect
                x="170"
                y="70"
                width="20"
                height="110"
                fill="#3b82f6"
                fillOpacity="0.25"
                stroke="#3b82f6"
                strokeWidth="1"
              />
              <rect
                x="193"
                y="75"
                width="20"
                height="105"
                fill="#10b981"
                fillOpacity="0.25"
                stroke="#10b981"
                strokeWidth="1"
              />
              <text x="191" y="195" fill="var(--muted-foreground)" fontSize="8" textAnchor="middle">
                Sprint 2
              </text>

              {/* Bar 3 (Sprint 3) */}
              <rect
                x="280"
                y="50"
                width="20"
                height="130"
                fill="#3b82f6"
                fillOpacity="0.25"
                stroke="#3b82f6"
                strokeWidth="1"
              />
              <rect
                x="303"
                y="40"
                width="20"
                height="140"
                fill="#10b981"
                fillOpacity="0.25"
                stroke="#10b981"
                strokeWidth="1"
              />
              <text x="301" y="195" fill="var(--muted-foreground)" fontSize="8" textAnchor="middle">
                Sprint 3
              </text>

              {/* Bar 4 (Sprint 4) */}
              <rect
                x="390"
                y="60"
                width="20"
                height="120"
                fill="#3b82f6"
                fillOpacity="0.25"
                stroke="#3b82f6"
                strokeWidth="1"
              />
              <rect
                x="413"
                y="90"
                width="20"
                height="90"
                fill="#10b981"
                fillOpacity="0.25"
                stroke="#10b981"
                strokeWidth="1"
              />
              <text x="411" y="195" fill="var(--muted-foreground)" fontSize="8" textAnchor="middle">
                Sprint 4
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* Completion sparkline Throughput trend */}
      <div className="bg-background border border-border/30 rounded-xl p-5 space-y-4">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-emerald-500" /> Task completion throughput (Last 14
          days)
        </h4>
        <div className="grid grid-cols-14 gap-3 pt-2 select-none">
          {completionTrend.map((t: any, idx: number) => (
            <div key={idx} className="flex flex-col items-center gap-2">
              <div className="w-full bg-muted/15 rounded-md h-20 flex flex-col justify-end overflow-hidden border border-border/10">
                <div
                  className="bg-emerald-500 w-full transition-all duration-200"
                  style={{ height: `${Math.min(100, (t.completed / 6) * 100)}%` }}
                />
              </div>
              <span className="text-[8px] font-bold font-mono text-muted-foreground">
                {t.date.split('-')[2]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
