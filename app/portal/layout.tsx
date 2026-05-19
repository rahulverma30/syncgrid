'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Clock,
  Search,
  Loader2,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PortalSessionProvider, usePortalSession } from '@/providers/portal-session-provider';
import { PortalRealtimeProvider, usePortalRealtime } from '@/providers/portal-realtime-provider';

/**
 * Root Client Portal Layout (Wrapper)
 * Configures global session and real-time SSE contexts.
 */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalSessionProvider>
      <PortalRealtimeProvider>
        <PortalLayoutContent>{children}</PortalLayoutContent>
      </PortalRealtimeProvider>
    </PortalSessionProvider>
  );
}

/**
 * Content Frame (Inside Contexts)
 */
function PortalLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const safePathname = pathname || '';
  const { sessionUser, isLoading: isSessionLoading, logout } = usePortalSession();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileDrawerRef = useRef<HTMLDivElement>(null);
  const searchModalRef = useRef<HTMLDivElement>(null);

  const isLoginPage = safePathname === '/portal/login';

  // 1. Listen for CMD+K/CTRL+K to trigger unified search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 2. Debounced query fetching for global unified search
  useEffect(() => {
    if (!searchQuery.trim()) {
      const timer = setTimeout(() => {
        setSearchResults([]);
      }, 0);
      return () => clearTimeout(timer);
    }
    const delay = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/portal/search?q=${encodeURIComponent(searchQuery)}`);
        const body = await res.json();
        if (body.success) {
          setSearchResults(body.data);
          setSelectedResultIndex(0);
        }
      } catch (err) {
        console.error('Unified search fetch error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  // 3. Focus trap logic for Mobile Menu drawer
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const focusable = mobileDrawerRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0] as HTMLElement;
    const last = focusable[focusable.length - 1] as HTMLElement;

    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    first.focus();
    window.addEventListener('keydown', handleFocusTrap);
    return () => window.removeEventListener('keydown', handleFocusTrap);
  }, [mobileMenuOpen]);

  // 4. Focus trap and keyboard controls for search modal
  useEffect(() => {
    if (!searchOpen) {
      const timer = setTimeout(() => {
        setSearchQuery('');
        setSearchResults([]);
      }, 0);
      return () => clearTimeout(timer);
    }
    setTimeout(() => searchInputRef.current?.focus(), 50);

    const handleSearchKeys = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedResultIndex((prev) => (prev + 1) % Math.max(1, searchResults.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedResultIndex(
          (prev) => (prev - 1 + searchResults.length) % Math.max(1, searchResults.length)
        );
      } else if (e.key === 'Enter') {
        if (searchResults.length > 0) {
          e.preventDefault();
          const target = searchResults[selectedResultIndex];
          setSearchOpen(false);
          router.push(target.href);
        }
      }
    };

    window.addEventListener('keydown', handleSearchKeys);
    return () => window.removeEventListener('keydown', handleSearchKeys);
  }, [searchOpen, searchResults, selectedResultIndex, router]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully.');
      router.push('/portal/login');
    } catch (error) {
      toast.error('Failed to log out.');
    }
  };

  // Loading indicator for active checking
  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-800 border-t-blue-500" />
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider animate-pulse">
          Syncing Portal Shield...
        </p>
      </div>
    );
  }

  // If login route, serve single wrapper frame
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Active navigation items
  const sidebarLinks = [
    { label: 'Overview', href: '/portal', icon: LayoutDashboard },
    { label: 'Projects', href: '/portal/projects', icon: Briefcase },
    { label: 'Approvals & Reviews', href: '/portal/approvals', icon: CheckSquare },
    { label: 'Document Vault', href: '/portal/documents', icon: FolderDown },
    { label: 'Discussions', href: '/portal/communication', icon: MessageSquare },
    { label: 'Helpdesk Tickets', href: '/portal/support', icon: HelpCircle },
    { label: 'Activity Feed', href: '/portal/activity', icon: Clock },
    { label: 'Branding & Theme', href: '/portal/settings', icon: Sliders },
    { label: 'Analytics Insights', href: '/portal/analytics', icon: BarChart2 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden">
      <style jsx global>{`
        :root {
          --portal-primary: #3b82f6;
          --portal-accent: #10b981;
        }
        /* Custom accessibility focus visible rings */
        *:focus-visible {
          outline: 2px solid var(--portal-primary);
          outline-offset: 2px;
        }
      `}</style>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900 border-r border-slate-850 p-6 flex-shrink-0 relative">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-md font-bold tracking-tight text-white">Client Space</h2>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
              SyncGrid Enterprise
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-1" aria-label="Main Navigation">
          {sidebarLinks.map((link) => {
            const isActive = safePathname === link.href;
            const Icon = link.icon;

            return (
              <Link key={link.href} href={link.href}>
                <div
                  tabIndex={0}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer mb-1 group outline-none ${
                    isActive
                      ? 'bg-slate-850 text-white shadow-sm border-l-4 border-blue-500'
                      : 'text-slate-400 hover:bg-slate-850/40 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${isActive ? 'text-blue-500' : 'text-slate-500 group-hover:text-slate-400'}`}
                    />
                    <span>{link.label}</span>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${isActive ? 'text-blue-500 rotate-90' : 'text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'}`}
                  />
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User context info block */}
        {sessionUser && (
          <div className="border-t border-slate-850 pt-6 mt-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center">
                <span className="font-bold text-blue-500 text-sm">
                  {sessionUser.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-sm font-bold text-white truncate">{sessionUser.name}</p>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block truncate">
                  {sessionUser.portalRole || 'Client Stakeholder'}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-xl border border-transparent hover:border-rose-500/10 py-5"
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
        {/* Global Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-850 lg:border-b-0 lg:bg-transparent z-20">
          {/* Mobile logo segment */}
          <div className="flex items-center space-x-3 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-emerald-500 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-white">Client Space</span>
          </div>

          {/* Search trigger component */}
          <div className="hidden lg:flex items-center space-x-4">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center space-x-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-500 w-64 transition-all text-left outline-none cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span className="flex-grow">Search Workspace...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-400 rounded-md">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Dynamic breadcrumb path */}
          <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-500 font-medium ml-4">
            <span>SyncGrid Space</span>
            <span>/</span>
            <span className="text-slate-300 capitalize">
              {safePathname.split('/').pop() || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Mobile Search Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="lg:hidden w-9 h-9 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-400 hover:text-slate-200 outline-none"
              aria-label="Search items"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Alert Bell */}
            <button
              className="relative w-9 h-9 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-400 hover:text-slate-200 outline-none"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
            </button>

            {/* Mobile Menu trigger */}
            <button
              className="lg:hidden w-9 h-9 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-400 outline-none"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation drawer"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dynamic page content */}
        <main className="flex-grow p-6 lg:p-10 max-w-7xl w-full mx-auto pb-24 relative">
          {children}
        </main>
      </div>

      {/* Global Command Palette / Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              onClick={() => setSearchOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              ref={searchModalRef}
              role="dialog"
              aria-modal="true"
              aria-label="Workspace unified search"
              className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[500px]"
            >
              {/* Top Search bar */}
              <div className="flex items-center space-x-3 px-6 py-4 border-b border-slate-850">
                <Search className="w-4.5 h-4.5 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search projects, support, approvals, files..."
                  className="bg-transparent border-0 text-white placeholder-slate-500 w-full text-sm outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {isSearching ? (
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                ) : (
                  <button
                    onClick={() => setSearchOpen(false)}
                    className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 hover:text-white"
                  >
                    ESC
                  </button>
                )}
              </div>

              {/* Search Results list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {searchQuery.trim() === '' ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    Type keywords to query current projects and secure documents.
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    No results found for &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  searchResults.map((res, index) => {
                    const isSelected = selectedResultIndex === index;
                    return (
                      <div
                        key={res.id + res.type}
                        onClick={() => {
                          setSearchOpen(false);
                          router.push(res.href);
                        }}
                        className={`flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-950/30 hover:bg-slate-850/40 text-slate-300'
                        }`}
                      >
                        <div className="text-left">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border mr-2 uppercase ${
                              isSelected
                                ? 'bg-blue-500 border-blue-400 text-white'
                                : 'bg-slate-850 border-slate-800 text-slate-400'
                            }`}
                          >
                            {res.type}
                          </span>
                          <span className="text-xs font-bold">{res.title}</span>
                          <p
                            className={`text-[10px] mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}
                          >
                            {res.subtitle}
                          </p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom command status bar */}
              <div className="bg-slate-950/60 px-6 py-2.5 border-t border-slate-850 flex items-center justify-between text-[9px] text-slate-500 font-medium">
                <span className="flex items-center space-x-2">
                  <span>↑↓ Nav</span>
                  <span>•</span>
                  <span>Enter to Navigate</span>
                </span>
                <span>Tenant Protected</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Drawer Navigation (Focus-Trapped) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/60"
            />

            {/* Sidebar drawer panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              ref={mobileDrawerRef}
              className="relative w-80 bg-slate-900 border-r border-slate-850 p-6 flex flex-col h-full z-10"
            >
              <button
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-850 flex items-center justify-center text-slate-400 outline-none"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation panel"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-emerald-500 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h2 className="text-md font-bold tracking-tight text-white">Client Portal</h2>
                  <span className="text-[10px] text-slate-500 font-medium block">
                    SyncGrid Space
                  </span>
                </div>
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto">
                {sidebarLinks.map((link) => {
                  const isActive = safePathname === link.href;
                  const Icon = link.icon;

                  return (
                    <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}>
                      <div
                        className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl text-sm font-medium outline-none ${
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
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-sm font-semibold text-white truncate">
                        {sessionUser.name}
                      </p>
                      <span className="text-xs text-slate-500 block truncate">
                        {sessionUser.clientName}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 py-5"
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
