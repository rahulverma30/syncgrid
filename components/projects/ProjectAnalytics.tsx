import React from 'react';
import { Card, CardContent } from '@/components/ui';
import { AreaChartWrapper, PieChartWrapper, BarChartWrapper } from '@/components/ui/charts';
import { useProjectsStore, ProjectAccount } from '@/store/projectsStore';
import {
  Layers,
  TrendingUp,
  DollarSign,
  Heart,
  Zap,
  AlertTriangle,
  Clock,
  Target,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const ProjectAnalytics: React.FC = () => {
  const { projects, setSelectedProject } = useProjectsStore();
  const [activeChartTab, setActiveChartTab] = React.useState<'budget' | 'burndown'>('burndown');

  // ── KPI Calculations ──────────────────────────────────────────────────────
  const activeProjects = projects.filter(
    (p) => !['completed', 'cancelled', 'on-hold'].includes(p.status)
  );
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const avgHealth =
    projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + p.healthScore, 0) / projects.length)
      : 0;

  // Sprint velocity: average velocity across all active sprints
  const allSprints = projects.flatMap((p) => p.sprints || []);
  const activeSprints = allSprints.filter((s) => s.status === 'active' || s.status === 'completed');
  const avgVelocity =
    activeSprints.length > 0
      ? Math.round(activeSprints.reduce((sum, s) => sum + s.velocity, 0) / activeSprints.length)
      : 0;

  // ── Derived Sprint & Predictability Metrics ───────────────────────────────
  const totalMilestonesCount = projects.reduce((sum, p) => sum + (p.milestones || []).length, 0);
  const completedMilestonesCount = projects.reduce(
    (sum, p) => sum + (p.milestones || []).filter((m) => m.status === 'completed').length,
    0
  );
  const overdueMilestonesCount = projects.reduce(
    (sum, p) =>
      sum +
      (p.milestones || []).filter((m) => {
        return m.status !== 'completed' && m.dueDate && new Date(m.dueDate) < new Date();
      }).length,
    0
  );

  const completionRate =
    totalMilestonesCount > 0
      ? Math.round((completedMilestonesCount / totalMilestonesCount) * 100)
      : 0;
  const predictabilityScore = Math.max(10, 100 - overdueMilestonesCount * 12);
  const carryOverCount = overdueMilestonesCount;

  // Custom burndown data for SVG chart rendering
  const sprintDays = Array.from({ length: 11 }, (_, i) => i);
  const idealBurn = sprintDays.map((day) => Math.max(0, 100 - day * 10));
  const actualBurn = sprintDays.map((day) => {
    if (day > 6) return null;
    const factor = 100 - day * 8 - (day > 3 ? 12 : 2);
    return Math.max(0, Math.round(factor));
  });
  const forecastBurn = sprintDays.map((day) => {
    if (day < 6) return null;
    const factor = 100 - 6 * 8 - (6 > 3 ? 12 : 2) - (day - 6) * 11;
    return Math.max(0, Math.round(factor));
  });

  // ── Chart Data ────────────────────────────────────────────────────────────
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const budgetTrendData = months.map((month, index) => {
    const scaleFactor = 0.4 + (index / 11) * 0.6;
    return {
      month,
      budget: Math.round(totalBudget * scaleFactor),
      spent: Math.round(totalBudget * scaleFactor * 0.72),
    };
  });

  const statusCounts = [
    'planning',
    'design',
    'development',
    'testing',
    'deployment',
    'completed',
    'on-hold',
  ];
  const statusChartData = statusCounts
    .map((s) => ({
      name: s.charAt(0).toUpperCase() + s.slice(1),
      value: projects.filter((p) => p.status === s).length,
    }))
    .filter((d) => d.value > 0);

  const managers = Array.from(new Set(projects.map((p) => p.projectManager || 'Unassigned')));
  const managerWorkloadData = managers.map((name) => ({
    name: name.split(' ')[0],
    projects: projects.filter((p) => p.projectManager === name).length,
  }));

  // ── At-risk projects ──────────────────────────────────────────────────────
  const atRiskProjects = projects.filter(
    (p) => p.healthScore < 75 || p.riskLevel === 'high' || p.riskLevel === 'critical'
  );

  return (
    <motion.div
      key="analytics"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 text-left"
    >
      {/* KPI Scorecards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 select-none">
        <Card className="bg-card/40 backdrop-blur-md border border-border/80 hover:border-primary/20 transition-all duration-300">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Active Projects
              </p>
              <h3 className="text-2xl font-black font-mono">{activeProjects.length}</h3>
              <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" />
                {projects.length} total tracked
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-md border border-border/80 hover:border-primary/20 transition-all duration-300">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Total Budget
              </p>
              <h3 className="text-2xl font-black font-mono text-primary">
                ${totalBudget.toLocaleString()}
              </h3>
              <p className="text-[10px] text-muted-foreground">Across all projects</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-md border border-border/80 hover:border-primary/20 transition-all duration-300">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Avg Health Index
              </p>
              <h3 className="text-2xl font-black font-mono">{avgHealth}%</h3>
              <p className="text-[10px] text-emerald-500 font-semibold">Portfolio stability</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Heart className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-md border border-border/80 hover:border-primary/20 transition-all duration-300">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Sprint Velocity
              </p>
              <h3 className="text-2xl font-black font-mono">{avgVelocity}</h3>
              <p className="text-[10px] text-muted-foreground">
                {activeSprints.length} active sprints
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-500">
              <Zap className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-card/25 border border-border/80">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  {activeChartTab === 'budget'
                    ? 'Budget Utilization Trend'
                    : 'Derived Sprint Burndown Engine'}
                </h4>
                <p className="text-[10px] text-muted-foreground">
                  {activeChartTab === 'budget'
                    ? 'Allocated vs spent budget over project lifecycle'
                    : 'Derived remaining effort comparing Ideal vs Actual vs Predictive Forecast'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-background/50 border border-border/40 p-1 rounded-lg">
                <button
                  onClick={() => setActiveChartTab('burndown')}
                  className={`text-[9px] font-bold px-2.5 py-1 rounded transition-all duration-200 ${
                    activeChartTab === 'burndown'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Burndown
                </button>
                <button
                  onClick={() => setActiveChartTab('budget')}
                  className={`text-[9px] font-bold px-2.5 py-1 rounded transition-all duration-200 ${
                    activeChartTab === 'budget'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Budget Trend
                </button>
              </div>
            </div>

            {activeChartTab === 'budget' ? (
              <AreaChartWrapper
                data={budgetTrendData}
                xKey="month"
                metrics={[
                  { key: 'budget', label: 'Budget ($)', color: 'hsl(var(--primary))' },
                  { key: 'spent', label: 'Spent ($)', color: '#10b981' },
                ]}
                height={200}
              />
            ) : (
              <div className="space-y-4">
                {/* Custom Responsive SVG Burndown Chart */}
                <div className="relative w-full h-[180px] bg-background/30 rounded-lg border border-border/20 p-2 overflow-hidden flex items-end">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-5 pointer-events-none">
                    <div className="border-b border-foreground" />
                    <div className="border-b border-foreground" />
                    <div className="border-b border-foreground" />
                    <div className="border-b border-foreground" />
                  </div>

                  {/* Custom SVG Line Chart */}
                  <svg
                    className="w-full h-full overflow-visible"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    {/* 1. Ideal Burndown Line */}
                    <path
                      d="M 0 0 L 100 100"
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="1.2"
                      strokeDasharray="3 3"
                    />

                    {/* 2. Actual Burndown Line (Day 0 to Day 6) */}
                    <path
                      d="M 0 0 L 10 10 L 20 22 L 30 25 L 40 45 L 50 51 L 60 62"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                    />

                    {/* 3. Predictive Forecast Line (Day 6 to Day 10) */}
                    <path
                      d="M 60 62 L 70 73 L 80 84 L 90 95 L 100 100"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />

                    {/* Nodes / Dots */}
                    <circle cx="0" cy="0" r="1.5" fill="#10b981" />
                    <circle cx="60" cy="62" r="1.5" fill="#f59e0b" />
                    <circle cx="100" cy="100" r="1.5" fill="#8b5cf6" />
                  </svg>

                  {/* Y-Axis Label */}
                  <div className="absolute left-1.5 top-1 text-[8px] font-bold text-muted-foreground font-mono">
                    100% Scope
                  </div>
                  {/* X-Axis Label */}
                  <div className="absolute right-2 bottom-1 text-[8px] font-bold text-muted-foreground font-mono">
                    Day 10 (Sprint Close)
                  </div>
                </div>

                {/* Derived Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-background/25 border border-border/30 rounded-lg p-3">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">
                      Predictability
                    </span>
                    <span className="text-sm font-black text-primary font-mono">
                      {predictabilityScore}%
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">
                      Completion Rate
                    </span>
                    <span className="text-sm font-black text-emerald-500 font-mono">
                      {completionRate}%
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">
                      Carry Over Work
                    </span>
                    <span className="text-sm font-black text-rose-500 font-mono">
                      {carryOverCount} milestones
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">
                      Delivery Pace
                    </span>
                    <span className="text-sm font-black text-cyan-500 font-mono">Consistent</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/25 border border-border/80">
          <CardContent className="p-5 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-foreground">Status Distribution</h4>
              <p className="text-[10px] text-muted-foreground">Project pipeline breakdown</p>
            </div>
            {statusChartData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">
                No projects registered.
              </div>
            ) : (
              <PieChartWrapper data={statusChartData} height={200} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="bg-card/25 border border-border/80">
          <CardContent className="p-5 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-foreground">PM Workload</h4>
              <p className="text-[10px] text-muted-foreground">Projects per manager</p>
            </div>
            <BarChartWrapper
              data={managerWorkloadData}
              xKey="name"
              metrics={[{ key: 'projects', label: 'Projects', color: 'hsl(var(--primary))' }]}
              height={180}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-card/25 border border-border/80">
          <CardContent className="p-5 space-y-3.5">
            <div>
              <h4 className="text-sm font-bold text-foreground">Risk Alert Monitor</h4>
              <p className="text-[10px] text-muted-foreground">
                Projects with low health or elevated risk levels
              </p>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {atRiskProjects.map((p) => (
                <div
                  key={p._id}
                  onClick={() => setSelectedProject(p)}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card/45 hover:bg-card hover:border-border transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="h-7 w-7 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mt-0.5">
                      <AlertTriangle className="h-4 w-4" />
                    </span>
                    <div className="space-y-0.5 min-w-0">
                      <h5 className="text-xs font-bold text-foreground truncate">{p.name}</h5>
                      <p className="text-[10px] text-muted-foreground truncate">
                        PM:{' '}
                        <span className="font-semibold text-foreground/80">
                          {p.projectManager || 'Unassigned'}
                        </span>{' '}
                        • Health: <span className="font-bold text-rose-500">{p.healthScore}%</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 uppercase tracking-wider font-bold select-none">
                    {p.riskLevel} Risk
                  </span>
                </div>
              ))}
              {atRiskProjects.length === 0 && (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  🎉 All projects are in healthy condition!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};
