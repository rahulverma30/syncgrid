'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PageHeader, Card, CardContent, Button, Modal, Input, DateInput } from '@/components/ui';
import { Clock, Calendar, Users, Edit } from 'lucide-react';
import { AttendanceWidget } from '@/components/attendance/AttendanceWidget';
import { EmployeeActivityDrawer } from '@/components/hr/EmployeeActivityDrawer';
import { toast } from 'sonner';
import { getClientError, getNetworkError, SUCCESS_MESSAGES } from '@/lib/errors';

export default function AttendancePage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('me');
  const [myLogs, setMyLogs] = useState([]);
  const [teamStatus, setTeamStatus] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Employee Activity Drawer states
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [activityUserId, setActivityUserId] = useState<string | null>(null);

  // Correction Modal States
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [correctionLog, setCorrectionLog] = useState<any>(null);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);

  const handleOpenActivity = (userId: string) => {
    setActivityUserId(userId);
    setIsActivityOpen(true);
  };

  const handleOpenCorrection = (record: any) => {
    setCorrectionLog(record);

    // Format dates for datetime-local input
    if (record.log?.startTime) {
      const d = new Date(record.log.startTime);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setNewStartTime(d.toISOString().slice(0, 16));
    } else {
      setNewStartTime('');
    }

    if (record.log?.endTime) {
      const d = new Date(record.log.endTime);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setNewEndTime(d.toISOString().slice(0, 16));
    } else {
      setNewEndTime('');
    }

    setIsCorrectionOpen(true);
  };

  const handleSaveCorrection = async () => {
    if (!correctionLog?.log?._id) return;
    setIsSubmittingCorrection(true);
    try {
      const res = await fetch('/api/protected/attendance/admin/corrections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logId: correctionLog.log._id,
          startTime: newStartTime ? new Date(newStartTime).toISOString() : undefined,
          endTime: newEndTime ? new Date(newEndTime).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Attendance record corrected');
        setIsCorrectionOpen(false);
        fetchTeamStatus();
      } else {
        toast.error(data.message || 'Correction failed');
      }
    } catch (err) {
      toast.error('Network error during correction');
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  const roles = session?.user?.roles || [];
  const isAdmin = roles.some((role) => ['super-admin', 'admin', 'hr'].includes(role.toLowerCase()));

  const getLocalDateStr = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const fetchMyHistory = async () => {
    try {
      const start = new Date();
      start.setDate(start.getDate() - 30); // last 30 days
      const end = new Date();
      const res = await fetch(
        `/api/protected/attendance/me?startDate=${getLocalDateStr(start)}&endDate=${getLocalDateStr(end)}`
      );
      const data = await res.json();
      if (data.success) {
        setMyLogs(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamStatus = async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const res = await fetch(`/api/protected/attendance/admin?localDate=${localDate}`);
      const data = await res.json();
      if (data.success) {
        setTeamStatus(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMyHistory();
    if (isAdmin && activeTab === 'team') {
      fetchTeamStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAdmin]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workforce Management"
        title="Attendance & Time Tracking"
        description="Monitor your daily shifts, break times, and total active working hours."
      />

      <div className="flex items-center gap-2 border-b border-border/40 pb-2">
        <Button
          variant={activeTab === 'me' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('me')}
          className="h-8 gap-2"
        >
          <Clock className="w-4 h-4" /> My Attendance
        </Button>
        {isAdmin && (
          <Button
            variant={activeTab === 'team' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('team')}
            className="h-8 gap-2"
          >
            <Users className="w-4 h-4" /> Team Activity
          </Button>
        )}
      </div>

      {activeTab === 'me' && (
        <div className="space-y-6">
          <AttendanceWidget />

          <Card className="border-border/80 bg-card/30">
            <CardContent className="p-0">
              <div className="flex items-center gap-2 p-4 border-b border-border/40">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-bold text-foreground text-sm">30-Day History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/30 text-muted-foreground uppercase">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Start Time</th>
                      <th className="px-4 py-3 font-semibold text-right">End Time</th>
                      <th className="px-4 py-3 font-semibold text-right">Worked (hrs)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {myLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          No recent attendance logs found.
                        </td>
                      </tr>
                    )}
                    {myLogs.map((log: any) => (
                      <tr key={log._id} className="hover:bg-muted/10">
                        <td className="px-4 py-3 font-mono font-bold">{log.date}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500">
                            {log.status || 'Completed'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-right">
                          {log.startTime
                            ? new Date(log.startTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </td>
                        <td className="px-4 py-3 font-mono text-right">
                          {log.endTime
                            ? new Date(log.endTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold">
                          {log.totalWorkedMinutes
                            ? (log.totalWorkedMinutes / 60).toFixed(1)
                            : '0.0'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'team' && isAdmin && (
        <Card className="border-border/80 bg-card/30">
          <CardContent className="p-0">
            <div className="flex items-center gap-2 p-4 border-b border-border/40 justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-bold text-foreground text-sm">Real-Time Team Status</h3>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px]"
                onClick={fetchTeamStatus}
              >
                Refresh
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/30 text-muted-foreground uppercase">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Employee</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Start Time</th>
                    <th className="px-4 py-3 font-semibold text-right">Worked (hrs)</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {isLoading && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        Loading team data...
                      </td>
                    </tr>
                  )}
                  {!isLoading && teamStatus.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No team data found.
                      </td>
                    </tr>
                  )}
                  {teamStatus.map((record: any) => (
                    <tr key={record.user._id} className="hover:bg-muted/10 group">
                      <td className="px-4 py-3">
                        <div
                          className="font-bold text-foreground cursor-pointer hover:underline hover:text-primary transition-colors"
                          onClick={() => handleOpenActivity(record.user._id)}
                        >
                          {record.user.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{record.user.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                          {record.user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            record.status === 'Working'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : record.status === 'Paused'
                                ? 'bg-amber-500/10 text-amber-500'
                                : record.status === 'Completed'
                                  ? 'bg-slate-500/10 text-slate-500'
                                  : 'bg-rose-500/10 text-rose-500'
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-right">
                        {record.log?.startTime
                          ? new Date(record.log.startTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        {record.log?.totalWorkedMinutes
                          ? (record.log.totalWorkedMinutes / 60).toFixed(1)
                          : '0.0'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {record.log && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleOpenCorrection(record)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* HR Correction Modal */}
      <Modal
        isOpen={isCorrectionOpen}
        onClose={() => setIsCorrectionOpen(false)}
        title="Correct Attendance Record"
        description={`Modify session details for ${correctionLog?.user?.name}`}
      >
        <div className="space-y-4">
          <DateInput
            label="Start Time"
            value={newStartTime}
            onChange={(e) => setNewStartTime(e.target.value)}
          />
          <DateInput
            label="End Time"
            value={newEndTime}
            onChange={(e) => setNewEndTime(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsCorrectionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCorrection} isLoading={isSubmittingCorrection}>
              Save Corrections
            </Button>
          </div>
        </div>
      </Modal>

      <EmployeeActivityDrawer
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
        userId={activityUserId}
      />
    </div>
  );
}
