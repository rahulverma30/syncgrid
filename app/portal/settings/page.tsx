'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sliders,
  Sparkles,
  Palette,
  Heading,
  Check,
  ShieldCheck,
  Loader2,
  Lock,
  QrCode,
  KeyRound,
  Copy,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePortalTheme } from '@/hooks/use-portal-theme';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function PortalSettingsPage() {
  const { theme, updateTheme, isLoading: isThemeLoading } = usePortalTheme();

  // Branding states
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [accentColor, setAccentColor] = useState('#10b981');
  const [welcomeTitle, setWelcomeTitle] = useState('');
  const [welcomeSubtitle, setWelcomeSubtitle] = useState('');
  const [isWhiteLabeled, setIsWhiteLabeled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // User session details
  const [userRole, setUserRole] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  // MFA setup states
  const [mfaStep, setMfaStep] = useState<'idle' | 'configuring' | 'enrolled'>('idle');
  const [mfaSecret, setMfaSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isConfiguringMfa, setIsConfiguringMfa] = useState(false);

  const fetchSessionDetails = async () => {
    try {
      const res = await fetch('/api/portal/auth/verify');
      const body = await res.json();
      if (body.success) {
        setUserRole(body.data.portalRole);
        setMfaEnabled(body.data.mfaEnabled);
      }
    } catch (err) {
      console.error('Session verify failed:', err);
    } finally {
      setIsSessionLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionDetails();
  }, []);

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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 'Client Owner') {
      toast.error('Only Client Owners can configure branding styles.');
      return;
    }
    setIsSubmitting(true);
    await updateTheme({
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

  const handleInitializeMfa = async () => {
    setIsConfiguringMfa(true);
    try {
      const res = await fetch('/api/portal/auth/mfa-setup');
      const body = await res.json();
      if (body.success) {
        setMfaSecret(body.data.secret);
        setMfaStep('configuring');
        toast.success('MFA secret seed generated successfully!');
      } else {
        toast.error(body.message || 'Failed to initialize MFA secrets.');
      }
    } catch (err) {
      toast.error('Network failure.');
    } finally {
      setIsConfiguringMfa(false);
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      toast.error('Passcode must be exactly 6 digits.');
      return;
    }
    setIsConfiguringMfa(true);
    try {
      const res = await fetch('/api/portal/auth/mfa-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode }),
      });
      const body = await res.json();
      if (res.ok && body.success) {
        setBackupCodes(body.data.backupCodes);
        setMfaEnabled(true);
        setMfaStep('enrolled');
        toast.success('MFA enrollment verified and active!');
        // Refresh session
        fetchSessionDetails();
      } else {
        toast.error(body.message || 'Incorrect verification token passcode.');
      }
    } catch (err) {
      toast.error('Network failure during verification.');
    } finally {
      setIsConfiguringMfa(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(mfaSecret);
    toast.success('MFA Base32 secret key copied to clipboard.');
  };

  const handleCopyCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast.success('Backup recovery codes copied. Save them securely!');
  };

  const isBrandingRestricted = userRole !== 'Client Owner';

  if (isThemeLoading || isSessionLoading) {
    return <Skeleton className="h-[480px] w-full rounded-2xl bg-slate-900" />;
  }

  return (
    <div className="space-y-8 max-w-4xl text-left">
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-blue-500" />
          <span>Portal Security & Branding Manager</span>
        </h1>
        <p className="text-xs text-slate-500">
          Configure security settings, multi-factor logins, color themes, and white-label branding
          assets.
        </p>
      </div>

      {/* CARD 1: Zero-Dependency Multi-Factor Authentication Shield */}
      <Card className="bg-slate-900/40 border-slate-850 rounded-3xl p-6 lg:p-8 space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-md font-bold text-white flex items-center space-x-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Multi-Factor Authentication (MFA) Security Shield</span>
            </h2>
            <p className="text-xs text-slate-500">
              Protect your enterprise client portal workspace using standard HMAC-SHA1 TOTP tokens
            </p>
          </div>

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              mfaEnabled
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/15 animate-pulse'
            }`}
          >
            {mfaEnabled ? 'Shield Active' : 'Shield Inactive'}
          </span>
        </div>

        {mfaEnabled && mfaStep !== 'enrolled' ? (
          // MFA is already active
          <div className="bg-slate-950/40 border border-emerald-500/15 p-5 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="text-xs text-slate-400">
              <span className="font-bold text-white block">Dynamic Two-Step Gateway Certified</span>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Your portal account is hardened using cryptographic two-factor shields. dynamic
                login challenges are verified automatically.
              </p>
            </div>
          </div>
        ) : mfaStep === 'idle' ? (
          // MFA is inactive - offer enrollment setup
          <div className="space-y-4">
            <p className="text-xs text-slate-450 leading-relaxed">
              Enabling Multi-Factor Authentication prevents unauthorized access to your billing and
              support records. You will require an authenticator app (such as Google Authenticator,
              Microsoft Authenticator, or Bitwarden) to verify your identity during logins.
            </p>
            <Button
              onClick={handleInitializeMfa}
              disabled={isConfiguringMfa}
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs py-5 px-6 border-0 shadow-lg shadow-blue-600/10"
            >
              {isConfiguringMfa ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Secret...
                </>
              ) : (
                <>
                  Enable Two-Factor Authentication
                  <KeyRound className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        ) : mfaStep === 'configuring' ? (
          // MFA Setup - input secret base32 key
          <div className="bg-slate-950/50 border border-slate-850 p-6 rounded-2xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left description */}
              <div className="md:col-span-2 space-y-4">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  1. Configure Authenticator App
                </span>
                <ol className="list-decimal pl-5 text-xs text-slate-450 space-y-2 leading-relaxed">
                  <li>Open your preferred authenticator app.</li>
                  <li>Click Add Account and select &quot;Enter setup key manually&quot;.</li>
                  <li>
                    Use Account Name: <strong className="text-white">SyncGrid Client Portal</strong>
                  </li>
                  <li>
                    Enter key:{' '}
                    <strong className="text-blue-400 font-mono tracking-wider">{mfaSecret}</strong>
                  </li>
                </ol>
                <div className="flex items-center space-x-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-800 hover:bg-slate-850 text-slate-400 text-[10px] rounded-lg py-4"
                    onClick={handleCopySecret}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Copy Secret Key
                  </Button>
                </div>
              </div>

              {/* QR Code/Manual helper display */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-900 border border-slate-850 rounded-2xl">
                <QrCode className="w-16 h-16 text-slate-500 mb-2" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                  Base32 Format
                </span>
                <span className="text-[9px] text-slate-600 text-center font-mono mt-1">
                  Time-Based (TOTP)
                </span>
              </div>
            </div>

            {/* Verification action Form */}
            <form onSubmit={handleVerifyMfa} className="border-t border-slate-850 pt-6 space-y-4">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                2. Verify dynamic OTP Token
              </span>
              <p className="text-xs text-slate-500">
                Enter the 6-digit dynamic passcode generated by your authenticator app to authorize
                enrollment.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                <Input
                  type="text"
                  placeholder="e.g. 123456"
                  maxLength={6}
                  className="bg-slate-950/40 border-slate-800 text-white font-bold tracking-widest placeholder-slate-700 text-center rounded-xl"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                  disabled={isConfiguringMfa}
                  required
                />
                <Button
                  type="submit"
                  disabled={isConfiguringMfa}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-5 px-6 border-0 shadow-lg shadow-emerald-600/10"
                >
                  {isConfiguringMfa ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Activating...
                    </>
                  ) : (
                    <>
                      Verify & Activate Shield
                      <ShieldCheck className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          // MFA just enrolled - display backup recovery codes
          <div className="bg-slate-950/50 border border-emerald-500/15 p-6 rounded-2xl space-y-4">
            <div className="flex items-center space-x-2 text-emerald-400">
              <ShieldCheck className="w-5 h-5 animate-bounce" />
              <span className="text-xs font-bold uppercase tracking-wider">
                MFA Shield Enabled Successfully!
              </span>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl flex items-start space-x-3 text-xs leading-relaxed">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Keep Backup Recovery Codes Safe</span>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  If you lose access to your mobile authenticator app, these unique recovery codes
                  are the ONLY way to log in. Each code can be used exactly once.
                </p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl font-mono text-xs text-slate-200 tracking-wider grid grid-cols-2 gap-2 text-center">
              {backupCodes.map((code) => (
                <div key={code} className="bg-slate-950/60 p-2 rounded-lg border border-slate-850">
                  {code}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <Button
                variant="outline"
                className="border-slate-800 hover:bg-slate-850 text-slate-400 text-xs rounded-xl py-5"
                onClick={handleCopyCodes}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Recovery Codes
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs py-5 px-6 border-0"
                onClick={() => setMfaStep('idle')}
              >
                Done Setup
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* CARD 2: Branding & white-label Manager */}
      <Card className="bg-slate-900/40 border-slate-850 rounded-3xl p-6 lg:p-8">
        <div className="pb-6">
          <h2 className="text-md font-bold text-white flex items-center space-x-2.5">
            <Sliders className="w-5 h-5 text-blue-500" />
            <span>Workspace White-Label Branding settings</span>
          </h2>
          <p className="text-xs text-slate-500">
            Configure layout templates, primary palette tones, custom titles, and logo white-label
            assets
          </p>
        </div>

        {isBrandingRestricted && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center space-x-3 text-xs">
            <Lock className="w-4 h-4 animate-pulse" />
            <span>
              You are currently logged in as a <strong>{userRole}</strong>. Only the primary{' '}
              <strong>Client Owner</strong> is authorized to edit portal branding assets.
            </span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-8">
          {/* Section 1: Dynamic Palette */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-450 uppercase tracking-wider flex items-center space-x-2">
              <Palette className="w-4 h-4 text-blue-500" />
              <span>Theme Color Engine</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-350 block">
                  Primary Color Hex
                </label>
                <div className="flex space-x-2">
                  <Input
                    type="color"
                    className="w-12 h-10 p-0 border-0 bg-transparent cursor-pointer rounded-lg"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    disabled={isBrandingRestricted || isSubmitting}
                  />
                  <Input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="bg-slate-950/40 border-slate-850 text-slate-200 text-xs rounded-xl"
                    disabled={isBrandingRestricted || isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-355 block">
                  Accent Color Hex
                </label>
                <div className="flex space-x-2">
                  <Input
                    type="color"
                    className="w-12 h-10 p-0 border-0 bg-transparent cursor-pointer rounded-lg"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    disabled={isBrandingRestricted || isSubmitting}
                  />
                  <Input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="bg-slate-950/40 border-slate-850 text-slate-200 text-xs rounded-xl"
                    disabled={isBrandingRestricted || isSubmitting}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Header Typography */}
          <div className="space-y-4 pt-4 border-t border-slate-850">
            <h3 className="text-xs font-semibold text-slate-450 uppercase tracking-wider flex items-center space-x-2">
              <Heading className="w-4 h-4 text-blue-500" />
              <span>Dashboard Welcome Screens</span>
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-350 block">Welcome Title</label>
                <Input
                  value={welcomeTitle}
                  onChange={(e) => setWelcomeTitle(e.target.value)}
                  className="bg-slate-950/40 border-slate-850 text-slate-200 text-xs rounded-xl"
                  placeholder="e.g. Welcome to your agency dashboard"
                  disabled={isBrandingRestricted || isSubmitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-350 block">
                  Welcome Subtitle Details
                </label>
                <Input
                  value={welcomeSubtitle}
                  onChange={(e) => setWelcomeSubtitle(e.target.value)}
                  className="bg-slate-950/40 border-slate-850 text-slate-200 text-xs rounded-xl"
                  placeholder="e.g. Track active sprints and discuss with company representatives..."
                  disabled={isBrandingRestricted || isSubmitting}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: White Label configs */}
          <div className="space-y-4 pt-4 border-t border-slate-850">
            <h3 className="text-xs font-semibold text-slate-450 uppercase tracking-wider flex items-center space-x-2">
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
                  disabled={isBrandingRestricted || isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          {!isBrandingRestricted && (
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
