/**
 * Command palette component
 * CMD + K searchable command palette
 */

'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCommandPaletteStore } from '@/store';
import { useDebounce, useLockBodyScroll } from '@/hooks';
import { cn } from '@/lib/cn';
import { Home, LayoutDashboard, LogIn, Search, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ROUTES } from '@/constants/routes';

export function CommandPalette() {
  const router = useRouter();
  const {
    isOpen,
    togglePalette,
    searchQuery,
    setSearchQuery,
    selectedIndex,
    setSelectedIndex,
    actions,
    registerActions,
    executeAction,
  } = useCommandPaletteStore();

  useLockBodyScroll(isOpen);

  const defaultActions = useMemo(
    () => [
      {
        id: 'go-home',
        title: 'Go to Home',
        description: 'Open the public SyncGrid overview',
        category: 'Navigation',
        icon: <Home className="h-4 w-4" />,
        shortcut: ['G', 'H'],
        action: () => router.push(ROUTES.HOME),
      },
      {
        id: 'go-dashboard',
        title: 'Go to Dashboard',
        description: 'Open the enterprise foundation workspace',
        category: 'Navigation',
        icon: <LayoutDashboard className="h-4 w-4" />,
        shortcut: ['G', 'D'],
        action: () => router.push(ROUTES.DASHBOARD.HOME),
      },
      {
        id: 'go-login',
        title: 'Go to Login',
        description: 'Open the authentication screen',
        category: 'Navigation',
        icon: <LogIn className="h-4 w-4" />,
        shortcut: ['G', 'L'],
        action: () => router.push(ROUTES.AUTH.LOGIN),
      },
    ],
    [router]
  );

  const debouncedQuery = useDebounce(searchQuery, 200);

  useEffect(() => {
    registerActions(defaultActions);
  }, [defaultActions, registerActions]);

  const filteredActions = useMemo(() => {
    if (!debouncedQuery) return actions;
    return actions.filter(
      (action) =>
        action.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        action.description?.toLowerCase().includes(debouncedQuery.toLowerCase())
    );
  }, [debouncedQuery, actions]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [debouncedQuery, setSelectedIndex]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD + K or CTRL + K to toggle
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        togglePalette();
      }

      // ESC to close
      if (e.key === 'Escape' && isOpen) {
        togglePalette();
      }

      // Arrow navigation
      if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(Math.min(selectedIndex + 1, filteredActions.length - 1));
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(Math.max(selectedIndex - 1, 0));
        }
        if (e.key === 'Enter' && filteredActions[selectedIndex]) {
          e.preventDefault();
          executeAction(filteredActions[selectedIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredActions, togglePalette, setSelectedIndex, executeAction]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => togglePalette()}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* Palette */}
          {/* Palette */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
            >
              {/* Search input */}
              <div className="flex items-center border-b border-border px-4 py-4">
                <Search className="h-5 w-5 text-muted-foreground mr-3" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Type a command..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <kbd className="ml-2 hidden rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground sm:inline">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-96 overflow-y-auto">
                {filteredActions.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No commands found
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {filteredActions.map((action, index) => (
                      <button
                        key={action.id}
                        onClick={() => executeAction(action.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 sm:py-2 rounded-md text-sm text-left transition-colors',
                          selectedIndex === index
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        )}
                      >
                        {action.icon && <span className="h-5 w-5">{action.icon}</span>}
                        <div className="flex-1">
                          <div className="font-medium">{action.title}</div>
                          {action.description && (
                            <div className="text-xs opacity-70">{action.description}</div>
                          )}
                        </div>
                        {action.shortcut && (
                          <div className="hidden sm:flex gap-1">
                            {action.shortcut.map((key) => (
                              <kbd
                                key={key}
                                className="rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium"
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer hint */}
              <div className="border-t border-border bg-muted/50 px-4 py-3 text-xs text-muted-foreground flex items-center justify-between">
                <div className="flex gap-2">
                  <kbd className="rounded-md border border-border bg-background px-2 py-1">
                    <Command className="h-3 w-3 inline" />
                  </kbd>
                  <span>to select</span>
                  <kbd className="rounded-md border border-border bg-background px-2 py-1">
                    Up/Down
                  </kbd>
                  <span>to navigate</span>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
