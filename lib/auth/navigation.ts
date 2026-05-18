import { Key } from 'react';
import { hasPermission, hasRole } from './permission-checks';
import { SIDEBAR_GROUPS } from '@/constants/navigation';

/**
 * Navigation Guard Utilities
 * Filter navigation items based on user roles and permissions
 */

/**
 * Navigation item structure
 */
export interface NavigationItem {
  id: Key;
  submenu: any;
  disabled: boolean;
  label: string;
  href?: string;
  icon?: string;
  roles?: string[];
  permission?: {
    resource: string;
    action: string;
  };
  children?: NavigationItem[];
  badge?: {
    text: string;
    variant?: 'default' | 'warning' | 'danger';
  };
}

/**
 * Navigation group structure
 */
export interface NavigationGroup {
  id: Key;
  label?: string;
  items: NavigationItem[];
}

/**
 * Check if user can see a navigation item
 */
export function canSeeNavItem(item: NavigationItem, sessionUser: any): boolean {
  if (!sessionUser) {
    return false;
  }

  // Check role requirement
  if (item.roles?.length && !hasRole(sessionUser.roles || [], item.roles)) {
    return false;
  }

  // Check permission requirement
  if (item.permission) {
    return hasPermission(
      sessionUser.permissions || [],
      item.permission.resource,
      item.permission.action
    );
  }

  return true;
}

/**
 * Filter navigation groups based on user permissions
 */
export function filterNavigationByUser(
  groups: NavigationGroup[],
  sessionUser: any
): NavigationGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => canSeeNavItem(item, sessionUser))
        .map((item) => ({
          ...item,
          children: item.children?.filter((child) => canSeeNavItem(child, sessionUser)),
        })),
    }))
    .filter((group) => group.items.length > 0);
}

/**
 * Build dynamic, permission-aware breadcrumbs based on the router path
 */
export function buildBreadcrumbs(
  pathname: string,
  sessionUser: any
): Array<{ label: string; href?: string; active?: boolean }> {
  if (!pathname) return [];
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: Array<{ label: string; href?: string; active?: boolean }> = [];

  // Always append Dashboard as root for these routes
  breadcrumbs.push({
    label: 'Dashboard',
    href: '/dashboard',
    active: pathname === '/dashboard' || pathname === '/',
  });

  const allNavItems = (SIDEBAR_GROUPS as any[]).flatMap((g: any) => g.items);
  let currentPath = '';

  segments.forEach((segment, index) => {
    // Skip segment if it is 'dashboard' as we already added it
    if (segment === 'dashboard' && index === 0) return;

    currentPath += `/${segment}`;
    const fullHref = currentPath;

    // Find the navigation item configuration if one matches the path or submenu
    const navItem = (allNavItems as any[]).find(
      (item: any) =>
        item.href === fullHref || item.submenu?.some((sub: any) => sub.href === fullHref)
    );

    // If there is an item with specific permissions, guard it
    if (navItem && !canSeeNavItem(navItem as any, sessionUser)) {
      return; // Filter out from breadcrumb trail if user doesn't have permission!
    }

    // Format label beautifully
    let label = segment
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    if (label.toLowerCase() === 'crm') label = 'CRM';
    if (label.toLowerCase() === 'hr') label = 'HR';
    if (/^[0-9a-fA-F]{24}$/.test(segment)) {
      label = 'Details';
    }

    breadcrumbs.push({
      label,
      href: fullHref,
      active: index === segments.length - 1,
    });
  });

  return breadcrumbs;
}

/**
 * Get navigation items accessible to user
 */
export function getAccessibleNavItems(
  allItems: NavigationItem[],
  sessionUser: any
): NavigationItem[] {
  return allItems.filter((item) => canSeeNavItem(item, sessionUser));
}

/**
 * Check if user has access to any sub-items
 */
export function hasAccessToAnyChild(item: NavigationItem, sessionUser: any): boolean {
  if (!item.children) return true;

  return item.children.some((child) => canSeeNavItem(child, sessionUser));
}
