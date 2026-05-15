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

export function hasRole(roles: string[] = [], allowedRoles: string[]) {
  const normalizedRoles = roles.map((role) => role.toLowerCase());
  return allowedRoles.some((role) => normalizedRoles.includes(role.toLowerCase()));
}
