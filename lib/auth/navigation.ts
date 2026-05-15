import { hasPermission, hasRole } from './permission-checks';

export function canSeeNavItem(item: any, sessionUser: any) {
  if (!sessionUser) {
    return false;
  }

  if (item.roles?.length && !hasRole(sessionUser.roles || [], item.roles)) {
    return false;
  }

  if (item.permission) {
    return hasPermission(
      sessionUser.permissions || [],
      item.permission.resource,
      item.permission.action
    );
  }

  return true;
}

export function filterNavigationByUser(groups: any[], sessionUser: any) {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item: any) => canSeeNavItem(item, sessionUser)),
    }))
    .filter((group) => group.items.length > 0);
}
