'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { Clock, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SessionUser {
  id: string;
  name: string;
  email: string;
  portalRole: string;
  mfaEnabled: boolean;
  clientId: string;
  clientName: string;
  companyId: string;
}

interface PortalSessionContextProps {
  sessionUser: SessionUser | null;
  isLoading: boolean;
  refreshSession: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const PortalSessionContext = createContext<PortalSessionContextProps | undefined>(undefined);

const IDLE_WARNING_TIME = 13 * 60 * 1000; // 13 minutes
const IDLE_LOGOUT_TIME = 15 * 60 * 1000; // 15 minutes
const COUNTDOWN_INTERVAL = 1000;

export function PortalSessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inactivity tracking states
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningCountdown, setWarningCountdown] = useState(120); // 2 minutes countdown

  const isLoginPage = pathname === '/portal/login';

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSession = React.useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/portal/auth/verify');
      const body = await res.json();
      if (res.ok && body.success) {
        setSessionUser(body.data);
        return true;
      } else {
        setSessionUser(null);
        return false;
      }
    } catch (err) {
      setSessionUser(null);
      return false;
    }
  }, []);

  const clearAllTimers = React.useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  }, []);

  const handleIdleExpiry = React.useCallback(async () => {
    await fetch('/api/portal/auth/logout', { method: 'POST' });
    setSessionUser(null);
    clearAllTimers();
    setShowWarningModal(false);
    toast.error('Session expired due to inactivity. Please log in again.');
    router.push('/portal/login');
  }, [router, clearAllTimers]);

  const resetIdleTimer = React.useCallback(() => {
    if (isLoginPage || !sessionUser) {
      clearAllTimers();
      return;
    }

    clearAllTimers();

    // Start Warning Timer
    warningTimerRef.current = setTimeout(() => {
      setShowWarningModal(true);
      setWarningCountdown(120);

      // Start Countdown tick
      countdownIntervalRef.current = setInterval(() => {
        setWarningCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            handleIdleExpiry();
            return 0;
          }
          return prev - 1;
        });
      }, COUNTDOWN_INTERVAL);
    }, IDLE_WARNING_TIME);
  }, [isLoginPage, sessionUser, clearAllTimers, handleIdleExpiry]);

  const refreshSession = React.useCallback(async (): Promise<boolean> => {
    const success = await fetchSession();
    if (success) {
      resetIdleTimer();
      setShowWarningModal(false);
    }
    return success;
  }, [fetchSession, resetIdleTimer]);

  const logout = React.useCallback(async () => {
    try {
      await fetch('/api/portal/auth/logout', { method: 'POST' });
      setSessionUser(null);
      clearAllTimers();
      setShowWarningModal(false);
      if (!isLoginPage) {
        toast.info('Session ended successfully.');
        router.push('/portal/login');
      }
    } catch (error) {
      toast.error('Failed to log out.');
    }
  }, [isLoginPage, router, clearAllTimers]);

  // Activity listeners
  useEffect(() => {
    const handleActivity = () => {
      if (!showWarningModal) {
        resetIdleTimer();
      }
    };

    if (sessionUser && !isLoginPage) {
      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('mousedown', handleActivity);
      window.addEventListener('keydown', handleActivity);
      window.addEventListener('scroll', handleActivity);
      window.addEventListener('click', handleActivity);

      resetIdleTimer();
    }

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('click', handleActivity);
      clearAllTimers();
    };
  }, [sessionUser, isLoginPage, resetIdleTimer, showWarningModal, clearAllTimers]);

  // Initial validation
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      const authenticated = await fetchSession();
      if (!authenticated && !isLoginPage) {
        router.push('/portal/login');
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, [pathname, isLoginPage, router, fetchSession]);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <PortalSessionContext.Provider value={{ sessionUser, isLoading, refreshSession, logout }}>
      {children}

      {/* Premium Inactivity Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="w-[420px] bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-center space-y-6">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-rose-500" />

            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Inactivity Warning</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your B2B Client Space session is about to expire due to complete inactivity. For
                compliance and security, automatic termination occurs soon.
              </p>
            </div>

            <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl flex items-center justify-center space-x-3">
              <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
              <div className="text-left text-xs">
                <span className="text-slate-500 uppercase font-bold tracking-wider text-[10px]">
                  Expiring In
                </span>
                <p className="text-lg font-extrabold text-white">
                  {formatCountdown(warningCountdown)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-slate-800 hover:bg-slate-800 text-slate-350 rounded-xl py-5"
                onClick={logout}
              >
                Log Out
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-5 border-0 shadow-lg shadow-blue-500/10"
                onClick={() => refreshSession()}
              >
                Stay Logged In
              </Button>
            </div>
          </div>
        </div>
      )}
    </PortalSessionContext.Provider>
  );
}

export function usePortalSession() {
  const context = useContext(PortalSessionContext);
  if (context === undefined) {
    throw new Error('usePortalSession must be used within a PortalSessionProvider');
  }
  return context;
}
