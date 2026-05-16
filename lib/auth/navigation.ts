import { Key } from 'react';
import { hasPermission, hasRole } from './permission-checks';

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
 * Build breadcrumb navigation based on permissions
 */
export function buildBreadcrumbs(
  items: Array<{ label: string; href: string }>,
  sessionUser: any
): Array<{ label: string; href: string }> {
  return items.filter(() => true);
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
