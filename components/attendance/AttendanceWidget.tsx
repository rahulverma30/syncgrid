'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button } from '@/components/ui';
import { Clock, Play, Square, Coffee, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export const AttendanceWidget = () => {
  const [log, setLog] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getLocalDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  async function fetchTodayLog() {
    try {
      const res = await fetch(`/api/protected/attendance/me?localDate=${getLocalDate()}`);
      const data = await res.json();
      if (data.success) {
        setLog(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch attendance log', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTodayLog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePunchIn() {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/protected/attendance/punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ localDate: getLocalDate() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Punched In Successfully');
        setLog(data.data);
      } else {
        toast.error(data.message || 'Failed to punch in');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePunchOut() {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/protected/attendance/punch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ localDate: getLocalDate() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Punched Out Successfully');
        setLog(data.data);
      } else {
        toast.error(data.message || 'Failed to punch out');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStartBreak() {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/protected/attendance/break', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ localDate: getLocalDate() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Break Started');
        setLog(data.data);
      } else {
        toast.error(data.message || 'Failed to start break');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEndBreak() {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/protected/attendance/break', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ localDate: getLocalDate() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Break Ended');
        setLog(data.data);
      } else {
        toast.error(data.message || 'Failed to end break');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <Card className="border-border/80 bg-card/30">
        <CardContent className="p-4 flex items-center justify-center min-h-[100px]">
          <div className="animate-pulse flex gap-2 items-center text-muted-foreground text-xs">
            <Clock className="w-4 h-4 animate-spin" />
            Loading attendance...
          </div>
        </CardContent>
      </Card>
    );
  }

  const isOnBreak =
    log && log.breaks && log.breaks.length > 0 && !log.breaks[log.breaks.length - 1].end;
  const isPunchedIn = log && log.punchIn && !log.punchOut;
  const isPunchedOut = log && log.punchOut;

  return (
    <Card className="border-border/80 bg-card/30 overflow-hidden relative group">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary/50 group-hover:bg-primary transition-colors" />
      <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Time Tracker</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                My Attendance
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                  isPunchedOut
                    ? 'bg-slate-500/10 text-slate-500'
                    : isOnBreak
                      ? 'bg-amber-500/10 text-amber-500'
                      : isPunchedIn
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-blue-500/10 text-blue-500'
                }`}
              >
                {isPunchedOut
                  ? 'Completed'
                  : isOnBreak
                    ? 'On Break'
                    : isPunchedIn
                      ? 'Working'
                      : 'Not Started'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {!log || (!isPunchedIn && !isPunchedOut) ? (
            <Button
              onClick={handlePunchIn}
              isLoading={isSubmitting}
              className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-9"
              size="sm"
            >
              <Play className="w-3.5 h-3.5" />
              Punch In
            </Button>
          ) : isPunchedOut ? (
            <div className="flex items-center gap-3 bg-muted/20 px-3 py-1.5 rounded-lg border border-border/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-foreground">Shift Complete</span>
                <span className="text-[9px] text-muted-foreground">
                  {Math.floor(log.totalWorkedMinutes / 60)}h {log.totalWorkedMinutes % 60}m worked
                </span>
              </div>
            </div>
          ) : (
            <>
              {isOnBreak ? (
                <Button
                  onClick={handleEndBreak}
                  isLoading={isSubmitting}
                  variant="outline"
                  size="sm"
                  className="w-full md:w-auto gap-2 border-amber-500/50 text-amber-500 hover:bg-amber-500/10 h-9"
                >
                  <Coffee className="w-3.5 h-3.5" />
                  End Break
                </Button>
              ) : (
                <Button
                  onClick={handleStartBreak}
                  isLoading={isSubmitting}
                  variant="outline"
                  size="sm"
                  className="w-full md:w-auto gap-2 h-9"
                >
                  <Coffee className="w-3.5 h-3.5" />
                  Take Break
                </Button>
              )}
              <Button
                onClick={handlePunchOut}
                isLoading={isSubmitting}
                variant="destructive"
                size="sm"
                className="w-full md:w-auto gap-2 h-9"
              >
                <Square className="w-3.5 h-3.5" />
                Punch Out
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
