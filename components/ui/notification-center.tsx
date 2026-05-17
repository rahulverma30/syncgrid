'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/cn';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Check,
  CheckCheck,
  Trash,
  Clock,
  Sparkles,
  Info,
  AlertTriangle,
  FileText,
  User,
} from 'lucide-react';
import { Button } from './button';
import { MutedText } from './typography';
import { toast } from 'sonner';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'alert';
}

interface NotificationDropdownProps {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  className?: string;
}

/**
 * Premium NotificationDropdown panel showing live notifications list
 */
export function NotificationDropdown({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  className,
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleMarkAll = () => {
    onMarkAllRead();
    toast.success('All notifications marked as read!');
  };

  const handleClearAll = () => {
    onClearAll();
    toast.success('Clear all notifications done.');
  };

  const typeIcon = {
    info: <Info className="h-4 w-4 text-blue-500" />,
    success: <Check className="h-4 w-4 text-emerald-500" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    alert: <AlertTriangle className="h-4 w-4 text-rose-500" />,
  };

  return (
    <div className={cn('relative select-none', className)}>
      {/* Bell Trigger */}
      <button
        onClick={toggleDropdown}
        className="relative h-10 w-10 rounded-full border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop click closer */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="absolute right-0 z-50 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-popover/95 backdrop-blur-md p-4 text-popover-foreground shadow-2xl flex flex-col max-h-[480px] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-2 flex-shrink-0">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold tracking-tight flex items-center gap-1.5 text-foreground leading-none">
                    Notifications
                    {unreadCount > 0 && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-extrabold text-primary font-mono leading-none">
                        {unreadCount} new
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] text-muted-foreground/80 leading-none">
                    Stay synced with workspace updates
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAll}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
                  >
                    <CheckCheck className="h-3 w-3 text-primary" />
                    Mark all read
                  </button>
                )}
              </div>

              {/* List Container */}
              <div className="flex-grow overflow-y-auto space-y-2 py-2 pr-1 max-h-[300px] scrollbar-hide">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center space-y-2 select-none">
                    <div className="mx-auto h-10 w-10 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground/50">
                      <Bell className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-foreground">Zero Alerts</p>
                      <p className="text-[10px] text-muted-foreground/80">
                        No workspace notifications have arrived.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => onMarkRead(notif.id)}
                        className={cn(
                          'relative flex gap-3 p-3 rounded-lg border border-border/45 bg-card/65 hover:bg-card hover:border-border transition-colors cursor-pointer text-left',
                          !notif.read && 'border-primary/20 bg-primary/5'
                        )}
                      >
                        <div className="flex-shrink-0 mt-0.5 rounded-full p-1 bg-muted/40 flex items-center justify-center">
                          {typeIcon[notif.type]}
                        </div>
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h5 className="text-xs font-semibold text-foreground truncate leading-none">
                              {notif.title}
                            </h5>
                            <span className="text-[9px] font-mono text-muted-foreground/80 leading-none whitespace-nowrap">
                              {notif.time}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed leading-tight truncate">
                            {notif.description}
                          </p>
                        </div>
                        {!notif.read && (
                          <span className="absolute top-3.5 right-3 h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="flex items-center justify-between border-t border-border/40 pt-3 mt-2 flex-shrink-0 select-none">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Unread: {unreadCount}
                  </span>
                  <button
                    onClick={handleClearAll}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 hover:text-rose-600"
                  >
                    <Trash className="h-3 w-3" />
                    Clear all
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export interface ActivityTimelineItem {
  id: string;
  title: string;
  description: string;
  time: string;
  user: { name: string; avatarUrl?: string };
  type: 'audit' | 'status' | 'document' | 'user';
}

interface ActivityTimelineProps {
  items: ActivityTimelineItem[];
  className?: string;
}

/**
 * Premium ActivityTimeline providing elegant visual timelines
 */
export function ActivityTimeline({ items, className }: ActivityTimelineProps) {
  const iconMap = {
    audit: <Clock className="h-3.5 w-3.5 text-blue-500" />,
    status: <Sparkles className="h-3.5 w-3.5 text-amber-500" />,
    document: <FileText className="h-3.5 w-3.5 text-indigo-500" />,
    user: <User className="h-3.5 w-3.5 text-emerald-500" />,
  };

  return (
    <div
      className={cn(
        'relative w-full pl-4 space-y-6 select-none text-left border-l border-border/80 ml-3',
        className
      )}
    >
      {items.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground select-none">
          No active logs available.
        </div>
      ) : (
        items.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.08 }}
            className="relative space-y-1.5"
          >
            {/* Timeline Ring Icon */}
            <span className="absolute -left-[27px] top-0.5 rounded-full border border-border bg-background p-1 flex items-center justify-center shadow-sm">
              {iconMap[item.type]}
            </span>

            {/* Content Details */}
            <div className="space-y-1 pl-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 select-none">
                <h4 className="text-xs font-semibold text-foreground leading-none">{item.title}</h4>
                <span className="text-[10px] font-mono text-muted-foreground/80 leading-none">
                  {item.time}
                </span>
              </div>
              <p className="text-xs text-muted-foreground/80 leading-relaxed max-w-xl">
                {item.description}
              </p>
              <div className="flex items-center gap-1.5 pt-0.5 text-[10px] text-muted-foreground select-none">
                <span className="h-3.5 w-3.5 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[8px]">
                  {item.user.name[0]}
                </span>
                <span className="font-semibold text-foreground/80">{item.user.name}</span>
                <span>•</span>
                <span className="uppercase text-[9px] tracking-wide font-mono font-bold text-muted-foreground/70">
                  {item.type}
                </span>
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}
