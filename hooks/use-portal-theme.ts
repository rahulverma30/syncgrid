'use client';

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export type PortalTheme = {
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  bannerUrl: string;
  isWhiteLabeled: boolean;
};

const DEFAULT_THEME: PortalTheme = {
  logoUrl: '',
  primaryColor: '#3b82f6',
  accentColor: '#10b981',
  welcomeTitle: 'Welcome to your Workspace',
  welcomeSubtitle: 'Track your projects, submit feedback, approve milestones, and chat with us.',
  bannerUrl: '',
  isWhiteLabeled: false,
};

export function usePortalTheme() {
  const [theme, setTheme] = useState<PortalTheme>(DEFAULT_THEME);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTheme = async () => {
    try {
      const res = await fetch('/api/portal/theme');
      if (res.ok) {
        const body = await res.json();
        if (body.success && body.data) {
          setTheme(body.data);
          injectThemeStyles(body.data.primaryColor, body.data.accentColor);
        }
      }
    } catch (err) {
      console.error('Error fetching portal theme:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTheme = async (newSettings: Partial<PortalTheme>) => {
    try {
      const res = await fetch('/api/portal/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      const body = await res.json();
      if (res.ok && body.success) {
        setTheme(body.data);
        injectThemeStyles(body.data.primaryColor, body.data.accentColor);
        toast.success('Branding preferences saved successfully!');
        return true;
      } else {
        toast.error(body.message || 'Failed to update branding settings.');
        return false;
      }
    } catch (err: any) {
      toast.error('Network error updating branding settings.');
      return false;
    }
  };

  const injectThemeStyles = (primary: string, accent: string) => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    root.style.setProperty('--portal-primary', primary);
    root.style.setProperty('--portal-accent', accent);
  };

  useEffect(() => {
    fetchTheme();
  }, []);

  return {
    theme,
    updateTheme,
    isLoading,
    refreshTheme: fetchTheme,
  };
}
