'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from 'react';
import { useHRStore } from '@/store/hrStore';
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from '@/components/ui';
import {
  User,
  Phone,
  DollarSign,
  Calendar,
  Clock,
  Award,
  Shield,
  FileText,
  CheckSquare,
  Briefcase,
  Play,
  Square,
  Activity,
  Save,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function ProfilePage() {
  const {
    myProfile,
    fetchMyProfile,
    updateMyProfile,
    setPresence,
    todayPunch,
    fetchAttendance,
    clockInOut,
    leaveBalances,
    announcements,
    fetchAnnouncements,
    loading,
  } = useHRStore();

  const [activeTab, setActiveTab] = useState('overview');

  // Self-edit states
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState('UTC');

  // Banking & Tax states
  const [bankRouting, setBankRouting] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [taxFormW4Signed, setTaxFormW4Signed] = useState(false);
  const [taxFormW9Signed, setTaxFormW9Signed] = useState(false);
  const [govIdVerified, setGovIdVerified] = useState(false);

  // Leave Form state
  const [leaveType, setLeaveType] = useState('casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  // Clock state
  const [workMode, setWorkMode] = useState('remote');
  const [notes, setNotes] = useState('');
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  useEffect(() => {
    fetchMyProfile();
    fetchAttendance();
    fetchAnnouncements();
  }, [fetchMyProfile, fetchAttendance, fetchAnnouncements]);

  // Sync edit states when profile loads
  useEffect(() => {
    if (myProfile) {
      setPhone(myProfile.phone || '');
      setDisplayName(myProfile.displayName || myProfile.fullName || '');
      setTimezone(myProfile.timezone || 'UTC');

      const meta = myProfile.payrollMetadata || {};
      setBankRouting(meta.bankRouting || '');
      setBankAccount(meta.bankAccount || '');
      setTaxFormW4Signed(!!meta.taxFormW4Signed);
      setTaxFormW9Signed(!!meta.taxFormW9Signed);
      setGovIdVerified(!!meta.govIdVerified);
    }
  }, [myProfile]);

  // Clock elapsed ticking
  useEffect(() => {
    let interval: any;
    if (todayPunch && todayPunch.checkIn && !todayPunch.checkOut) {
      const start = new Date(todayPunch.checkIn).getTime();
      interval = setInterval(() => {
        const diff = Date.now() - start;
        const secs = Math.floor((diff / 1000) % 60);
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        const hrs = Math.floor(diff / (1000 * 60 * 60));

        const pad = (num: number) => num.toString().padStart(2, '0');
        setElapsedTime(`${pad(hrs)}:${pad(mins)}:${pad(secs)}`);
      }, 1000);
    } else {
      setElapsedTime('00:00:00');
    }
    return () => clearInterval(interval);
  }, [todayPunch]);

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateMyProfile({
      phone,
      displayName,
      timezone,
    });
    if (success) {
      toast.success('Contact info successfully synced.');
    }
  };

  const handleUpdateBanking = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateMyProfile({
      payrollMetadata: {
        bankRouting,
        bankAccount,
        taxFormW4Signed,
        taxFormW9Signed,
        govIdVerified,
      },
    });
    if (success) {
      toast.success('Secure banking configurations stored.');
    }
  };

  const handleClockPunch = async () => {
    await clockInOut(
      workMode,
      'Browser Verified Session',
      notes || 'Clocked via Web Self-Service Profile'
    );
    setNotes('');
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !leaveReason) {
      toast.error('All leave fields must be completed.');
      return;
    }
    const res = await useHRStore.getState().requestLeave({
      leaveType,
      startDate,
      endDate,
      reason: leaveReason,
    });
    if (res) {
      setStartDate('');
      setEndDate('');
      setLeaveReason('');
    }
  };

  if (!myProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">
          Resolving secure employee context...
        </p>
      </div>
    );
  }

  const payroll = myProfile.payrollReadiness || { score: 0, checks: {}, status: 'critical' };
  const checklist = myProfile.onboardingChecklist || {};
  const checklistKeys = Object.keys(checklist);
  const checklistCompleted = checklistKeys.filter((k) => checklist[k]).length;
  const checklistPercent =
    checklistKeys.length > 0 ? Math.round((checklistCompleted / checklistKeys.length) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 bg-gradient-to-r from-card to-card/50 border border-border p-6 rounded-xl shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center text-primary font-bold text-2xl shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]">
            {myProfile.fullName
              .split(' ')
              .map((n: string) => n[0])
              .join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">{myProfile.fullName}</h2>
              <Badge variant="outline" className="border-primary/30 text-primary font-bold">
                {myProfile.employeeId}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              {myProfile.designation} • {myProfile.departmentId?.name || 'Staff'}
            </p>
          </div>
        </div>

        {/* Presence Selector Widget */}
        <div className="flex items-center gap-3 self-start lg:self-center">
          <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
            Presence Status
          </span>
          <select
            value={myProfile.presenceStatus || 'offline'}
            onChange={(e) => setPresence(e.target.value as any)}
            className="bg-card text-foreground border border-border rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary shadow-sm hover:border-primary transition-all duration-200"
          >
            <option value="online">🟢 Online</option>
            <option value="away">🟡 Away</option>
            <option value="offline">⚪ Offline</option>
          </select>
        </div>
      </div>

      {/* Analytics Gauge Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/50 border-border/80 backdrop-blur-md hover:border-primary/20 transition-all duration-200">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="h-12 w-12 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Total Shift Hours
              </p>
              <h4 className="text-2xl font-bold mt-1">
                {(myProfile.attendanceSummary?.hoursTracked || 0).toFixed(1)}h
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Present: {myProfile.attendanceSummary?.presentCount || 0}d (Late:{' '}
                {myProfile.attendanceSummary?.lateCount || 0}d)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/80 backdrop-blur-md hover:border-primary/20 transition-all duration-200">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="h-12 w-12 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-500">
              <CheckSquare className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Onboarding Checklist
              </p>
              <h4 className="text-2xl font-bold mt-1">{checklistPercent}% Complete</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {checklistCompleted} of {checklistKeys.length} items checked
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/80 backdrop-blur-md hover:border-primary/20 transition-all duration-200">
          <CardContent className="flex items-center gap-4 py-6">
            {/* SVG Radial Gauge */}
            <div className="relative h-14 w-14 flex items-center justify-center">
              <svg className="h-full w-full transform -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="currentColor"
                  className="text-border"
                  strokeWidth="3"
                  fill="transparent"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="currentColor"
                  className={payroll.status === 'compliant' ? 'text-emerald-500' : 'text-amber-500'}
                  strokeWidth="3.5"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 24}
                  strokeDashoffset={2 * Math.PI * 24 * (1 - payroll.score / 100)}
                />
              </svg>
              <span className="absolute text-xs font-black">{payroll.score}%</span>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Payroll Compliance Score
              </p>
              <h4 className="text-lg font-black mt-0.5 text-foreground capitalize flex items-center gap-1.5">
                {payroll.status}
                {payroll.status === 'compliant' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
              </h4>
              <p className="text-xs text-muted-foreground">Compliance parameters verified</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Switcher Navigation */}
      <div className="flex border-b border-border bg-card/10 p-1.5 rounded-lg gap-1 overflow-x-auto scrollbar-none">
        {[
          { id: 'overview', label: 'My Identity & Skills', icon: User },
          { id: 'attendance', label: 'Stopwatch Clock & Time Off', icon: Calendar },
          { id: 'work', label: 'Assigned Projects & Tasks', icon: Briefcase },
          { id: 'payroll', label: 'Direct Deposit & Compliance', icon: DollarSign },
          { id: 'audit', label: 'Security Activity Audits', icon: Activity },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                  : 'text-muted-foreground hover:bg-card hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Viewports */}
      <div className="mt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form column */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base font-bold">Personal Profile Metadata</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateContact} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-muted-foreground uppercase">
                            Display Name
                          </label>
                          <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="bg-card text-foreground border border-border rounded-lg w-full px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-muted-foreground uppercase">
                            Verified Email
                          </label>
                          <input
                            type="email"
                            value={myProfile.email}
                            disabled
                            className="bg-muted text-muted-foreground border border-border rounded-lg w-full px-3 py-2 text-sm cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-muted-foreground uppercase">
                            Phone Number
                          </label>
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="bg-card text-foreground border border-border rounded-lg w-full px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-muted-foreground uppercase">
                            Workplace Timezone
                          </label>
                          <select
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            className="bg-card text-foreground border border-border rounded-lg w-full px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="UTC">UTC (GMT+0)</option>
                            <option value="EST">EST (New York)</option>
                            <option value="PST">PST (Los Angeles)</option>
                            <option value="IST">IST (New Delhi)</option>
                            <option value="GMT">GMT (London)</option>
                          </select>
                        </div>
                      </div>
                      <Button type="submit" size="sm" className="gap-2 shadow-sm font-bold">
                        <Save className="h-4 w-4" />
                        Save Profile Updates
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Skills Card */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-bold">Certified Skills</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(!myProfile.skills || myProfile.skills.length === 0) && (
                        <p className="text-xs text-muted-foreground">No certifications listed.</p>
                      )}
                      {myProfile.skills?.map((sk: any, idx: number) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-foreground">{sk.name}</span>
                            <span className="text-muted-foreground font-medium">
                              Level {sk.proficiency}/5
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${(sk.proficiency / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-bold flex items-center gap-1.5">
                        <Shield className="h-4 w-4 text-primary" />
                        Emergency Contacts
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(!myProfile.emergencyContacts ||
                        myProfile.emergencyContacts.length === 0) && (
                        <p className="text-xs text-muted-foreground">No emergency contacts set.</p>
                      )}
                      {myProfile.emergencyContacts?.map((c: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-card/30 border border-border p-3 rounded-lg flex items-center justify-between"
                        >
                          <div>
                            <h5 className="text-xs font-bold text-foreground">{c.name}</h5>
                            <p className="text-[10px] text-muted-foreground uppercase font-black mt-0.5">
                              {c.relation}
                            </p>
                          </div>
                          <span className="text-xs text-primary font-semibold flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {c.phone}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Attendance & Leaves Tab */}
            {activeTab === 'attendance' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Clock widgets */}
                <div className="space-y-6 lg:col-span-2">
                  <Card className="relative overflow-hidden bg-gradient-to-b from-card to-card/50">
                    {todayPunch && !todayPunch.checkOut && (
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-primary to-indigo-500 animate-pulse" />
                    )}
                    <CardHeader>
                      <CardTitle className="text-base font-bold flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-primary" />
                        Timezone stopwatch punch clock
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex flex-col items-center justify-center p-6 bg-card border border-border rounded-xl w-full md:w-52 text-center shadow-inner">
                        <span className="text-xs text-muted-foreground uppercase tracking-widest font-black">
                          ELAPSED TIME
                        </span>
                        <h2 className="text-3xl font-black mt-2 font-mono tracking-wider text-primary animate-pulse">
                          {elapsedTime}
                        </h2>
                        <span className="text-[10px] text-muted-foreground font-bold mt-1">
                          Today&apos;s Active Registry
                        </span>
                      </div>

                      <div className="space-y-4 flex-1">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase">
                              Work Mode
                            </label>
                            <select
                              value={workMode}
                              onChange={(e) => setWorkMode(e.target.value)}
                              disabled={!!(todayPunch && !todayPunch.checkOut)}
                              className="bg-card text-foreground border border-border rounded-lg w-full px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                            >
                              <option value="remote">💻 Remote</option>
                              <option value="hybrid">🚗 Hybrid</option>
                              <option value="office">🏢 Office</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase">
                              Session State
                            </label>
                            <div className="flex items-center mt-2 gap-2 text-xs font-bold">
                              {todayPunch ? (
                                todayPunch.checkOut ? (
                                  <span className="text-muted-foreground">🔴 Punched Out</span>
                                ) : (
                                  <span className="text-emerald-500 animate-pulse">
                                    🟢 Punch Active
                                  </span>
                                )
                              ) : (
                                <span className="text-amber-500">⚪ Idle</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-muted-foreground uppercase">
                            Daily Scrum Notes
                          </label>
                          <input
                            type="text"
                            placeholder="Write your daily scrum agenda here..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={!!(todayPunch && todayPunch.checkOut)}
                            className="bg-card text-foreground border border-border rounded-lg w-full px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                          />
                        </div>

                        <Button
                          onClick={handleClockPunch}
                          disabled={!!(todayPunch && todayPunch.checkOut)}
                          className={`w-full font-bold uppercase text-xs tracking-wider gap-2 shadow-md ${
                            todayPunch && !todayPunch.checkOut
                              ? 'bg-rose-600 hover:bg-rose-700 text-white'
                              : 'bg-primary hover:bg-primary/90'
                          }`}
                        >
                          {todayPunch && !todayPunch.checkOut ? (
                            <>
                              <Square className="h-4 w-4 fill-current" />
                              PUNCH OUT NOW
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 fill-current" />
                              PUNCH IN SHIFT
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Attendance Log history */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-bold">Punch Chronology</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!todayPunch && (
                        <p className="text-xs text-muted-foreground">
                          No attendance punches logged today.
                        </p>
                      )}
                      {todayPunch && (
                        <div className="border border-border p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/30">
                          <div>
                            <span className="text-[10px] text-muted-foreground uppercase font-black">
                              TODAY&apos;S SHIFT
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="outline"
                                className="border-indigo-500/30 text-indigo-500 capitalize font-bold text-[10px]"
                              >
                                {todayPunch.workMode}
                              </Badge>
                              <span className="text-xs text-muted-foreground font-medium">
                                Punch In:{' '}
                                {new Date(todayPunch.checkIn).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            {todayPunch.notes && (
                              <p className="text-xs italic text-muted-foreground mt-2">
                                &quot;{todayPunch.notes}&quot;
                              </p>
                            )}
                          </div>
                          {todayPunch.checkOut && (
                            <div className="text-right">
                              <span className="text-xs font-bold text-foreground block">
                                Duration:{' '}
                                {(
                                  (new Date(todayPunch.checkOut).getTime() -
                                    new Date(todayPunch.checkIn).getTime()) /
                                  (1000 * 60 * 60)
                                ).toFixed(2)}
                                h
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                Out:{' '}
                                {new Date(todayPunch.checkOut).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Apply Leaves Form */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-bold">Leave Allowances</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-3">
                      {[
                        {
                          label: 'Casual',
                          val: leaveBalances.casualDays || 12,
                          max: 12,
                          color: 'text-indigo-500 bg-indigo-500/10',
                        },
                        {
                          label: 'Sick',
                          val: leaveBalances.sickDays || 10,
                          max: 10,
                          color: 'text-rose-500 bg-rose-500/10',
                        },
                        {
                          label: 'Paid',
                          val: leaveBalances.paidDays || 15,
                          max: 15,
                          color: 'text-emerald-500 bg-emerald-500/10',
                        },
                      ].map((b, idx) => (
                        <div
                          key={idx}
                          className="border border-border p-3 rounded-lg text-center bg-card"
                        >
                          <span className="text-[10px] text-muted-foreground font-black uppercase">
                            {b.label}
                          </span>
                          <h4 className="text-lg font-black mt-1 text-foreground">{b.val}</h4>
                          <span className="text-[9px] text-muted-foreground block">
                            of {b.max}d
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-bold">Request Time Off</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleApplyLeave} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-muted-foreground uppercase">
                            Leave Type
                          </label>
                          <select
                            value={leaveType}
                            onChange={(e) => setLeaveType(e.target.value)}
                            className="bg-card text-foreground border border-border rounded-lg w-full px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                          >
                            <option value="casual">Casual Leave</option>
                            <option value="sick">Sick Leave</option>
                            <option value="paid">Paid Time Off</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase">
                              Start Date
                            </label>
                            <input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="bg-card text-foreground border border-border rounded-lg w-full px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase">
                              End Date
                            </label>
                            <input
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="bg-card text-foreground border border-border rounded-lg w-full px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-muted-foreground uppercase">
                            Reason for Leave
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Write reason details for your request..."
                            value={leaveReason}
                            onChange={(e) => setLeaveReason(e.target.value)}
                            className="bg-card text-foreground border border-border rounded-lg w-full px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                          />
                        </div>
                        <Button
                          type="submit"
                          size="sm"
                          className="w-full gap-1.5 shadow-sm font-bold text-xs uppercase tracking-wide"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Submit Request
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Assigned Work Tab */}
            {activeTab === 'work' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Projects Column */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-primary" />
                      Assigned Projects
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(!myProfile.assignedProjects || myProfile.assignedProjects.length === 0) && (
                      <p className="text-xs text-muted-foreground">
                        No active project assignments.
                      </p>
                    )}
                    {myProfile.assignedProjects?.map((proj: any, idx: number) => (
                      <div
                        key={idx}
                        className="border border-border p-4 rounded-xl space-y-3 hover:border-primary/20 transition-all duration-200 bg-card"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h5 className="text-sm font-bold text-foreground">{proj.name}</h5>
                            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider mt-0.5 block">
                              {proj.code}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className="border-indigo-500/30 text-indigo-500 capitalize font-bold text-[10px]"
                          >
                            {proj.status || 'Active'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                          <span className="text-muted-foreground font-semibold">Allocation:</span>
                          <span className="text-primary font-black">{proj.allocation}% Alloc</span>
                        </div>
                        <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${proj.allocation}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Tasks Column */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-1.5">
                      <CheckSquare className="h-4 w-4 text-primary" />
                      Assigned Sprint Tasks
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(!myProfile.assignedTasks || myProfile.assignedTasks.length === 0) && (
                      <p className="text-xs text-muted-foreground">
                        No tasks assigned to your sprint backlog.
                      </p>
                    )}
                    {myProfile.assignedTasks?.map((task: any, idx: number) => (
                      <div
                        key={idx}
                        className="border border-border p-4 rounded-xl flex justify-between items-center bg-card hover:border-primary/20 transition-all duration-200"
                      >
                        <div>
                          <h5 className="text-xs font-bold text-foreground">{task.title}</h5>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge
                              variant="outline"
                              className="border-primary/30 text-primary font-bold text-[9px] uppercase"
                            >
                              {task.priority || 'Medium'}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              Estimates: {task.estimatedHours || 0}h
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground capitalize border border-border/80 rounded-lg px-2 py-1 bg-card/50">
                          {task.status || 'In Progress'}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Payroll & Compliance Tab */}
            {activeTab === 'payroll' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Direct Deposit details form */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base font-bold">
                      Direct Deposit configurations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateBanking} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-muted-foreground uppercase">
                            Bank Routing Number
                          </label>
                          <input
                            type="text"
                            placeholder="9-digit Routing Number"
                            value={bankRouting}
                            onChange={(e) => setBankRouting(e.target.value)}
                            className="bg-card text-foreground border border-border rounded-lg w-full px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-muted-foreground uppercase">
                            Bank Account Number
                          </label>
                          <input
                            type="password"
                            placeholder="Account Number (Masked)"
                            value={bankAccount}
                            onChange={(e) => setBankAccount(e.target.value)}
                            className="bg-card text-foreground border border-border rounded-lg w-full px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                          />
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase block">
                          Compliance Checklist
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={taxFormW4Signed}
                              onChange={(e) => setTaxFormW4Signed(e.target.checked)}
                              className="rounded border-border text-primary focus:ring-primary"
                            />
                            I have signed and submitted my Form W-4 (Employee&apos;s Withholding
                            Certificate)
                          </label>
                          <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={taxFormW9Signed}
                              onChange={(e) => setTaxFormW9Signed(e.target.checked)}
                              className="rounded border-border text-primary focus:ring-primary"
                            />
                            I have signed and submitted my Form W-9 (Request for Taxpayer ID)
                          </label>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase block">
                          Government Identity Document
                        </label>
                        <div className="flex items-center gap-3">
                          <select
                            value={govIdVerified ? 'true' : 'false'}
                            onChange={(e) => setGovIdVerified(e.target.value === 'true')}
                            className="bg-card text-foreground border border-border rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="false">❌ ID Verification Pending</option>
                            <option value="true">✅ Government Passport/ID Verified</option>
                          </select>
                          <span className="text-[10px] text-muted-foreground">
                            Verification status is audited
                          </span>
                        </div>
                      </div>

                      <Button type="submit" size="sm" className="gap-2 shadow-sm font-bold">
                        <Save className="h-4 w-4" />
                        Save Banking & Tax Details
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Compliance Sidebar */}
                <div className="space-y-6">
                  <Card className="border-amber-500/20 bg-amber-500/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-bold flex items-center gap-1.5 text-amber-500">
                        <AlertCircle className="h-4 w-4" />
                        Compliance Warnings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {payroll.score < 90 ? (
                        <>
                          <p className="text-xs text-muted-foreground">
                            Your payroll direct deposit and compliance status is incomplete. Please
                            resolve the following parameter checkmarks to avoid tax or payout
                            interruptions:
                          </p>
                          <ul className="space-y-1.5 text-xs font-semibold text-foreground">
                            {!bankRouting && (
                              <li className="flex items-center gap-1.5 text-rose-500">
                                ❌ Add bank Routing routing
                              </li>
                            )}
                            {!bankAccount && (
                              <li className="flex items-center gap-1.5 text-rose-500">
                                ❌ Add bank Account number
                              </li>
                            )}
                            {!taxFormW4Signed && (
                              <li className="flex items-center gap-1.5 text-rose-500">
                                ❌ Submit signed W-4 Document
                              </li>
                            )}
                            {!govIdVerified && (
                              <li className="flex items-center gap-1.5 text-rose-500">
                                ❌ Government ID verification
                              </li>
                            )}
                          </ul>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center py-4 space-y-2">
                          <CheckCircle2 className="h-10 w-10 text-emerald-500 animate-bounce" />
                          <h6 className="text-xs font-bold text-foreground">
                            Compliant Workforce Profile
                          </h6>
                          <p className="text-[10px] text-muted-foreground">
                            All Direct Deposit payroll and legal parameters are verified.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Audit Logs Tab */}
            {activeTab === 'audit' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-bold">
                    Self-Activity Security Audits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(!myProfile.activities || myProfile.activities.length === 0) && (
                    <p className="text-xs text-muted-foreground">
                      No recent profile audit logs recorded.
                    </p>
                  )}
                  {myProfile.activities?.map((act: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex gap-4 border-b border-border/60 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-0.5">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <h6 className="text-xs font-bold text-foreground">{act.title}</h6>
                        <p className="text-xs text-muted-foreground">{act.description}</p>
                        <span className="text-[10px] text-muted-foreground font-medium block">
                          {new Date(act.createdAt).toLocaleString([], {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
