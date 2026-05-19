import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_ACTIONS,
  PERMISSION_RESOURCES,
  ROLE_HIERARCHY,
} from '@/constants/rbac';
import { Permission, Role, AuthorizationPolicy } from '@/models';
import { slugifyRole } from './permission-checks';

export async function ensureSystemPermissions() {
  const docs = [];

  for (const resource of PERMISSION_RESOURCES) {
    for (const action of PERMISSION_ACTIONS) {
      docs.push({
        key: `${resource}:${action}`,
        resource,
        action,
        description: `${action} ${resource} resource`,
        module: ['crm', 'hr', 'finance', 'payroll', 'analytics', 'collaboration'].includes(resource)
          ? resource
          : 'core',
        category: resource,
        isSystem: true,
        isSystemPermission: true,
      });
    }
  }

  // Super admin full bypass wildcard permission
  docs.push({
    key: '*:manage',
    resource: '*',
    action: 'manage',
    description: 'Full platform administration override capability',
    module: 'admin',
    category: 'system',
    isSystem: true,
    isSystemPermission: true,
  });

  await (Permission as any).bulkWrite(
    docs.map((doc) => ({
      updateOne: {
        filter: { key: doc.key },
        update: { $setOnInsert: doc },
        upsert: true,
      },
    }))
  );
}

export async function ensureSystemRoles() {
  await ensureSystemPermissions();

  const roles = Object.entries(DEFAULT_ROLE_PERMISSIONS);

  for (const [roleName, permissionGroups] of roles) {
    const permissionKeys = permissionGroups.flatMap((group) => {
      if (group.resource === '*') {
        return ['*:manage'];
      }
      return group.actions.map((action) => `${group.resource}:${action}`);
    });

    const permissions = await Permission.find({ key: { $in: permissionKeys } }).select('_id');
    const slug = slugifyRole(roleName);
    const hierarchyLevel =
      (ROLE_HIERARCHY as any)[roleName] !== undefined ? (ROLE_HIERARCHY as any)[roleName] : 100;

    await Role.updateOne(
      {
        slug,
        companyId: null,
      },
      {
        $set: {
          name: roleName,
          slug,
          companyId: null,
          permissions: permissions.map((p) => p._id),
          isSystem: true,
          isSystemRole: true,
          hierarchyLevel,
          priority: hierarchyLevel,
          metadata: { seededAt: new Date() },
        },
      },
      {
        upsert: true,
      }
    );
  }

  // Seed default attribute-based policies (ABAC)
  const defaultPolicies = [
    {
      name: 'Employee Self Profile Edit Policy',
      resource: 'users',
      actions: ['update'],
      conditions: { isOwner: true },
      effect: 'allow',
      priority: 10,
      tenantAware: true,
      enabled: true,
      companyId: null,
    },
    {
      name: 'Developer Assigned Tasks Edit Policy',
      resource: 'tasks',
      actions: ['update', 'comment'],
      conditions: { isOwner: true }, // handles direct assignee / ownership check
      effect: 'allow',
      priority: 10,
      tenantAware: true,
      enabled: true,
      companyId: null,
    },
    {
      name: 'Workspace Assignment Scoping Access Policy',
      resource: 'workspaces',
      actions: ['read'],
      conditions: { workspaceMatch: true },
      effect: 'allow',
      priority: 10,
      tenantAware: true,
      enabled: true,
      companyId: null,
    },
    {
      name: 'Department Assignment Scoping Access Policy',
      resource: 'departments',
      actions: ['read'],
      conditions: { departmentMatch: true },
      effect: 'allow',
      priority: 10,
      tenantAware: true,
      enabled: true,
      companyId: null,
    },
  ];

  for (const policy of defaultPolicies) {
    await AuthorizationPolicy.updateOne(
      { name: policy.name, companyId: null },
      { $set: policy },
      { upsert: true }
    );
  }
}
