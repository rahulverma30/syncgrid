/**
 * Header/Navbar component
 * Top navigation bar with theme toggle and user menu
 */

'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun, Bell, Menu, X, Settings, LogOut } from 'lucide-react';
import { useMounted } from '@/hooks';
import { APP_NAME } from '@/constants';
import { Button } from '@/components/ui/button';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { useSidebarStore } from '@/store';

export function Header() {
  const isMounted = useMounted();
  const { theme, setTheme } = useTheme();
  const { isOpen, setIsOpen } = useSidebarStore();

  if (!isMounted) return null;

  const isDark = theme === 'dark';

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        {/* Left side - Logo and brand */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-md transition-colors"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              SG
            </div>
            <span className="hidden sm:inline font-bold text-lg">{APP_NAME}</span>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* User menu */}
          <DropdownMenu
            trigger={<div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center cursor-pointer">R</div>}
            items={[
              {
                label: 'Settings',
                icon: <Settings className="h-4 w-4" />,
                onClick: () => console.log('Settings clicked'),
              },
              {
                label: 'Logout',
                icon: <LogOut className="h-4 w-4" />,
                onClick: () => console.log('Logout clicked'),
                destructive: true,
              },
            ]}
          />
        </div>
      </div>
    </header>
  );
}
