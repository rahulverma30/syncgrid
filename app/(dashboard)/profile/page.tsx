'use client';

import { PageHeader, Card, CardContent } from '@/components/ui';
import { User, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Identity"
        title="Personal Profile & Account"
        description="Review personal statistics, manage security options, and update your personal user details."
      />
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-dashed border-border/80 bg-card/50 backdrop-blur-md">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]">
              <User className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight">Profile Manager In Development</h3>
              <p className="text-muted-foreground max-w-sm text-sm">
                Advanced features including secure multifactor authentication setups, profile avatar
                uploads, and personal audit logging logs will be available here soon.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary font-medium">
              <Sparkles className="h-3 w-3 text-primary animate-pulse" />
              Profile Settings Coming Soon
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
