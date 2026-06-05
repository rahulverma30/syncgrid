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
  Input,
  Modal,
  Select,
  DateInput,
} from '@/components/ui';
import {
  Clock,
  Plus,
  History,
  Calendar as CalendarIcon,
  Gift,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

export function HrLeaves() {
  const {
    leaveRequests,
    leaveBalances,
    holidays,
    fetchLeaves,
    fetchHolidays,
    requestLeave,
    loading,
  } = useHRStore();

  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [form, setForm] = useState({
    leaveType: 'casual',
    startDate: '',
    endDate: '',
    reason: '',
  });

  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)); // Default to May 2026 for simulation sync

  useEffect(() => {
    fetchLeaves();
    fetchHolidays();
  }, [fetchLeaves, fetchHolidays]);

  // Overlap and collision forecasting checks
  const getLeaveOverlapAlert = () => {
    if (!form.startDate || !form.endDate) return null;
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);

    // Check holiday overlaps
    const matchedHoliday = holidays.find((h) => {
      const hDate = new Date(h.date);
      return hDate >= start && hDate <= end;
    });

    if (matchedHoliday) {
      return {
        type: 'holiday',
        message: `Note: selected dates overlap with corporate holiday "${matchedHoliday.name}" (${new Date(matchedHoliday.date).toLocaleDateString()}). Corporate holidays do not consume your leave balances.`,
      };
    }

    // Check request collisions
    const overlappingRequest = leaveRequests.find((r) => {
      if (r.status === 'rejected') return false;
      const rStart = new Date(r.startDate);
      const rEnd = new Date(r.endDate);
      return start <= rEnd && end >= rStart;
    });

    if (overlappingRequest) {
      return {
        type: 'conflict',
        message: `⚠️ Range overlaps with another leave request (${new Date(overlappingRequest.startDate).toLocaleDateString()} to ${new Date(overlappingRequest.endDate).toLocaleDateString()}) with status "${overlappingRequest.status}".`,
      };
    }

    return null;
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate) {
      toast.error('Dates are required!');
      return;
    }

    const success = await requestLeave({
      leaveType: form.leaveType,
      startDate: form.startDate,
      endDate: form.endDate,
      reason: form.reason,
    });

    if (success) {
      setIsRequestOpen(false);
      setForm({
        leaveType: 'casual',
        startDate: '',
        endDate: '',
        reason: '',
      });
    }
  };

  // Calendar Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Calendar Grid builder
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const daysGrid: { day: number; isCurrentMonth: boolean; dateString: string }[] = [];

  // Pad previous month days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const prevDay = prevMonthTotalDays - i;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}`;
    daysGrid.push({ day: prevDay, isCurrentMonth: false, dateString: dateStr });
  }

  // Current month days
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    daysGrid.push({ day: d, isCurrentMonth: true, dateString: dateStr });
  }

  // Pad next month days to align grid to 42 cells (6 rows)
  const remaining = 42 - daysGrid.length;
  for (let n = 1; n <= remaining; n++) {
    const dateStr = `${year}-${String(month + 2).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
    daysGrid.push({ day: n, isCurrentMonth: false, dateString: dateStr });
  }

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const overlapAlert = getLeaveOverlapAlert();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Columns: Allowances & Request History */}
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-card/40 border-border/80 backdrop-blur-md">
            <CardContent className="pt-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Casual Leave Balance
              </span>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-foreground">
                  {leaveBalances.casualDays || 0} Days
                </span>
                <Badge className="bg-primary/10 text-primary border-primary/20">Casual</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/80 backdrop-blur-md">
            <CardContent className="pt-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Sick Leave Balance
              </span>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-amber-500">
                  {leaveBalances.sickDays || 0} Days
                </span>
                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Sick</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/80 backdrop-blur-md">
            <CardContent className="pt-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Paid Leave Balance
              </span>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-emerald-500">
                  {leaveBalances.paidDays || 0} Days
                </span>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  Paid
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Request logs history */}
        <Card className="bg-card/40 border-border/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Time Off Requests History
              </CardTitle>
              <CardDescription>Review and track status of time off applications.</CardDescription>
            </div>
            <Button
              onClick={() => setIsRequestOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs py-5 px-4 rounded-xl gap-2 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)] whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Request Time Off
            </Button>
          </CardHeader>
          <CardContent>
            {leaveRequests.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground border border-dashed border-border/40 rounded-xl bg-card/10">
                No leave requests filed.
              </div>
            ) : (
              <div className="space-y-4">
                {leaveRequests.map((req) => (
                  <div
                    key={req._id}
                    className="p-4 rounded-xl border border-border bg-card/30 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {req.leaveType} Leave
                        </span>
                        <Badge
                          className={`text-[9px] uppercase font-bold py-0.5 ${
                            req.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : req.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          }`}
                        >
                          {req.status}
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold text-foreground">
                        Duration: {new Date(req.startDate).toLocaleDateString()} -{' '}
                        {new Date(req.endDate).toLocaleDateString()} ({req.totalDays} Days)
                      </p>
                      {req.reason && (
                        <p className="text-xs text-muted-foreground italic">
                          Reason: &quot;{req.reason}&quot;
                        </p>
                      )}
                      {req.managerNotes && (
                        <p className="text-[11px] text-muted-foreground/80 bg-card/50 p-2 rounded border border-border/30">
                          Manager: &quot;{req.managerNotes}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column: High-Fidelity Enterprise Calendar Grid */}
      <div className="space-y-6">
        <Card className="bg-card/40 border-border/80 backdrop-blur-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wide flex items-center gap-1.5">
                <CalendarIcon className="h-4.5 w-4.5 text-primary" />
                Corporate Calendar
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={handlePrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-bold px-1 text-foreground min-w-[75px] text-center">
                  {monthNames[month]} {year}
                </span>
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardDescription className="text-[11px]">
              Corporate timezone-safe calendar scheduler
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Days header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase text-muted-foreground">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                <div key={idx} className="py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {daysGrid.map((cell, idx) => {
                // Find matched holiday
                const cellDate = new Date(cell.dateString);
                const hasHoliday = holidays.some((h) => {
                  const hDate = new Date(h.date);
                  return (
                    hDate.getFullYear() === cellDate.getFullYear() &&
                    hDate.getMonth() === cellDate.getMonth() &&
                    hDate.getDate() === cellDate.getDate()
                  );
                });

                // Find active user leave
                const hasLeave = leaveRequests.some((r) => {
                  if (r.status === 'rejected') return false;
                  const start = new Date(r.startDate);
                  const end = new Date(r.endDate);
                  const startMidnight = new Date(
                    start.getFullYear(),
                    start.getMonth(),
                    start.getDate()
                  );
                  const endMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate());
                  const currentMidnight = new Date(
                    cellDate.getFullYear(),
                    cellDate.getMonth(),
                    cellDate.getDate()
                  );
                  return currentMidnight >= startMidnight && currentMidnight <= endMidnight;
                });

                return (
                  <div
                    key={idx}
                    className={`relative aspect-square flex flex-col items-center justify-center rounded-lg border text-xs font-bold transition-all duration-200 ${
                      !cell.isCurrentMonth
                        ? 'border-transparent text-muted-foreground/35 cursor-default'
                        : hasHoliday
                          ? 'bg-primary/10 border-primary text-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.1)]'
                          : hasLeave
                            ? 'bg-teal-500/10 border-teal-500/30 text-teal-400'
                            : 'border-border/60 hover:border-primary/25 cursor-pointer bg-card/10'
                    }`}
                  >
                    <span>{cell.day}</span>
                    {hasHoliday && (
                      <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary animate-pulse" />
                    )}
                    {hasLeave && !hasHoliday && (
                      <span className="absolute bottom-1 h-1 w-1 rounded-full bg-teal-400" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Corporate Holidays list footer */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Upcoming Days Off This Month
              </span>
              {holidays.filter((h) => {
                const hDate = new Date(h.date);
                return hDate.getMonth() === month && hDate.getFullYear() === year;
              }).length === 0 ? (
                <p className="text-[10px] text-muted-foreground italic">
                  No corporate holidays scheduled in this month.
                </p>
              ) : (
                <div className="space-y-2">
                  {holidays
                    .filter((h) => {
                      const hDate = new Date(h.date);
                      return hDate.getMonth() === month && hDate.getFullYear() === year;
                    })
                    .map((h, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center p-2 rounded-lg border border-border/80 bg-card/20 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Gift className="h-4 w-4 text-primary" />
                          <div>
                            <span className="font-bold block">{h.name}</span>
                            <span className="text-[9px] text-muted-foreground uppercase font-black tracking-wider">
                              Type: {h.type} • {h.scope}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-primary/25 text-primary text-[10px]"
                        >
                          {new Date(h.date).getDate()}d
                        </Badge>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Request Time Off Modal */}
      <Modal
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
        title="Submit Time Off Request"
      >
        <form onSubmit={handleSubmitLeave} className="space-y-4 pt-2">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Leave Type
            </label>
            <Select
              value={form.leaveType}
              onChange={(val) => setForm({ ...form, leaveType: val })}
              options={[
                { value: 'casual', label: 'Casual Time Off' },
                { value: 'sick', label: 'Sick Leave' },
                { value: 'paid', label: 'Paid Vacation Leave' },
                { value: 'unpaid', label: 'Unpaid Leave' },
                { value: 'emergency', label: 'Emergency Leave' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Start Date
              </label>
              <DateInput
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                End Date
              </label>
              <DateInput
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
                className="text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Reason for Leave
            </label>
            <Input
              placeholder="Provide reason for time off request..."
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="text-xs"
            />
          </div>

          {/* Conflict overlap forecast notifications */}
          {overlapAlert && (
            <div
              className={`p-3 border rounded-lg flex items-start gap-2 text-xs ${
                overlapAlert.type === 'holiday'
                  ? 'border-indigo-500/20 bg-indigo-500/5 text-indigo-500'
                  : 'border-rose-500/20 bg-rose-500/5 text-rose-500'
              }`}
            >
              {overlapAlert.type === 'holiday' ? (
                <Info className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
              )}
              <p className="leading-normal">{overlapAlert.message}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRequestOpen(false)}
              className="text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading.requestLeave}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-4"
            >
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
