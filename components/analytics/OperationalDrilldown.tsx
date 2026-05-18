'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartWrapper } from './ChartWrapper';
import {
  Briefcase,
  Users,
  Compass,
  Zap,
  TrendingUp,
  Clock,
  AlertOctagon,
  TrendingDown,
  Activity,
  Flame,
  Award,
  Layers,
} from 'lucide-react';

export function OperationalDrilldown() {
  const [drilldownTab, setDrilldownTab] = useState<'project' | 'workforce' | 'productivity'>(
    'project'
  );

  // Inner datasets
  const projectSprintSpeeds = [
    { label: 'Sprint 24', speed: 82, target: 80 },
    { label: 'Sprint 25', speed: 88, target: 80 },
    { label: 'Sprint 26', speed: 94, target: 80 },
    { label: 'Sprint 27', speed: 85, target: 85 },
    { label: 'Sprint 28', speed: 91, target: 85 },
    { label: 'Sprint 29', speed: 95, target: 85 },
  ];

  const workforceAttritionBurnout = [
    { label: 'Engineering', value: 12, color: 'hsl(var(--primary))' },
    { label: 'Product Design', value: 5, color: '#3b82f6' },
    { label: 'Consulting Delivery', value: 18, color: '#ec4899' },
    { label: 'Finance Operations', value: 3, color: '#f59e0b' },
  ];

  const taskCycleTimes = [
    { label: 'Week 1', cycleTime: 2.4 },
    { label: 'Week 2', cycleTime: 2.1 },
    { label: 'Week 3', cycleTime: 1.8 },
    { label: 'Week 4', cycleTime: 1.9 },
    { label: 'Week 5', cycleTime: 1.6 },
    { label: 'Week 6', cycleTime: 1.4 },
  ];

  return (
    <div className="space-y-6">
      {/* Sub tabs switcher */}
      <div className="flex gap-2 bg-muted/40 backdrop-blur-md p-1 border border-border rounded-lg w-fit">
        <button
          onClick={() => setDrilldownTab('project')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-md transition-all ${
            drilldownTab === 'project'
              ? 'bg-background text-primary shadow-sm border border-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Briefcase className="h-3.5 w-3.5" />
          Project Performance
        </button>
        <button
          onClick={() => setDrilldownTab('workforce')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-md transition-all ${
            drilldownTab === 'workforce'
              ? 'bg-background text-primary shadow-sm border border-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          Workforce & HR Logs
        </button>
        <button
          onClick={() => setDrilldownTab('productivity')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-md transition-all ${
            drilldownTab === 'productivity'
              ? 'bg-background text-primary shadow-sm border border-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          Task Flow Productivity
        </button>
      </div>

      {/* Grid panels based on sub tab */}
      <AnimatePresence mode="wait">
        {drilldownTab === 'project' && (
          <motion.div
            key="project"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Top row cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Card className="border-border bg-card/45 backdrop-blur-md">
                <CardContent className="p-5 flex items-center gap-4 select-none">
                  <div className="p-3 bg-primary/10 text-primary rounded-xl">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">
                      Sprint Velocity Speed
                    </span>
                    <h4 className="text-xl font-extrabold text-foreground">94.2% completion</h4>
                    <p className="text-[10px] text-muted-foreground font-semibold">
                      Committed vs delivered task points ratio.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/45 backdrop-blur-md">
                <CardContent className="p-5 flex items-center gap-4 select-none">
                  <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">
                      Timeline Overruns
                    </span>
                    <h4 className="text-xl font-extrabold text-foreground">2.1 days average</h4>
                    <p className="text-[10px] text-muted-foreground font-semibold">
                      Average delay on project timeline milestones.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/45 backdrop-blur-md">
                <CardContent className="p-5 flex items-center gap-4 select-none">
                  <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">
                      Direct Spending Ratios
                    </span>
                    <h4 className="text-xl font-extrabold text-foreground">Within Budget</h4>
                    <p className="text-[10px] text-muted-foreground font-semibold">
                      0.8% deviation variance across all scopes.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <ChartWrapper
              type="area"
              data={projectSprintSpeeds}
              xKey="label"
              metrics={[
                {
                  key: 'speed',
                  label: 'Average Sprint Velocity Speed (%)',
                  color: 'hsl(var(--primary))',
                },
                { key: 'target', label: 'Objective Milestone Target (%)', color: '#10b981' },
              ]}
              title="Milestones Sprint Completion Speeds"
              subtitle="Project delivery velocity across consecutive execution sprints"
              height={260}
            />
          </motion.div>
        )}

        {drilldownTab === 'workforce' && (
          <motion.div
            key="workforce"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Card className="border-border bg-card/45 backdrop-blur-md">
                <CardContent className="p-5 flex items-center gap-4 select-none">
                  <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">
                      Average Billable Hours
                    </span>
                    <h4 className="text-xl font-extrabold text-foreground">32.5 hrs/week</h4>
                    <p className="text-[10px] text-muted-foreground font-semibold">
                      Per consultant resource week logged.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/45 backdrop-blur-md">
                <CardContent className="p-5 flex items-center gap-4 select-none">
                  <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">
                      Attrition & Burnout Index
                    </span>
                    <h4 className="text-xl font-extrabold text-foreground">2 warning flags</h4>
                    <p className="text-[10px] text-muted-foreground font-semibold">
                      Resources exceeding 48hrs workload limits.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/45 backdrop-blur-md">
                <CardContent className="p-5 flex items-center gap-4 select-none">
                  <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                    <AlertOctagon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">
                      Absence sick leave patterns
                    </span>
                    <h4 className="text-xl font-extrabold text-foreground">1.4 days/month</h4>
                    <p className="text-[10px] text-muted-foreground font-semibold">
                      Average sick leave per individual resource.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <ChartWrapper
              type="donut"
              data={workforceAttritionBurnout}
              title="Employee Burnout Risk Profile Distribution"
              subtitle="Hours overload warning logs categorized by operational divisions"
              height={260}
            />
          </motion.div>
        )}

        {drilldownTab === 'productivity' && (
          <motion.div
            key="productivity"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <Card className="border-border bg-card/45 backdrop-blur-md">
                <CardContent className="p-5 flex items-center gap-4 select-none">
                  <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl">
                    <Clock className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">
                      Average Lead Time
                    </span>
                    <h4 className="text-sm font-extrabold text-foreground">4.2 days total</h4>
                    <p className="text-[9px] text-muted-foreground font-semibold">
                      Creation to delivery timeline.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/45 backdrop-blur-md">
                <CardContent className="p-5 flex items-center gap-4 select-none">
                  <div className="p-2.5 bg-purple-500/10 text-purple-500 rounded-xl">
                    <Activity className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">
                      Active Cycle Time
                    </span>
                    <h4 className="text-sm font-extrabold text-foreground">1.8 days devs</h4>
                    <p className="text-[9px] text-muted-foreground font-semibold">
                      Dev in-progress time limit.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/45 backdrop-blur-md">
                <CardContent className="p-5 flex items-center gap-4 select-none">
                  <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl">
                    <AlertOctagon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">
                      Blockers Unresolved
                    </span>
                    <h4 className="text-sm font-extrabold text-foreground">4 blocks active</h4>
                    <p className="text-[9px] text-muted-foreground font-semibold">
                      Tasks flagged as blocked.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/45 backdrop-blur-md">
                <CardContent className="p-5 flex items-center gap-4 select-none">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                    <Layers className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">
                      Flow Efficiency
                    </span>
                    <h4 className="text-sm font-extrabold text-foreground">74.2% ratio</h4>
                    <p className="text-[9px] text-muted-foreground font-semibold">
                      Active work vs queue states.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <ChartWrapper
              type="line"
              data={taskCycleTimes}
              xKey="label"
              metrics={[
                {
                  key: 'cycleTime',
                  label: 'Average Developer Cycle Time (Days)',
                  color: 'hsl(var(--primary))',
                },
              ]}
              title="Kanban Board Cycle Times Optimization Trends"
              subtitle="Average execution time logged in dev progress across chronological weeks"
              height={260}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
