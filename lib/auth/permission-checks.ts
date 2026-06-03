/**
 * Permission & Role Checking Utilities
 * Provides granular permission checking for RBAC system
 */

export function slugifyRole(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function permissionKey(resource: string, action: string) {
  return `${resource.toLowerCase()}:${action.toLowerCase()}`;
}

export function compactPermissions(permissions: Array<{ resource: string; action: string }>) {
  return Array.from(
    new Set(permissions.map((permission) => permissionKey(permission.resource, permission.action)))
  );
}

/**
 * Check if user has specific permission
 * Supports wildcards:
 * - *:manage = full access
 * - resource:manage = full access for resource
 * - *:action = action on all resources
 */
export function hasPermission(permissions: string[] = [], resource: string, action: string) {
  const normalizedResource = resource.toLowerCase();
  const normalizedAction = action.toLowerCase();

  return (
    permissions.includes('*:manage') ||
    permissions.includes(`${normalizedResource}:manage`) ||
    permissions.includes(`*:${normalizedAction}`) ||
    permissions.includes(permissionKey(normalizedResource, normalizedAction))
  );
}

/**
 * Check if user has any of the specified roles
 */
export function hasRole(roles: string[] = [], allowedRoles: string[]) {
  const normalizedRoles = roles.map((role) => slugifyRole(role));
  return allowedRoles.some((role) => normalizedRoles.includes(slugifyRole(role)));
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(roles: string[] = [], requiredRoles: string[]) {
  const normalizedRoles = roles.map((role) => slugifyRole(role));
  return requiredRoles.every((role) => normalizedRoles.includes(slugifyRole(role)));
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
  permissions: string[] = [],
  checks: Array<{ resource: string; action: string }>
) {
  return checks.some((check) => hasPermission(permissions, check.resource, check.action));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(
  permissions: string[] = [],
  checks: Array<{ resource: string; action: string }>
) {
  return checks.every((check) => hasPermission(permissions, check.resource, check.action));
}

/**
 * Get list of actions user can perform on a resource
 */
export function getResourceActions(permissions: string[] = [], resource: string) {
  const normalizedResource = resource.toLowerCase();

  // If user has manage permission on this resource, they can do anything
  if (permissions.includes('*:manage') || permissions.includes(`${normalizedResource}:manage`)) {
    return ['create', 'read', 'update', 'delete', 'export', 'approve', 'assign', 'manage'];
  }

  // Collect all actions for this resource
  const actions = new Set<string>();
  permissions.forEach((permission) => {
    const [permResource, permAction] = permission.split(':');

    if (permAction === 'manage') return; // Skip manage permissions (handled above)

    if (permResource === '*' || permResource === normalizedResource) {
      actions.add(permAction);
    }
  });

  return Array.from(actions);
}

/**
 * Filter list of items based on user permissions
 * Requires a filter function that returns required permission
 */
export function filterByPermission<T>(
  items: T[],
  permissions: string[] = [],
  getRequired: (item: T) => { resource: string; action: string } | null
): T[] {
  return items.filter((item) => {
    const required = getRequired(item);
    if (!required) return true; // Allow if no permission requirement
    return hasPermission(permissions, required.resource, required.action);
  });
}
