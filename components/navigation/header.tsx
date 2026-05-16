/**
 * Header/Navbar component
 * Top navigation bar with theme toggle and user menu
 */

'use client';

import { useTheme } from 'next-themes';
import { signOut, useSession } from 'next-auth/react';
import { Moon, Sun, Bell, Menu, X, Settings, LogOut, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useMounted } from '@/hooks';
import { APP_NAME } from '@/constants';
import { Button } from '@/components/ui/button';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { useCommandPaletteStore, useSidebarStore } from '@/store';

export function Header() {
  const isMounted = useMounted();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const { isOpen, setIsOpen } = useSidebarStore();
  const { togglePalette } = useCommandPaletteStore();

  if (!isMounted) return null;

  const isDark = theme === 'dark';

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6">
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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={togglePalette}
            className="hidden gap-2 text-muted-foreground md:inline-flex"
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
            <kbd className="ml-4 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px]">
              Ctrl K
            </kbd>
          </Button>

          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" onClick={() => setTheme(isDark ? 'light' : 'dark')}>
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <DropdownMenu
            trigger={
              <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-muted">
                {session?.user?.name?.charAt(0) || 'U'}
              </div>
            }
            items={[
              {
                label: 'Settings',
                icon: <Settings className="h-4 w-4" />,
                onClick: () => console.log('Settings clicked'),
              },
              {
                label: 'Logout',
                icon: <LogOut className="h-4 w-4" />,
                onClick: () => {
                  toast.success('Logged out successfully');
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
