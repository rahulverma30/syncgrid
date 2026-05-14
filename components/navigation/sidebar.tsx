/**
 * Sidebar component
 * Main navigation sidebar with collapsible groups
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Menu, X } from 'lucide-react';
import { useSidebarStore } from '@/store';
import { SIDEBAR_GROUPS } from '@/constants/navigation';
import { cn } from '@/lib/cn';

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, isOpen, toggleCollapse, setActiveGroup, activeGroup } = useSidebarStore();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set([SIDEBAR_GROUPS[0].id]));

  const toggleGroupExpanded = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const isItemActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <motion.div
      initial={false}
      animate={{
        width: isCollapsed ? 80 : 280,
      }}
      transition={{ duration: 0.3 }}
      className="fixed left-0 top-16 hidden h-screen bg-card border-r border-border md:block"
    >
      {/* Sidebar content */}
      <div className="flex flex-col h-full overflow-hidden">
        {/* Toggle button */}
        <button
          onClick={toggleCollapse}
          className="p-4 hover:bg-muted transition-colors"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {SIDEBAR_GROUPS.map((group) => (
            <div key={group.id}>
              <button
                onClick={() => toggleGroupExpanded(group.id)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors',
                  isCollapsed && 'justify-center'
                )}
                title={group.label}
              >
                {!isCollapsed && group.label}
                {!isCollapsed && expandedGroups.has(group.id) && (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>

              <AnimatePresence>
                {expandedGroups.has(group.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2 space-y-1 overflow-hidden"
                  >
                    {group.items.map((item) => {
                      const isActive = isItemActive(item.href);
                      const Icon = item.icon;

                      return (
                        <div key={item.id}>
                          <Link href={item.href}>
                            <div
                              className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all',
                                isActive
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                              )}
                              title={isCollapsed ? item.label : undefined}
                            >
                              <Icon className="h-5 w-5 flex-shrink-0" />
                              {!isCollapsed && (
                                <span className="flex-1 truncate">
                                  {item.label}
                                  {item.badge && <span className="ml-1 text-xs">{item.badge}</span>}
                                </span>
                              )}
                            </div>
                          </Link>

                          {/* Submenu */}
                          {!isCollapsed && item.submenu && isActive && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              className="ml-2 space-y-1 overflow-hidden border-l border-border"
                            >
                              {item.submenu.map((subitem) => (
                                <Link key={subitem.href} href={subitem.href}>
                                  <div
                                    className={cn(
                                      'px-4 py-2 text-xs font-medium rounded-md transition-all',
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
      </div>
    </motion.div>
  );
}
