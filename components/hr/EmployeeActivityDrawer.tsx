'use client';

import React, { useEffect, useState } from 'react';
import { Drawer, Badge, LoadingSpinner } from '@/components/ui';
import {
  User,
  Clock,
  Calendar,
  CheckCircle2,
  MapPin,
  History,
  Activity,
  Briefcase,
  DollarSign,
  Pin,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  module: string;
  time: string;
}

interface Stats {
  status: 'Working' | 'On Break' | 'Offline';
  todayHours: number;
  breakTime: number;
  overtime: number;
  lastActivity: string | null;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface EmployeeActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

export function EmployeeActivityDrawer({ isOpen, onClose, userId }: EmployeeActivityDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  const getLocalDate = () => {
    const d = new Date();
    return (
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0')
    );
  };

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/protected/attendance/timeline?userId=${userId}&date=${getLocalDate()}`
      );
      const data = await res.json();
      if (data.success) {
        setTimeline(data.timeline);
        setStats(data.stats);
        setUserData(data.user);
      }
    } catch (e) {
      console.error('Failed to fetch timeline', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchTimeline();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId]);

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'Attendance':
        return <Clock className="h-4 w-4" />;
      case 'Tasks':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'Projects':
        return <Briefcase className="h-4 w-4" />;
      case 'Finance':
        return <DollarSign className="h-4 w-4" />;
      case 'System':
        return <Pin className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      side="right"
      title="Employee Activity Details"
      description="View real-time chronological activity and current status"
      className="max-w-md w-full"
    >
      {loading || !stats || !userData ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <LoadingSpinner className="mb-4" />
          <p className="text-sm">Aggregating activity logs...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Employee Profile Header */}
          <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground leading-tight">{userData.name}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {userData.role}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`uppercase tracking-widest text-[9px] font-black ${
                  stats.status === 'Working'
                    ? 'border-green-500/50 text-green-500 bg-green-500/10'
                    : stats.status === 'On Break'
                      ? 'border-amber-500/50 text-amber-500 bg-amber-500/10'
                      : 'border-muted-foreground/50 text-muted-foreground bg-muted'
                }`}
              >
                {stats.status}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">
                  Today&apos;s Hours
                </p>
                <p className="text-sm font-black text-foreground">{stats.todayHours.toFixed(2)}h</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Break Time</p>
                <p className="text-sm font-black text-foreground">{stats.breakTime.toFixed(2)}h</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Overtime</p>
                <p className="text-sm font-black text-foreground">{stats.overtime.toFixed(2)}h</p>
              </div>
            </div>
            {stats.lastActivity && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                <History className="h-3 w-3" />
                Last Activity:{' '}
                {new Date(stats.lastActivity).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>

          {/* Today Timeline */}
          <div className="space-y-4">
            <h4 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Today Timeline
            </h4>

            {timeline.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-border rounded-lg bg-muted/10">
                <p className="text-xs text-muted-foreground">No activities recorded today.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-border ml-3 space-y-6 pb-4">
                {timeline.map((evt, idx) => (
                  <motion.div
                    key={evt.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative pl-5 space-y-1"
                  >
                    <span className="absolute -left-[13px] top-0.5 rounded-full border border-border bg-background p-1.5 flex items-center justify-center shadow-sm text-muted-foreground">
                      {getModuleIcon(evt.module)}
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <h5 className="text-xs font-bold text-foreground">{evt.title}</h5>
                      <span className="text-[10px] font-mono font-medium text-muted-foreground/80">
                        {new Date(evt.time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] leading-snug text-muted-foreground">
                      {evt.description}
                    </p>
                    <span className="inline-block mt-1 text-[9px] uppercase tracking-wider font-bold text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded">
                      {evt.module}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
