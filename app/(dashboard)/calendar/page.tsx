'use client';

import { PageHeader, Card, CardContent } from '@/components/ui';
import { Calendar, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Collaboration Module"
        title="Interactive Workspace Calendar"
        description="Schedule organization-wide events, sync milestones, track project deadlines, and align meetings."
      />
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-dashed border-border/80 bg-card/50 backdrop-blur-md">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]">
              <Calendar className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight">Calendar Hub In Development</h3>
              <p className="text-muted-foreground max-w-sm text-sm">
                A dynamic calendar workspace supporting Google/Outlook integrations, dynamic
                drag-and-drop bookings, team scheduling, and automated reminders is currently being
                developed.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary font-medium">
              <Sparkles className="h-3 w-3 text-primary animate-pulse" />
              Calendar Portal Coming Soon
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
