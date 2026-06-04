import React from 'react';
import { Card, CardContent } from '@/components/ui';
import { PieChartWrapper, BarChartWrapper } from '@/components/ui/charts';
import { useProjectsStore } from '@/store/projectsStore';
import { Layers, TrendingUp, DollarSign, Heart, Zap, AlertTriangle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export const ProjectAnalytics: React.FC = () => {
  const { projects, setSelectedProject } = useProjectsStore();

  // ── KPI Calculations ──────────────────────────────────────────────────────
  const activeProjects = projects.filter(
    (p) => !['completed', 'cancelled', 'on-hold'].includes(p.status)
  );
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const avgHealth =
    projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + p.healthScore, 0) / projects.length)
      : 0;

  const totalEstimatedHours = projects.reduce((sum, p) => sum + (p.estimatedHours || 0), 0);
  const totalActualHours = projects.reduce((sum, p) => sum + (p.actualHours || 0), 0);
  const activeMembersSet = new Set<string>();
  projects.forEach((p) => {
    if (['planning', 'design', 'development', 'testing'].includes(p.status) && p.teamMembers) {
      p.teamMembers.forEach((m: any) => activeMembersSet.add(m._id || m.userName));
    }
  });
  const activeMembersCount = activeMembersSet.size;

  // Sprint velocity: average velocity across all active sprints
  const allSprints = projects.flatMap((p) => p.sprints || []);
  const activeSprints = allSprints.filter((s) => s.status === 'active' || s.status === 'completed');
  const avgVelocity =
    activeSprints.length > 0
      ? Math.round(activeSprints.reduce((sum, s) => sum + s.velocity, 0) / activeSprints.length)
      : 0;

  // ── Real Data Derived Metrics ───────────────────────────────
  const totalMilestonesCount = projects.reduce((sum, p) => sum + (p.milestones || []).length, 0);
  const completedMilestonesCount = projects.reduce(
    (sum, p) => sum + (p.milestones || []).filter((m) => m.status === 'completed').length,
    0
  );

  const completionRate =
    totalMilestonesCount > 0
      ? Math.round((completedMilestonesCount / totalMilestonesCount) * 100)
      : 0;

  // ── Chart Data ────────────────────────────────────────────────────────────
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

  // Real data: Estimated vs Actual hours per active project
  const projectHoursData = activeProjects
    .map((p) => ({
      name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
      estimated: p.estimatedHours || 0,
      actual: p.actualHours || 0,
    }))
    .filter((d) => d.estimated > 0 || d.actual > 0);

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
                Total Hours Logged
              </p>
              <h3 className="text-2xl font-black font-mono">{totalActualHours.toFixed(1)}h</h3>
              <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" />
                {totalEstimatedHours}h estimated
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-md border border-border/80 hover:border-primary/20 transition-all duration-300">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Active Team Members
              </p>
              <h3 className="text-2xl font-black font-mono text-primary">{activeMembersCount}</h3>
              <p className="text-[10px] text-muted-foreground">Across active projects</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Layers className="h-5 w-5" />
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
                Milestone Progress
              </p>
              <h3 className="text-2xl font-black font-mono">{completionRate}%</h3>
              <p className="text-[10px] text-muted-foreground">
                {completedMilestonesCount} / {totalMilestonesCount} completed
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
                  Project Hours (Estimated vs Actual)
                </h4>
                <p className="text-[10px] text-muted-foreground">
                  Tracking time logged vs initial project estimates
                </p>
              </div>
            </div>

            {projectHoursData.length > 0 ? (
              <BarChartWrapper
                data={projectHoursData}
                xKey="name"
                metrics={[
                  { key: 'estimated', label: 'Estimated (h)', color: 'hsl(var(--primary))' },
                  { key: 'actual', label: 'Actual (h)', color: '#10b981' },
                ]}
                height={200}
              />
            ) : (
              <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">
                No active projects with hour estimates.
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
            {managerWorkloadData.length > 0 ? (
              <BarChartWrapper
                data={managerWorkloadData}
                xKey="name"
                metrics={[{ key: 'projects', label: 'Projects', color: 'hsl(var(--primary))' }]}
                height={180}
              />
            ) : (
              <div className="h-[180px] flex items-center justify-center text-xs text-muted-foreground">
                No projects registered.
              </div>
            )}
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
