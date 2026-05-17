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
} from '@/components/ui';
import { Clock, Plus, History } from 'lucide-react';
import { toast } from 'sonner';

export function HrLeaves() {
  const {
    leaveRequests,
    leaveBalances,
    attendanceHistory,
    requestLeave,
    fetchLeaves,
    fetchAttendance,
    loading,
  } = useHRStore();

  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [form, setForm] = useState({
    leaveType: 'casual',
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    fetchLeaves();
    fetchAttendance();
  }, [fetchLeaves, fetchAttendance]);

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Columns: Time Off Allowances & Request History */}
      <div className="lg:col-span-2 space-y-6">
        {/* Balances Row */}
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

        {/* Leave Request Logs */}
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
                    {req.status === 'approved' && (
                      <div className="text-[10px] text-muted-foreground font-medium self-end sm:self-center">
                        Approved by: {req.approvedBy?.name || 'HR Team'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Attendance Shift Logs Timeline */}
      <div>
        <Card className="bg-card/40 border-border/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Attendance logs (Past 7 Days)
            </CardTitle>
            <CardDescription>Time-stamps of checked shifts and punch locations.</CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceHistory.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground border border-dashed border-border/40 rounded-xl bg-card/10">
                No active attendance records.
              </div>
            ) : (
              <div className="space-y-4 relative pl-4 border-l border-border/60">
                {attendanceHistory.map((log) => {
                  const checkInTime = new Date(log.checkIn).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const checkOutTime = log.checkOut
                    ? new Date(log.checkOut).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Active';

                  return (
                    <div key={log._id} className="relative space-y-1">
                      {/* Timeline dot */}
                      <div
                        className={`absolute -left-[21px] top-1.5 h-3.5 w-3.5 rounded-full border-2 bg-card ${
                          log.status === 'present' ? 'border-emerald-500' : 'border-amber-500'
                        }`}
                      ></div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">
                          {new Date(log.date).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[9px] uppercase font-semibold py-0"
                        >
                          {log.workMode}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {checkInTime} - {checkOutTime}
                        </span>
                        {log.overtimeMinutes > 0 && (
                          <span className="text-emerald-500 text-[10px] font-bold">
                            +{Math.round((log.overtimeMinutes / 60) * 10) / 10}h OT
                          </span>
                        )}
                      </div>

                      {log.notes && (
                        <p className="text-[10px] text-muted-foreground/80 italic pl-1">
                          &quot;{log.notes}&quot;
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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
            <select
              value={form.leaveType}
              onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
              className="w-full bg-card/20 border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary"
            >
              <option value="casual" className="bg-card text-foreground">
                Casual Time Off
              </option>
              <option value="sick" className="bg-card text-foreground">
                Sick Leave
              </option>
              <option value="paid" className="bg-card text-foreground">
                Paid Vacation Leave
              </option>
              <option value="unpaid" className="bg-card text-foreground">
                Unpaid Leave
              </option>
              <option value="emergency" className="bg-card text-foreground">
                Emergency Leave
              </option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Start Date
              </label>
              <Input
                type="date"
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
              <Input
                type="date"
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
