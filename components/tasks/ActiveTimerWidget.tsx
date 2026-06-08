'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useTasksStore } from '@/store/tasksStore';
import { Clock, Square, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/cn';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

/** Format elapsed seconds as HH:MM:SS */
function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  }
  return `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

/** Format decimal hours as "Xh Ym" */
function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function ActiveTimerWidget() {
  const { runningTimer, stopTimer } = useTasksStore();
  const router = useRouter();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isStopping, setIsStopping] = useState(false);

  // Rehydrate from localStorage on mount if store is empty
  useEffect(() => {
    const stored = localStorage.getItem('syncgrid_running_timer');
    if (stored && !runningTimer) {
      try {
        const parsed = JSON.parse(stored);
        useTasksStore.setState({ runningTimer: parsed });
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live tick — update every second while timer runs
  useEffect(() => {
    if (!runningTimer) {
      setTimeout(() => setElapsedSeconds(0), 0);
      return;
    }
    const startMs = new Date(runningTimer.startTime).getTime();
    const compute = () => {
      const diff = Math.floor((Date.now() - startMs) / 1000);
      setElapsedSeconds(Math.max(0, diff));
    };
    compute();
    const interval = setInterval(compute, 1000);
    return () => clearInterval(interval);
  }, [runningTimer]);

  const handleStop = useCallback(async () => {
    if (!runningTimer || isStopping) return;
    setIsStopping(true);
    try {
      await stopTimer(runningTimer.taskId, 'Tracked work session', true);
      toast.success('Timer stopped and time logged!');
    } catch {
      toast.error('Failed to stop timer.');
    } finally {
      setIsStopping(false);
    }
  }, [runningTimer, stopTimer, isStopping]);

  if (!runningTimer) return null;

  const estimatedSeconds = (runningTimer.estimatedHours || 0) * 3600;
  const remainingSeconds = Math.max(0, estimatedSeconds - elapsedSeconds);
  const utilizationPct =
    estimatedSeconds > 0
      ? Math.min(200, Math.round((elapsedSeconds / estimatedSeconds) * 100))
      : null;
  const isOverrun = estimatedSeconds > 0 && elapsedSeconds > estimatedSeconds;

  return (
    <div
      className={cn(
        'group flex items-center gap-2.5 h-10 pl-3 pr-1.5 rounded-full border backdrop-blur-xl transition-all duration-300 shadow-lg select-none',
        isOverrun
          ? 'bg-rose-950/20 border-rose-900/50 shadow-[0_0_20px_rgba(244,63,94,0.1)]'
          : 'bg-[#121212]/80 border-white/10'
      )}
    >
      {/* Recording Indicator (Glowing Dot) */}
      <div className="relative flex items-center justify-center w-4 h-4 shrink-0">
        <span
          className={cn(
            'absolute w-2 h-2 rounded-full animate-ping opacity-75',
            isOverrun ? 'bg-rose-500' : 'bg-emerald-500'
          )}
        />
        <span
          className={cn(
            'relative w-2 h-2 rounded-full',
            isOverrun
              ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
              : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
          )}
        />
      </div>

      {/* Task & Project */}
      <div className="flex flex-col justify-center max-w-[140px] md:max-w-[200px]">
        <span className="truncate text-xs font-medium text-white/90 leading-tight">
          {runningTimer.taskTitle || 'Active Task'}
        </span>
        {runningTimer.projectName && (
          <span className="truncate text-[10px] font-medium text-white/40 leading-tight tracking-wide mt-0.5">
            {runningTimer.projectName}
          </span>
        )}
      </div>

      {/* Quick open task */}
      {/* <button
        onClick={() => router.push(`/tasks?open=${runningTimer.taskId}`)}
        className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-white/10 transition-colors text-white/30 hover:text-white shrink-0 ml-1"
        title="Open task details"
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </button> */}

      {/* Vertical Divider */}
      <div className="w-px h-5 bg-white/10 shrink-0 mx-1" />

      {/* Timer Display */}
      <div className="flex flex-col justify-center min-w-[56px] text-center">
        <span
          className={cn(
            'font-mono text-sm font-medium tabular-nums tracking-tight',
            isOverrun ? 'text-rose-400' : 'text-white'
          )}
        >
          {formatElapsed(elapsedSeconds)}
        </span>
        {isOverrun && (
          <span className="text-[8px] font-bold text-rose-500 uppercase tracking-widest leading-none mt-0.5">
            Overrun
          </span>
        )}
      </div>

      {/* Stop Button */}
      <button
        onClick={handleStop}
        disabled={isStopping}
        className={cn(
          'flex items-center gap-1.5 h-7 px-3.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all shrink-0 ml-1',
          'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_12px_rgba(225,29,72,0.4)]',
          isStopping && 'opacity-50 cursor-wait scale-95'
        )}
        title="Stop timer and log time"
      >
        <div className="w-2 h-2 rounded-[2px] bg-white shadow-sm" />
        Stop
      </button>
    </div>
  );
}
