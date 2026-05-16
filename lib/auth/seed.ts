import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_ACTIONS,
  PERMISSION_RESOURCES,
} from '@/constants/rbac';
import { Permission, Role } from '@/models';
import { slugifyRole } from './permission-checks';

export async function ensureSystemPermissions() {
  const docs = [];

  for (const resource of PERMISSION_RESOURCES) {
    for (const action of PERMISSION_ACTIONS) {
      docs.push({
        key: `${resource}:${action}`,
        resource,
        action,
        description: `${action} ${resource}`,
        isSystem: true,
      });
    }
  }

  docs.push({
    key: '*:manage',
    resource: '*',
    action: 'manage',
    description: 'Full platform access',
    isSystem: true,
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
    const permissionKeys = permissionGroups.flatMap((group) =>
      group.actions.map((action) => `${group.resource}:${action}`)
    );
    const permissions = await Permission.find({ key: { $in: permissionKeys } }).select('_id');

    await Role.updateOne(
      {
        slug: slugifyRole(roleName),
        companyId: null,
      },
      {
        $set: {
          name: roleName,
          slug: slugifyRole(roleName),
          companyId: null,
          permissions: permissions.map((permission) => permission._id),
          isSystem: true,
          priority: roleName === 'Super Admin' ? 0 : 10,
        },
      },
      {
        upsert: true,
      }
    );
  }
}
