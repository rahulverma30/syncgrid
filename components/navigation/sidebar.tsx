/**
 * Sidebar component
 * Main navigation sidebar with collapsible groups
 */

'use client';

import { Key, useEffect, useState, type ComponentType, type SVGProps } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { useSidebarStore } from '@/store';
import { useLockBodyScroll } from '@/hooks';
import { SIDEBAR_GROUPS } from '@/constants/navigation';
import { filterNavigationByUser } from '@/lib/auth/navigation';
import { cn } from '@/lib/cn';

export function Sidebar() {
  const pathname = usePathname();
  const safePathname = pathname || '';
  const { data: session } = useSession();
  const { isCollapsed, isOpen, toggleCollapse, setIsOpen } = useSidebarStore();

  const [companyName, setCompanyName] = useState('SyncGrid');

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

  useLockBodyScroll(isOpen);

  const [expandedGroups, setExpandedGroups] = useState<Set<unknown>>(
    new Set([SIDEBAR_GROUPS[0].id])
  );

  useEffect(() => {
    setIsOpen(false);
  }, [safePathname, setIsOpen]);

  const toggleGroupExpanded = (groupId: unknown) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const isItemActive = (href: string) =>
    safePathname === href || safePathname.startsWith(href + '/');

  const navigationGroups = filterNavigationByUser(SIDEBAR_GROUPS as any, session?.user);

  const renderNav = (mobile = false) => (
    <nav className="flex-1 space-y-6 overflow-y-auto p-4">
      {navigationGroups.map((group) => (
        <div key={group?.id || (group?.label as any)}>
          <button
            onClick={() => toggleGroupExpanded(group.id as Key)}
            className={cn(
              'flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground',
              isCollapsed && !mobile && 'justify-center'
            )}
            title={group.label}
          >
            {(!isCollapsed || mobile) && group.label}
            {(!isCollapsed || mobile) && (
              <ChevronDown
                className={cn(
                  'h-3 w-3 transition-transform',
                  expandedGroups.has(group.id) && 'rotate-180'
                )}
              />
            )}
          </button>

          <AnimatePresence initial={false}>
            {expandedGroups.has(group.id as Key) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="mt-2 space-y-1 overflow-hidden"
              >
                {group.items.map((item) => {
                  const isActive = isItemActive(item.href || '');
                  const Icon = item.icon as unknown as ComponentType<SVGProps<SVGSVGElement>>;
                  const labelVisible = !isCollapsed || mobile;
                  const itemClassName = cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'bg-primary/10 text-primary border-l-2 border-primary shadow-none'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground border-l-2 border-transparent',
                    item.disabled &&
                      'cursor-not-allowed opacity-50 hover:bg-transparent hover:text-muted-foreground pointer-events-none'
                  );
                  const content = (
                    <>
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {labelVisible && (
                        <>
                          <span className="flex-1 truncate text-left">{item.label}</span>
                          {item.badge && (
                            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              {typeof item.badge === 'string' ? item.badge : item.badge.text}
                            </span>
                          )}
                        </>
                      )}
                    </>
                  );

                  return (
                    <div key={(item.id as string) || item.label}>
                      {item.disabled ? (
                        <button className={itemClassName} title={item.label} disabled>
                          {content}
                        </button>
                      ) : (
                        <Link href={item.href || ''} className={itemClassName} title={item.label}>
                          {content}
                        </Link>
                      )}

                      {labelVisible && item.submenu && isActive && !item.disabled && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="ml-4 mt-1 space-y-1 overflow-hidden border-l border-border pl-2"
                        >
                          {item.submenu.map((subitem: any) => (
                            <Link key={subitem.href} href={subitem.href}>
                              <div
                                className={cn(
                                  'rounded-md px-3 py-2 text-xs font-medium transition-all',
                                  pathname === subitem.href
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                )}
                              >
                                {subitem.label}
                              </div>
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 280 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="fixed left-0 top-16 z-30 hidden h-[calc(100vh-4rem)] border-r border-border bg-card md:block"
      >
        <div className="flex h-full flex-col overflow-hidden">
          <button
            onClick={toggleCollapse}
            className="flex items-center gap-3 p-4 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
            {!isCollapsed && <span>Collapse</span>}
          </button>
          {renderNav(false)}
        </div>
      </motion.aside>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="fixed left-0 top-0 z-50 h-dvh w-[min(88vw,320px)] border-r border-border bg-card shadow-xl md:hidden"
            >
              <div className="flex h-16 items-center justify-between border-b border-border px-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                    {companyName.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="font-semibold">{companyName}</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {renderNav(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
