'use client';

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  LayoutDashboard,
  Briefcase,
  CheckSquare,
  FolderDown,
  MessageSquare,
  HelpCircle,
  Sliders,
  BarChart2,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingOverlay } from '@/components/ui';
import { toast } from 'sonner';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sessionUser, setSessionUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoginPage = pathname === '/portal/login';

  const checkSession = async () => {
    try {
      const res = await fetch('/api/portal/auth/verify');
      const body = await res.json();

      if (res.ok && body.success) {
        setSessionUser(body.data);
      } else {
        if (!isLoginPage) {
          router.push('/portal/login');
        }
      }
    } catch (err) {
      if (!isLoginPage) {
        router.push('/portal/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/portal/auth/logout', { method: 'POST' });
      toast.success('Logged out successfully.');
      router.push('/portal/login');
    } catch (error) {
      toast.error('Failed to log out.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-800 border-t-blue-500" />
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider animate-pulse">
          Verifying Portal Session...
        </p>
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  const sidebarLinks = [
    { label: 'Overview', href: '/portal/dashboard', icon: LayoutDashboard },
    { label: 'Projects', href: '/portal/projects', icon: Briefcase },
    { label: 'Approvals & Reviews', href: '/portal/approvals', icon: CheckSquare },
    { label: 'Document Vault', href: '/portal/documents', icon: FolderDown },
    { label: 'Discussions', href: '/portal/communication', icon: MessageSquare },
    { label: 'Helpdesk Tickets', href: '/portal/support', icon: HelpCircle },
    { label: 'Branding & Theme', href: '/portal/settings', icon: Sliders },
    { label: 'Analytics Insights', href: '/portal/analytics', icon: BarChart2 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Dynamic theme style overrides */}
      <style jsx global>{`
        :root {
          --portal-primary: #3b82f6;
          --portal-accent: #10b981;
        }
        .portal-primary-bg {
          background-color: var(--portal-primary);
        }
        .portal-accent-bg {
          background-color: var(--portal-accent);
        }
        .portal-primary-text {
          color: var(--portal-primary);
        }
        .portal-accent-text {
          color: var(--portal-accent);
        }
        .portal-primary-border {
          border-color: var(--portal-primary);
        }
        .portal-accent-border {
          border-color: var(--portal-accent);
        }
      `}</style>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900 border-r border-slate-800 p-6 flex-shrink-0">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-md font-bold tracking-tight text-white">Client Portal</h2>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
              SyncGrid Enterprise
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;

            return (
              <Link key={link.href} href={link.href}>
                <div
                  className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-250 cursor-pointer mb-1 group ${
                    isActive
                      ? 'bg-slate-850 text-white shadow-sm border-l-4 border-blue-500'
                      : 'text-slate-400 hover:bg-slate-850/50 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${isActive ? 'text-blue-500' : 'text-slate-500 group-hover:text-slate-400'}`}
                    />
                    <span>{link.label}</span>
                  </div>
                  <ChevronRight
                    className={`w-3 h-3 transition-transform ${isActive ? 'text-blue-500 rotate-90' : 'text-slate-650 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'}`}
                  />
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        {sessionUser && (
          <div className="border-t border-slate-850 pt-6 mt-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-750">
                <span className="font-bold text-blue-500 text-sm">
                  {sessionUser.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{sessionUser.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{sessionUser.clientName}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-xl"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-3 text-slate-500 group-hover:text-rose-400" />
              Sign Out
            </Button>
          </div>
        )}
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 lg:bg-transparent lg:border-0 z-20">
          <div className="flex items-center space-x-3 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-emerald-500 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-white">Client Portal</span>
          </div>

          <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-500 font-medium">
            <span>SyncGrid Space</span>
            <span>/</span>
            <span className="text-slate-300 capitalize">
              {pathname.split('/').pop() || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Quick alert bell */}
            <button className="relative w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500" />
            </button>

            {/* Mobile menu trigger */}
            <button
              className="lg:hidden w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dynamic page content */}
        <main className="flex-grow p-6 lg:p-10 max-w-7xl w-full mx-auto pb-24">{children}</main>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/60"
            />
            {/* Sidebar drawer content */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-80 bg-slate-900 border-r border-slate-800 p-6 flex flex-col h-full"
            >
              <button
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-850 flex items-center justify-center text-slate-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-emerald-500 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-md font-bold tracking-tight text-white">Client Portal</h2>
                  <span className="text-[10px] text-slate-500 font-medium">SyncGrid Space</span>
                </div>
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto">
                {sidebarLinks.map((link) => {
                  const isActive = pathname === link.href;
                  const Icon = link.icon;

                  return (
                    <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}>
                      <div
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                            : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{link.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>

              {sessionUser && (
                <div className="border-t border-slate-800 pt-6 mt-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                      <span className="font-bold text-blue-500">
                        {sessionUser.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">
                        {sessionUser.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{sessionUser.clientName}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-slate-400 hover:text-rose-400 hover:bg-rose-500/5"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </Button>
                </div>
              )}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
