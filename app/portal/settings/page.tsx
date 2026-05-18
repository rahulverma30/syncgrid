'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sliders,
  Sparkles,
  Palette,
  Heading,
  Check,
  ShieldCheck,
  Loader2,
  Lock,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePortalTheme } from '@/hooks/use-portal-theme';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function PortalSettingsPage() {
  const { theme, updateTheme, isLoading } = usePortalTheme();

  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [accentColor, setAccentColor] = useState('#10b981');
  const [welcomeTitle, setWelcomeTitle] = useState('');
  const [welcomeSubtitle, setWelcomeSubtitle] = useState('');
  const [isWhiteLabeled, setIsWhiteLabeled] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    if (theme) {
      setLogoUrl(theme.logoUrl || '');
      setBannerUrl(theme.bannerUrl || '');
      setPrimaryColor(theme.primaryColor || '#3b82f6');
      setAccentColor(theme.accentColor || '#10b981');
      setWelcomeTitle(theme.welcomeTitle || 'Welcome to your Workspace');
      setWelcomeSubtitle(
        theme.welcomeSubtitle ||
          'Track your projects, submit feedback, approve milestones, and chat.'
      );
      setIsWhiteLabeled(theme.isWhiteLabeled || false);
    }
  }, [theme]);

  // Load session role
  useEffect(() => {
    const checkRole = async () => {
      try {
        const res = await fetch('/api/portal/auth/verify');
        const body = await res.json();
        if (body.success) {
          setUserRole(body.data.portalRole);
        }
      } catch (err) {}
    };
    checkRole();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 'Client Owner') {
      toast.error('Only Client Owners can configure branding styles.');
      return;
    }
    setIsSubmitting(true);
    const success = await updateTheme({
      logoUrl,
      bannerUrl,
      primaryColor,
      accentColor,
      welcomeTitle,
      welcomeSubtitle,
      isWhiteLabeled,
    });
    setIsSubmitting(false);
  };

  const isRestricted = userRole !== 'Client Owner';

  if (isLoading) {
    return <Skeleton className="h-[480px] w-full rounded-2xl bg-slate-900" />;
  }

  return (
    <div className="space-y-6 max-w-4xl text-left">
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-blue-500" />
          <span>Branding & white-label Manager</span>
        </h1>
        <p className="text-xs text-slate-500">
          Configure layout themes, primary colors, and onboarding assets
        </p>
      </div>

      <Card className="bg-slate-900/40 border-slate-850 rounded-3xl p-6 lg:p-8">
        {isRestricted && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center space-x-3 text-xs">
            <Lock className="w-4 h-4" />
            <span>
              You are currently logged in as a <strong>{userRole}</strong>. Only the primary{' '}
              <strong>Client Owner</strong> is authorized to edit portal branding assets.
            </span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-8">
          {/* Section 1: Dynamic Palette */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
              <Palette className="w-4 h-4 text-blue-500" />
              <span>Theme Color Engine</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Primary Color Hex</label>
                <div className="flex space-x-2">
                  <Input
                    type="color"
                    className="w-12 h-10 p-0 border-0 bg-transparent cursor-pointer rounded-lg"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    disabled={isRestricted || isSubmitting}
                  />
                  <Input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="bg-slate-950/40 border-slate-850 text-slate-200 text-xs rounded-xl"
                    disabled={isRestricted || isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Accent Color Hex</label>
                <div className="flex space-x-2">
                  <Input
                    type="color"
                    className="w-12 h-10 p-0 border-0 bg-transparent cursor-pointer rounded-lg"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    disabled={isRestricted || isSubmitting}
                  />
                  <Input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="bg-slate-950/40 border-slate-850 text-slate-200 text-xs rounded-xl"
                    disabled={isRestricted || isSubmitting}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Header Typography */}
          <div className="space-y-4 pt-4 border-t border-slate-850">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
              <Heading className="w-4 h-4 text-blue-500" />
              <span>Dashboard Welcome Screens</span>
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Welcome Title</label>
                <Input
                  value={welcomeTitle}
                  onChange={(e) => setWelcomeTitle(e.target.value)}
                  className="bg-slate-950/40 border-slate-850 text-slate-200 text-xs rounded-xl"
                  placeholder="e.g. Welcome to your agency dashboard"
                  disabled={isRestricted || isSubmitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Welcome Subtitle Details
                </label>
                <Input
                  value={welcomeSubtitle}
                  onChange={(e) => setWelcomeSubtitle(e.target.value)}
                  className="bg-slate-950/40 border-slate-850 text-slate-200 text-xs rounded-xl"
                  placeholder="e.g. Track active sprints and discuss with company representatives..."
                  disabled={isRestricted || isSubmitting}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: White Label configs */}
          <div className="space-y-4 pt-4 border-t border-slate-850">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <span>White-Label configurations</span>
            </h3>

            <div className="space-y-4 bg-slate-950/40 border border-slate-850 p-5 rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="space-y-1 text-left">
                  <span className="text-xs font-bold text-white">
                    Activate Complete White-Labeling
                  </span>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Hides all corporate SyncGrid brand indicators and logos. Fully branded
                    experience.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isWhiteLabeled}
                  onChange={(e) => setIsWhiteLabeled(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-800 bg-slate-900 text-blue-500 focus:ring-blue-500/20 cursor-pointer"
                  disabled={isRestricted || isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          {!isRestricted && (
            <div className="flex justify-end pt-4 border-t border-slate-850">
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-5 px-6 border-0 shadow-lg shadow-blue-600/10"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving style adjustments...
                  </>
                ) : (
                  <>
                    Save Preferences
                    <Check className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
