'use client';

import { useState, useEffect } from 'react';
import { useHRStore } from '@/store/hrStore';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
} from '@/components/ui';
import {
  Users,
  Clock,
  CalendarCheck,
  Megaphone,
  Briefcase,
  Play,
  Square,
  CheckCircle,
  MapPin,
  FileText,
} from 'lucide-react';
import { motion } from 'framer-motion';

export function HrDashboard() {
  const {
    employees,
    todayPunch,
    attendanceHistory,
    leaveRequests,
    announcements,
    clockInOut,
    approveLeave,
    loading,
  } = useHRStore();

  const [workMode, setWorkMode] = useState<'remote' | 'hybrid' | 'office'>('remote');
  const [notes, setNotes] = useState('');
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  // Clock in Timer Tick
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (todayPunch && todayPunch.checkIn && !todayPunch.checkOut) {
      const start = new Date(todayPunch.checkIn).getTime();
      const tick = () => {
        const diff = Date.now() - start;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const pad = (n: number) => String(n).padStart(2, '0');
        setElapsedTime(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      };
      tick();
      interval = setInterval(tick, 1000);
    } else {
      const timer = setTimeout(() => {
        setElapsedTime((prev) => {
          if (prev !== '00:00:00') return '00:00:00';
          return prev;
        });
      }, 0);
      return () => clearTimeout(timer);
    }
    return () => clearInterval(interval);
  }, [todayPunch]);

  const handlePunch = async () => {
    await clockInOut(workMode, 'Office Coordinates', notes);
    setNotes('');
  };

  // Workforce KPIs
  const totalStaff = employees.length;
  const onboardingStaff = employees.filter((e) => e.status === 'onboarding').length;
  const pendingApprovals = leaveRequests.filter((r) => r.status === 'pending').length;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Left 2 Columns: KPIs, Leaves Queue, Analytics */}
      <div className="xl:col-span-2 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-card/40 border-border/80 backdrop-blur-md relative overflow-hidden">
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Total Active Staff
                </p>
                <h3 className="text-3xl font-bold">{totalStaff}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Users className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/80 backdrop-blur-md">
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  New Onboardings
                </p>
                <h3 className="text-3xl font-bold text-amber-500">{onboardingStaff}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Briefcase className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/80 backdrop-blur-md">
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Pending Leaves
                </p>
                <h3 className="text-3xl font-bold text-rose-500">{pendingApprovals}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                <CalendarCheck className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leave Requests Approvals Queue */}
        <Card className="bg-card/40 border-border/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-rose-500" />
              Time Off Approval Queue
            </CardTitle>
            <CardDescription>
              Review, approve or reject pending employee leave requests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leaveRequests.filter((r) => r.status === 'pending').length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-2 border border-dashed border-border/40 rounded-xl bg-card/10">
                <CheckCircle className="h-8 w-8 text-muted-foreground/60" />
                <p className="text-sm text-muted-foreground font-medium">Leave Queue is Empty</p>
                <p className="text-xs text-muted-foreground/80">
                  No pending time-off requests require your approval.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {leaveRequests
                  .filter((r) => r.status === 'pending')
                  .map((request) => (
                    <div
                      key={request._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border bg-card/30 backdrop-blur-sm gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            {request.employeeId?.fullName}
                          </span>
                          <Badge variant="outline" className="text-xs py-0">
                            {request.leaveType}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Designation: {request.employeeId?.designation || 'Staff'}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">
                          Dates: {new Date(request.startDate).toLocaleDateString()} -{' '}
                          {new Date(request.endDate).toLocaleDateString()} ({request.totalDays}{' '}
                          Days)
                        </p>
                        {request.reason && (
                          <p className="text-xs text-foreground bg-card/60 p-2 rounded border border-border/40 italic">
                            Reason: &quot;{request.reason}&quot;
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            approveLeave(
                              request._id,
                              'rejected',
                              'Declined due to coverage constraints'
                            )
                          }
                          className="text-rose-500 border-rose-500/20 hover:bg-rose-500/10"
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => approveLeave(request._id, 'approved', 'Approved')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Premium SVG Workforce Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Headcount Trends Chart */}
          <Card className="bg-card/40 border-border/80 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Headcount Growth Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <svg
                className="w-full h-32 text-primary"
                viewBox="0 0 300 100"
                preserveAspectRatio="none"
              >
                {/* Grid Lines */}
                <line
                  x1="0"
                  y1="20"
                  x2="300"
                  y2="20"
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="50"
                  x2="300"
                  y2="50"
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="80"
                  x2="300"
                  y2="80"
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth="1"
                />

                {/* Gradient Fill */}
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(var(--primary-rgb), 0.3)" />
                    <stop offset="100%" stopColor="rgba(var(--primary-rgb), 0.0)" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,90 Q50,70 100,60 T200,45 T300,20 L300,100 L0,100 Z"
                  fill="url(#growthGrad)"
                />
                <path
                  d="M0,90 Q50,70 100,60 T200,45 T300,20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]"
                />
                {/* Nodes */}
                <circle cx="100" cy="60" r="4" fill="currentColor" />
                <circle cx="200" cy="45" r="4" fill="currentColor" />
                <circle cx="300" cy="20" r="4" fill="currentColor" />
              </svg>
              <div className="flex justify-between w-full mt-2 text-[10px] text-muted-foreground font-semibold">
                <span>Q1 2025</span>
                <span>Q3 2025</span>
                <span>Q1 2026</span>
              </div>
            </CardContent>
          </Card>

          {/* Skill Distribution Analytics */}
          <Card className="bg-card/40 border-border/80 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Department Skills Proficiencies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Engineering (TypeScript, Mongoose)</span>
                  <span className="text-primary">92%</span>
                </div>
                <div className="h-2 w-full bg-border/40 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Product Experience (Figma, Wireframing)</span>
                  <span className="text-amber-500">84%</span>
                </div>
                <div className="h-2 w-full bg-border/40 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '84%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Workforce Ops (BambooHR, Gusto)</span>
                  <span className="text-rose-500">76%</span>
                </div>
                <div className="h-2 w-full bg-border/40 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: '76%' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Column: Clock widget, Announcements bulletin */}
      <div className="space-y-6">
        {/* Attendance Stopwatch Punch Card */}
        <Card className="border-border/80 bg-gradient-to-br from-card/80 to-card/20 backdrop-blur-md shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-primary/5 blur-2xl"></div>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock
                className="h-5 w-5 text-primary animate-spin"
                style={{ animationDuration: '6s' }}
              />
              Shift Clock Center
            </CardTitle>
            <CardDescription>Timezone-safe daily clock-in registry.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6 text-center space-y-4">
            {/* Stopwatch Face */}
            <div className="relative flex flex-col items-center justify-center h-44 w-44 rounded-full border-4 border-dashed border-primary/20 bg-card/60 shadow-inner">
              <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">
                Active Shift
              </div>
              <div className="text-2xl font-black font-mono tracking-tight text-foreground">
                {elapsedTime}
              </div>
              <div className="text-[10px] text-emerald-500 font-semibold mt-1">
                {todayPunch && !todayPunch.checkOut ? 'Clocked In' : 'Punch Clock Idle'}
              </div>
            </div>

            {/* Mode & Note selector (if not punched out) */}
            {!todayPunch && (
              <div className="w-full space-y-3">
                <div className="flex justify-center gap-2">
                  {(['remote', 'hybrid', 'office'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setWorkMode(mode)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-200 uppercase ${
                        workMode === mode
                          ? 'bg-primary/10 text-primary border-primary'
                          : 'border-border/60 text-muted-foreground hover:bg-card hover:text-foreground'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Scrum notes or location..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-card/50 border border-border/80 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground/60"
                />
              </div>
            )}

            {/* Main Action Button */}
            {todayPunch?.checkOut ? (
              <div className="w-full p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 text-xs font-semibold flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Today&apos;s Shift Successfully Complete
              </div>
            ) : (
              <Button
                onClick={handlePunch}
                disabled={loading.punchAction}
                className={`w-full py-6 font-bold text-sm tracking-wide gap-2 rounded-xl transition-all duration-300 ${
                  todayPunch && !todayPunch.checkOut
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-[0_0_20px_rgba(225,29,72,0.15)]'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)]'
                }`}
              >
                {todayPunch && !todayPunch.checkOut ? (
                  <>
                    <Square className="h-4 w-4 fill-current" />
                    PUNCH CLOCK OUT
                  </>
                ) : (
                  <>
                    <Play
                      className="h-4 w-4 fill-current animate-ping"
                      style={{ animationDuration: '2s' }}
                    />
                    PUNCH CLOCK IN
                  </>
                )}
              </Button>
            )}

            {/* Today's Punch Timeline details */}
            {todayPunch && (
              <div className="w-full text-left bg-card/40 p-4 border border-border/60 rounded-xl space-y-2 mt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Today&apos;s Timeline
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Punch In:
                  </span>
                  <span className="font-semibold">
                    {new Date(todayPunch.checkIn).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {todayPunch.checkOut && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Punch Out:
                    </span>
                    <span className="font-semibold text-emerald-500">
                      {new Date(todayPunch.checkOut).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
                {todayPunch.notes && (
                  <p className="text-[11px] text-muted-foreground italic border-t border-border/40 pt-1.5 mt-1.5">
                    &quot;{todayPunch.notes}&quot;
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Announcements bulletin scrollboard */}
        <Card className="bg-card/40 border-border/80 backdrop-blur-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-amber-500" />
              Company Bulletin
            </CardTitle>
            <CardDescription>Internal updates and targeted broadcasts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {announcements.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border/40 rounded-xl">
                No recent announcements.
              </div>
            ) : (
              announcements.map((item) => (
                <div
                  key={item._id}
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    item.isPinned
                      ? 'border-amber-500/20 bg-amber-500/5 shadow-[0_0_12px_rgba(245,158,11,0.05)]'
                      : 'border-border bg-card/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h4 className="font-semibold text-xs text-foreground tracking-tight line-clamp-1">
                      {item.title}
                    </h4>
                    {item.isPinned && (
                      <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] px-1.5 py-0">
                        PINNED
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-3 mb-2 leading-relaxed">
                    {item.content}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground/80 font-medium border-t border-border/30 pt-2">
                    <span>By: {item.postedBy?.name || 'HR Manager'}</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
