/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  AlertOctagon,
  CheckCircle2,
  Users,
  Activity,
  Layers,
  Filter,
  X,
} from 'lucide-react';
import { Select } from '@/components/ui/select';

/** Map burndown data points into an SVG polyline string.
 *  All X values go from xStart to xEnd, Y from yTop to yBottom (SVG inverted). */
function buildPolyline(
  points: number[],
  xStart: number,
  xEnd: number,
  yTop: number,
  yBottom: number,
  maxVal: number
): string {
  if (!points.length) return '';
  const xStep = (xEnd - xStart) / Math.max(1, points.length - 1);
  return points
    .map((val, i) => {
      const x = xStart + i * xStep;
      const ratio = maxVal > 0 ? val / maxVal : 0;
      const y = yBottom - ratio * (yBottom - yTop);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function TaskDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [projects, setProjects] = useState<any[]>([]);
  const [filterProjectId, setFilterProjectId] = useState('');

  const fetchDashboardData = (projectId?: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (projectId) params.set('projectId', projectId);
    fetch(`/api/protected/tasks/dashboard${params.toString() ? `?${params}` : ''}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setData(result.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
    fetch('/api/protected/projects')
      .then((r) => r.json())
      .then((r) => {
        if (r.success) setProjects(r.data);
      });
  }, []);

  useEffect(() => {
    fetchDashboardData(filterProjectId || undefined);
  }, [filterProjectId]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-xs text-muted-foreground italic">
        Loading agile execution metrics...
      </div>
    );
  }

  const { kpis, completionTrend, burndown, velocity } = data;

  // Derived chart data
  const burndownIdeal = burndown.map((b: any) => b.Ideal);
  const burndownActual = burndown.map((b: any) => b.Remaining);
  const burndownMax = Math.max(1, ...burndownIdeal);

  const velocityMax = Math.max(1, ...velocity.map((v: any) => Math.max(v.planned, v.completed)));

  const SVG_X_START = 30;
  const SVG_X_END = 480;
  const SVG_Y_TOP = 20;
  const SVG_Y_BOTTOM = 175;
  const SVG_HEIGHT = 200;

  const idealPolyline = buildPolyline(
    burndownIdeal,
    SVG_X_START,
    SVG_X_END,
    SVG_Y_TOP,
    SVG_Y_BOTTOM,
    burndownMax
  );
  const actualPolyline = buildPolyline(
    burndownActual,
    SVG_X_START,
    SVG_X_END,
    SVG_Y_TOP,
    SVG_Y_BOTTOM,
    burndownMax
  );

  return (
    <div className="space-y-6">
      {/* Project filter */}
      <div className="flex items-center gap-3">
        <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Filter:
        </span>
        <div className="w-56">
          <Select
            value={filterProjectId}
            onChange={setFilterProjectId}
            options={[
              { value: '', label: 'All Projects' },
              ...projects.map((p) => ({ value: p._id, label: `${p.name} (${p.code})` })),
            ]}
          />
        </div>
        {filterProjectId && (
          <button
            onClick={() => setFilterProjectId('')}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground font-bold"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

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

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Burndown — real data */}
        <div className="bg-background border border-border/30 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Sprint Burndown Chart ({burndown.length - 1}-Day Cycle)
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

          <div className="h-64 w-full relative pt-2">
            <svg viewBox={`0 0 500 ${SVG_HEIGHT}`} className="w-full h-full">
              {/* Grid lines */}
              {[20, 70, 120, 170].map((y) => (
                <line
                  key={y}
                  x1={SVG_X_START}
                  y1={y}
                  x2={SVG_X_END}
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth="0.5"
                  strokeDasharray="3"
                />
              ))}
              <line
                x1={SVG_X_START}
                y1={SVG_Y_BOTTOM}
                x2={SVG_X_END}
                y2={SVG_Y_BOTTOM}
                stroke="var(--border)"
                strokeWidth="1"
              />

              {/* Y axis label: max points */}
              <text x="2" y="24" fill="var(--muted-foreground)" fontSize="7">
                {burndownMax}pts
              </text>
              <text x="2" y={SVG_Y_BOTTOM + 4} fill="var(--muted-foreground)" fontSize="7">
                0
              </text>

              {/* Ideal slope line */}
              {idealPolyline && (
                <polyline
                  points={idealPolyline}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeDasharray="5"
                />
              )}

              {/* Actual remaining line */}
              {actualPolyline && (
                <polyline
                  points={actualPolyline}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Day labels */}
              {burndown
                .filter((_: any, i: number) => i % 2 === 0)
                .map((b: any, i: number) => {
                  const x =
                    SVG_X_START +
                    i * 2 * ((SVG_X_END - SVG_X_START) / Math.max(1, burndown.length - 1));
                  return (
                    <text
                      key={i}
                      x={x}
                      y={SVG_HEIGHT - 4}
                      fill="var(--muted-foreground)"
                      fontSize="8"
                      textAnchor="middle"
                    >
                      {b.day}
                    </text>
                  );
                })}
            </svg>
          </div>
        </div>

        {/* Velocity — real sprint data */}
        <div className="bg-background border border-border/30 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Sprint Velocity Chart
            </h4>
            <div className="flex gap-3 text-[10px] font-bold text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-primary/20 border border-primary block rounded-sm" />{' '}
                Planned pts
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-emerald-500/20 border border-emerald-500 block rounded-sm" />{' '}
                Completed pts
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <svg viewBox={`0 0 500 ${SVG_HEIGHT}`} className="w-full h-full">
              {[20, 80, 140].map((y) => (
                <line
                  key={y}
                  x1={SVG_X_START}
                  y1={y}
                  x2={SVG_X_END}
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth="0.5"
                  strokeDasharray="3"
                />
              ))}
              <line
                x1={SVG_X_START}
                y1={SVG_Y_BOTTOM}
                x2={SVG_X_END}
                y2={SVG_Y_BOTTOM}
                stroke="var(--border)"
                strokeWidth="1"
              />

              {velocity.map((v: any, i: number) => {
                const slotWidth = (SVG_X_END - SVG_X_START) / Math.max(1, velocity.length);
                const slotX = SVG_X_START + i * slotWidth;
                const barW = 18;
                const plannedH =
                  velocityMax > 0 ? (v.planned / velocityMax) * (SVG_Y_BOTTOM - SVG_Y_TOP) : 0;
                const completedH =
                  velocityMax > 0 ? (v.completed / velocityMax) * (SVG_Y_BOTTOM - SVG_Y_TOP) : 0;
                const labelX = slotX + slotWidth / 2;

                return (
                  <g key={i}>
                    {/* Planned bar */}
                    <rect
                      x={slotX + slotWidth / 2 - barW - 2}
                      y={SVG_Y_BOTTOM - plannedH}
                      width={barW}
                      height={plannedH}
                      fill="#3b82f6"
                      fillOpacity="0.25"
                      stroke="#3b82f6"
                      strokeWidth="1"
                    />
                    {/* Completed bar */}
                    <rect
                      x={slotX + slotWidth / 2 + 2}
                      y={SVG_Y_BOTTOM - completedH}
                      width={barW}
                      height={completedH}
                      fill="#10b981"
                      fillOpacity="0.25"
                      stroke="#10b981"
                      strokeWidth="1"
                    />
                    {/* Label */}
                    <text
                      x={labelX}
                      y={SVG_HEIGHT - 4}
                      fill="var(--muted-foreground)"
                      fontSize="7"
                      textAnchor="middle"
                    >
                      {v.sprint.length > 10 ? v.sprint.slice(0, 10) + '…' : v.sprint}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Completion throughput */}
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
                  style={{
                    height: `${Math.min(100, (t.completed / Math.max(1, ...completionTrend.map((x: any) => x.completed))) * 100)}%`,
                  }}
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
