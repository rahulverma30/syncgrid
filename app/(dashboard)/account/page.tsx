'use client';

import React, { useState, useEffect } from 'react';
import {
  PageHeader,
  Card,
  CardContent,
  Button,
  Input,
  LoadingSpinner,
  Select,
} from '@/components/ui';
import {
  User,
  Shield,
  Sliders,
  Smartphone,
  Bell,
  CheckCircle,
  Key,
  LogOut,
  Moon,
  Sun,
  Eye,
  Camera,
  Laptop,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface UserSession {
  _id: string;
  device: string;
  location: string;
  ipAddress: string;
  current: boolean;
  lastActive: string;
}

export default function AccountSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'profile' | 'security' | 'preferences' | 'sessions' | 'notifications'
  >('profile');
  const [isSaving, setIsSaving] = useState(false);

  // Profile Form
  const [fullName, setFullName] = useState('Bruce Wayne');
  const [email, setEmail] = useState('bruce@waynecorp.com');
  const [phone, setPhone] = useState('312-555-0100');
  const [role, setRole] = useState('Super Admin');

  // Security Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  // Preferences Form
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('en');

  // Sessions list
  const [sessions, setSessions] = useState<UserSession[]>([
    {
      _id: 's1',
      device: 'MacBook Pro 16" (macOS)',
      location: 'Gotham City, USA',
      ipAddress: '192.168.1.42',
      current: true,
      lastActive: 'Active Now',
    },
    {
      _id: 's2',
      device: 'iPhone 15 Pro (iOS)',
      location: 'Gotham City, USA',
      ipAddress: '172.56.21.99',
      current: false,
      lastActive: '2 hours ago',
    },
  ]);

  // Notifications Form
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);
  const [notifyWebsocket, setNotifyWebsocket] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success('User profile particulars successfully updated.');
    } catch (err) {
      toast.error('Failed to save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success('Account password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error('Failed to update password.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle2FA = () => {
    setIs2FAEnabled(!is2FAEnabled);
    toast.success(
      is2FAEnabled
        ? 'Two-factor Authentication disabled.'
        : 'Two-factor Authentication successfully enabled!'
    );
  };

  const handleSavePreferences = () => {
    toast.success('Visual preferences saved. Reloading parameters...');
  };

  const handleRevokeSession = (id: string) => {
    setSessions(sessions.filter((s) => s._id !== id));
    toast.error('Active device session terminated remotely.');
  };

  const handleSaveNotifications = () => {
    toast.success('Notification settings saved successfully.');
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        eyebrow="Identity & Settings Suite"
        title="User Settings Console"
        description="Manage your user profile details, configure passwords and 2FA credentials, establish visual preferences, review active session tokens, and toggle communication alerts."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 select-none">
          <Card className="bg-card/40 border border-border/60 p-2.5 rounded-2xl backdrop-blur-md">
            <nav className="flex flex-col gap-1 text-left text-xs font-semibold">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all ${
                  activeTab === 'profile'
                    ? 'bg-primary text-white font-bold'
                    : 'text-slate-400 hover:bg-accent/40 hover:text-white'
                }`}
              >
                <User className="h-4 w-4" />
                Profile Settings
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all ${
                  activeTab === 'security'
                    ? 'bg-primary text-white font-bold'
                    : 'text-slate-400 hover:bg-accent/40 hover:text-white'
                }`}
              >
                <Shield className="h-4 w-4" />
                Sign-In & Security
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all ${
                  activeTab === 'preferences'
                    ? 'bg-primary text-white font-bold'
                    : 'text-slate-400 hover:bg-accent/40 hover:text-white'
                }`}
              >
                <Sliders className="h-4 w-4" />
                System Preferences
              </button>
              <button
                onClick={() => setActiveTab('sessions')}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all ${
                  activeTab === 'sessions'
                    ? 'bg-primary text-white font-bold'
                    : 'text-slate-400 hover:bg-accent/40 hover:text-white'
                }`}
              >
                <Smartphone className="h-4 w-4" />
                Active Sessions
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all ${
                  activeTab === 'notifications'
                    ? 'bg-primary text-white font-bold'
                    : 'text-slate-400 hover:bg-accent/40 hover:text-white'
                }`}
              >
                <Bell className="h-4 w-4" />
                Notification Alerts
              </button>
            </nav>
          </Card>
        </div>

        {/* Tab Contents */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <Card className="bg-card/40 border border-border/60 p-6 rounded-2xl backdrop-blur-md text-left space-y-6">
                  <div className="flex items-center gap-4 border-b border-border/40 pb-4 select-none">
                    <div className="relative group cursor-pointer">
                      <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 text-2xl font-black font-mono shadow-inner">
                        B
                      </div>
                      <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Camera className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">Bruce Wayne</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">{role} Account</p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Full Name
                        </label>
                        <Input
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="bg-background/30 h-10 text-xs"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Corporate Email Address
                        </label>
                        <Input
                          required
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-background/30 h-10 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Phone Contact
                        </label>
                        <Input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="bg-background/30 h-10 text-xs"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
                          System Role
                        </label>
                        <Input
                          disabled
                          value={role}
                          className="bg-background/20 text-slate-500 border-border/40 h-10 text-xs cursor-not-allowed select-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border/40 select-none">
                      <Button
                        disabled={isSaving}
                        type="submit"
                        variant="default"
                        size="sm"
                        className="h-9 text-xs"
                      >
                        {isSaving ? <LoadingSpinner className="h-4 w-4 animate-spin mr-2" /> : null}
                        Save Profile
                      </Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <Card className="bg-card/40 border border-border/60 p-6 rounded-2xl backdrop-blur-md text-left space-y-6">
                  <div className="border-b border-border/40 pb-4 select-none">
                    <h3 className="font-bold text-white text-sm">Update Password</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Ensure password rules are current.
                    </p>
                  </div>

                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Current Password
                      </label>
                      <Input
                        required
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="bg-background/30 h-10 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          New Password
                        </label>
                        <Input
                          required
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="bg-background/30 h-10 text-xs"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Confirm New Password
                        </label>
                        <Input
                          required
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="bg-background/30 h-10 text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border/40 select-none">
                      <Button
                        disabled={isSaving}
                        type="submit"
                        variant="default"
                        size="sm"
                        className="h-9 text-xs"
                      >
                        {isSaving ? <LoadingSpinner className="h-4 w-4 animate-spin mr-2" /> : null}
                        Update Password
                      </Button>
                    </div>
                  </form>

                  {/* 2FA Stepper */}
                  <div className="border-t border-border/40 pt-6 space-y-4 select-none">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <h4 className="font-bold text-white text-xs">
                          Two-Factor Authentication (2FA)
                        </h4>
                        <p className="text-[10px] text-slate-400 leading-relaxed max-w-md">
                          Enforce secure sign-in tokens from Google Authenticator or secondary
                          channels.
                        </p>
                      </div>
                      <Button
                        onClick={handleToggle2FA}
                        variant={is2FAEnabled ? 'destructive' : 'outline'}
                        size="sm"
                        className="h-8 text-xs font-bold shrink-0"
                      >
                        {is2FAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'preferences' && (
              <motion.div
                key="preferences"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <Card className="bg-card/40 border border-border/60 p-6 rounded-2xl backdrop-blur-md text-left space-y-6">
                  <div className="border-b border-border/40 pb-4 select-none">
                    <h3 className="font-bold text-white text-sm">Visual Preferences</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Configure theme palettes and workspace localization.
                    </p>
                  </div>

                  <div className="space-y-4 select-none">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        System Layout Theme
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setTheme('dark')}
                          className={`flex items-center justify-center gap-2 p-4 border rounded-xl font-bold text-xs transition-all ${
                            theme === 'dark'
                              ? 'border-primary bg-primary/5 text-white'
                              : 'border-border/60 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Moon className="h-4 w-4" /> Dark Glassmorphism
                        </button>
                        <button
                          onClick={() => setTheme('light')}
                          className={`flex items-center justify-center gap-2 p-4 border rounded-xl font-bold text-xs transition-all ${
                            theme === 'light'
                              ? 'border-primary bg-primary/5 text-white'
                              : 'border-border/60 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Sun className="h-4 w-4" /> Light Interface
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Localization Language
                      </label>
                      <Select
                        value={language}
                        onChange={(val) => setLanguage(val)}
                        className="w-full px-3 bg-background/30 border border-border/60 hover:border-primary/20 rounded-xl h-10 text-xs text-slate-300 focus:ring-0 outline-none cursor-pointer"
                        options={[
                          { value: 'en', label: 'English (US)' },
                          { value: 'es', label: 'Español (ES)' },
                          { value: 'fr', label: 'Français (FR)' },
                        ]}
                      />
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border/40">
                      <Button
                        onClick={handleSavePreferences}
                        variant="default"
                        size="sm"
                        className="h-9 text-xs"
                      >
                        Save Preferences
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'sessions' && (
              <motion.div
                key="sessions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <Card className="bg-card/40 border border-border/60 rounded-3xl overflow-hidden backdrop-blur-md text-left">
                  <div className="p-5 border-b border-border/40 select-none">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Active Device Session Tokens
                    </h3>
                  </div>

                  <div className="divide-y divide-border/40 text-xs">
                    {sessions.map((s) => (
                      <div key={s._id} className="p-5 flex items-center justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 select-none">
                            <Laptop className="h-4 w-4 text-primary shrink-0" />
                            <h4 className="font-bold text-white truncate text-sm">{s.device}</h4>
                            {s.current && (
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2.5 text-[10px] text-slate-400 font-semibold select-none flex-wrap">
                            <span>
                              IP: <span className="text-slate-300">{s.ipAddress}</span>
                            </span>
                            <span>•</span>
                            <span>{s.location}</span>
                            <span>•</span>
                            <span className="text-slate-500">{s.lastActive}</span>
                          </div>
                        </div>

                        {!s.current && (
                          <Button
                            onClick={() => handleRevokeSession(s._id)}
                            variant="outline"
                            size="sm"
                            className="h-8 hover:bg-red-500/10 hover:text-red-500 border-border/60 shrink-0 select-none text-[10px]"
                          >
                            <LogOut className="h-3.5 w-3.5 mr-1" />
                            Revoke
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <Card className="bg-card/40 border border-border/60 p-6 rounded-2xl backdrop-blur-md text-left space-y-6">
                  <div className="border-b border-border/40 pb-4 select-none">
                    <h3 className="font-bold text-white text-sm">Notification Channels</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Toggle instant websocket updates or email reports.
                    </p>
                  </div>

                  <div className="space-y-4 select-none">
                    <div className="flex items-center justify-between p-4 bg-background/20 border border-border/40 rounded-xl">
                      <div className="space-y-0.5">
                        <label className="text-xs font-bold text-white block">
                          Email Statement Logs
                        </label>
                        <span className="text-[10px] text-slate-400 block leading-none">
                          Receive weekly PDF invoices report outlays.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifyEmail}
                        onChange={(e) => setNotifyEmail(e.target.checked)}
                        className="rounded border-border/60 text-primary h-4.5 w-4.5 focus:ring-0 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-background/20 border border-border/40 rounded-xl">
                      <div className="space-y-0.5">
                        <label className="text-xs font-bold text-white block">
                          Browser Push Notifications
                        </label>
                        <span className="text-[10px] text-slate-400 block leading-none">
                          Receive real-time toast updates inside active windows.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifyPush}
                        onChange={(e) => setNotifyPush(e.target.checked)}
                        className="rounded border-border/60 text-primary h-4.5 w-4.5 focus:ring-0 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-background/20 border border-border/40 rounded-xl">
                      <div className="space-y-0.5">
                        <label className="text-xs font-bold text-white block">
                          Instant WebSocket Audio Alerts
                        </label>
                        <span className="text-[10px] text-slate-400 block leading-none">
                          Play micro-audio feedback sound on websocket telemetry hooks.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifyWebsocket}
                        onChange={(e) => setNotifyWebsocket(e.target.checked)}
                        className="rounded border-border/60 text-primary h-4.5 w-4.5 focus:ring-0 cursor-pointer"
                      />
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border/40">
                      <Button
                        onClick={handleSaveNotifications}
                        variant="default"
                        size="sm"
                        className="h-9 text-xs"
                      >
                        Save Notifications
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
