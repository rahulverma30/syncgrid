'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button, Select, Input } from '@/components/ui';
import { Clock, Play, Square, Coffee, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export const AttendanceWidget = () => {
  const [log, setLog] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [projectId, setProjectId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getLocalDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  async function fetchData() {
    try {
      const [logRes, projRes] = await Promise.all([
        fetch(`/api/protected/attendance/me?localDate=${getLocalDate()}`),
        fetch(`/api/protected/projects`),
      ]);
      const logData = await logRes.json();
      const projData = await projRes.json();

      if (logData.success) {
        setLog(logData.data);
      }
      if (projData.success) {
        setProjects(projData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch attendance data', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleStartWork() {
    if (!projectId || !description.trim()) {
      toast.error('Project and description are required to start work.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/protected/attendance/punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ localDate: getLocalDate(), projectId, description }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Work Started Successfully');
        setLog(data.data);
      } else {
        toast.error(data.message || 'Failed to start work');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEndWork() {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/protected/attendance/punch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ localDate: getLocalDate() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Work Ended Successfully');
        setLog(data.data);
      } else {
        toast.error(data.message || 'Failed to end work');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePauseWork() {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/protected/attendance/break', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ localDate: getLocalDate() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Work Paused');
        setLog(data.data);
      } else {
        toast.error(data.message || 'Failed to pause work');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResumeWork() {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/protected/attendance/break', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ localDate: getLocalDate() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Work Resumed');
        setLog(data.data);
      } else {
        toast.error(data.message || 'Failed to resume work');
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

  const isPaused =
    log && log.pauses && log.pauses.length > 0 && !log.pauses[log.pauses.length - 1].end;
  const isWorking = log && log.startTime && !log.endTime && !isPaused;
  const isCompleted = log && log.endTime;

  const projectOptions = projects.map((p) => ({ label: p.name, value: p._id }));

  return (
    <Card className="border-border/80 bg-card/30 overflow-hidden relative group">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary/50 group-hover:bg-primary transition-colors" />
      <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-foreground">Time Tracker</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                My Session
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                  isCompleted
                    ? 'bg-slate-500/10 text-slate-500'
                    : isPaused
                      ? 'bg-amber-500/10 text-amber-500'
                      : isWorking
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-blue-500/10 text-blue-500'
                }`}
              >
                {isCompleted
                  ? 'Completed'
                  : isPaused
                    ? 'Paused'
                    : isWorking
                      ? 'Working'
                      : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row flex-wrap items-center gap-3 w-full md:w-auto flex-1 justify-end">
          {!log || (!isWorking && !isPaused && !isCompleted) ? (
            <>
              <div className="w-full md:w-48">
                <Select
                  options={projectOptions}
                  value={projectId}
                  onChange={setProjectId}
                  placeholder="Select Project..."
                />
              </div>
              <div className="w-full md:w-48">
                <Input
                  placeholder="What are you working on?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-10"
                />
              </div>
              <Button
                onClick={handleStartWork}
                isLoading={isSubmitting}
                className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-10 shrink-0"
                size="sm"
              >
                <Play className="w-3.5 h-3.5" />
                Start Work
              </Button>
            </>
          ) : isCompleted ? (
            <div className="flex items-center gap-3 bg-muted/20 px-3 py-1.5 rounded-lg border border-border/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-foreground">Session Complete</span>
                <span className="text-[9px] text-muted-foreground">
                  {Math.floor(log.totalWorkedMinutes / 60)}h {log.totalWorkedMinutes % 60}m worked
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className="text-xs text-muted-foreground truncate max-w-[200px] mr-2">
                <strong>Project:</strong>{' '}
                {projects.find((p) => p._id === log.projectId)?.name || 'Unknown'}
                <br />
                <strong>Task:</strong> {log.description}
              </div>

              {isPaused ? (
                <Button
                  onClick={handleResumeWork}
                  isLoading={isSubmitting}
                  variant="outline"
                  size="sm"
                  className="w-full md:w-auto gap-2 border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10 h-10"
                >
                  <Play className="w-3.5 h-3.5" />
                  Resume Work
                </Button>
              ) : (
                <Button
                  onClick={handlePauseWork}
                  isLoading={isSubmitting}
                  variant="outline"
                  size="sm"
                  className="w-full md:w-auto gap-2 border-amber-500/50 text-amber-500 hover:bg-amber-500/10 h-10"
                >
                  <Coffee className="w-3.5 h-3.5" />
                  Pause Work
                </Button>
              )}
              <Button
                onClick={handleEndWork}
                isLoading={isSubmitting}
                variant="destructive"
                size="sm"
                className="w-full md:w-auto gap-2 h-10"
              >
                <Square className="w-3.5 h-3.5" />
                End Work
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
