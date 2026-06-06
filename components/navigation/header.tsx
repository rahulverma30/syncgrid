/**
 * Header/Navbar component
 * Top navigation bar with search, notifications, and user menu.
 * Dark-mode only — theme toggle removed.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Menu, X, Settings, LogOut, Search, User, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useMounted } from '@/hooks';
import { APP_NAME } from '@/constants';
import { Button } from '@/components/ui/button';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { NotificationBellWidget } from '@/components/ui/notification-bell';
import { useCommandPaletteStore, useSidebarStore } from '@/store';
import { ActiveTimerWidget } from '@/components/tasks/ActiveTimerWidget';

export function Header() {
  const isMounted = useMounted();
  const { data: session } = useSession();
  const { isOpen, setIsOpen } = useSidebarStore();
  const { togglePalette } = useCommandPaletteStore();
  const router = useRouter();
  const [companyName, setCompanyName] = useState(APP_NAME);

  useEffect(() => {
    if (session?.user) {
      fetch('/api/protected/settings/company')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data?.name) {
            setCompanyName(data.data.name);
          }
        })
        .catch(console.error);
    }
  }, [session?.user]);

  if (!isMounted) return null;

  const userInitial = session?.user?.name?.charAt(0)?.toUpperCase() || 'U';
  const userName = session?.user?.name || 'User';

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-14 border-b border-border/50 bg-background/95 backdrop-blur-md print:hidden">
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-5">
        {/* Left: Mobile hamburger + Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors md:hidden focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
          >
            {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0 select-none shadow-sm shadow-primary/30">
              {companyName.substring(0, 2).toUpperCase()}
            </div>
            <span className="hidden sm:inline font-semibold text-sm tracking-tight text-foreground">
              {companyName}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Active timer — globally visible */}
          <ActiveTimerWidget />
          {/* Notifications */}
          <NotificationBellWidget />

          {/* User menu */}
          <DropdownMenu
            trigger={
              <div
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary/15 text-primary font-semibold text-md select-none hover:bg-primary/25 transition-colors border border-primary/20"
                title={userName}
                role="button"
                tabIndex={0}
                aria-label={`User menu for ${userName}`}
              >
                {userInitial}
              </div>
            }
            items={[
              {
                label: 'Profile',
                icon: <User className="h-4 w-4" />,
                onClick: () => router.push('/profile'),
              },
              {
                label: 'Settings',
                icon: <Settings className="h-4 w-4" />,
                onClick: () => router.push('/settings'),
              },
              {
                label: 'Sign out',
                icon: <LogOut className="h-4 w-4" />,
                onClick: () => {
                  toast.success('Signed out successfully');
                  signOut({ callbackUrl: '/login' });
                },
                destructive: true,
              },
            ]}
          />
        </div>
      </div>
    </header>
  );
}
