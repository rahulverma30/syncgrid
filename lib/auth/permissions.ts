import { connectToDatabase } from '@/lib/db';
import { Permission, Role, User } from '@/models';
export {
  compactPermissions,
  hasPermission,
  hasRole,
  permissionKey,
  slugifyRole,
} from './permission-checks';
import { compactPermissions, permissionKey } from './permission-checks';

export async function getUserPermissionKeys(userId: string) {
  await connectToDatabase();

  const user = await User.findById(userId).populate({
    path: 'roles',
    model: Role,
    populate: {
      path: 'permissions',
      model: Permission,
    },
  });

  if (!user) {
    return [];
  }

  const inherited = user.roles.flatMap((role: any) =>
    role.permissions.map((permission: any) => ({
      resource: permission.resource,
      action: permission.action,
    }))
  );

  const allowOverrides = user.permissionOverrides
    .filter((permission: any) => permission.effect === 'allow')
    .flatMap((permission: any) =>
      permission.actions.map((action: string) => ({
        resource: permission.resource,
        action,
      }))
    );

  const denied = new Set(
    user.permissionOverrides
      .filter((permission: any) => permission.effect === 'deny')
      .flatMap((permission: any) =>
        permission.actions.map((action: string) => permissionKey(permission.resource, action))
      )
  );

  return compactPermissions([...inherited, ...allowOverrides]).filter((key) => !denied.has(key));
}
