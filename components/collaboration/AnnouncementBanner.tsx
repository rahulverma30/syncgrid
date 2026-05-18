'use client';

import React from 'react';
import { Megaphone, X } from 'lucide-react';
import { useCommunicationStore } from '@/store';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';

export function AnnouncementBanner() {
  const { data: session } = useSession();
  const { announcements, acknowledgeAnnouncement } = useCommunicationStore();

  const currentUserId = session?.user?.id;
  const unreadAnnouncements = announcements.filter(
    (a) => currentUserId && !a.acknowledgedBy.includes(currentUserId)
  );

  const activeAnnouncement = unreadAnnouncements[0];

  const handleAcknowledge = async () => {
    if (!activeAnnouncement || !currentUserId) return;

    try {
      acknowledgeAnnouncement(activeAnnouncement._id, currentUserId);
      await fetch('/api/protected/collaboration/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementId: activeAnnouncement._id }),
      });
    } catch (err) {
      console.error('Failed to acknowledge announcement:', err);
    }
  };

  return (
    <AnimatePresence>
      {activeAnnouncement && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="relative bg-gradient-to-r from-amber-500/10 via-orange-600/10 to-amber-500/10 border-b border-amber-500/30 px-6 py-3 transition-all duration-300"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-500">
                <Megaphone className="h-4 w-4 animate-bounce" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-500 mr-2">
                  Announcement:
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {activeAnnouncement.title}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {activeAnnouncement.content}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={handleAcknowledge}
                className="rounded bg-amber-500 px-3 py-1 text-xs font-bold text-black hover:bg-amber-400 transition-all shadow-sm hover:scale-105"
              >
                Acknowledge
              </button>
              <button
                onClick={handleAcknowledge}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
