import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { headers } from 'next/headers';
import { withApiPermission } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Role, User, RoleAssignment, AuditLog } from '@/models';

export const PUT = withApiPermission(
  'roles',
  'update',
  async (request: Request, context: any, session: any) => {
    try {
      await connectToDatabase();
      const companyId = session.user.companyId;
      const userId = session.user.id;
      const params = await context.params;
      const { id } = params;

      const headerList = await headers();
      const ipAddress = headerList.get('x-forwarded-for') || '127.0.0.1';
      const userAgent = headerList.get('user-agent') || 'Unknown';

      const role = await Role.findOne({ _id: id, companyId });
      if (!role) {
        return NextResponse.json(
          {
            success: false,
            error: 'API_ERROR',
            message: 'Custom role not found or belongs to another organization.',
          },
          { status: 404 }
        );
      }

      if (role.isSystem || role.isSystemRole) {
        return NextResponse.json(
          {
            success: false,
            error: 'API_ERROR',
            message: 'System role parameters are read-only and cannot be mutated.',
          },
          { status: 400 }
        );
      }

      const body = await request.json();
      const { name, description, hierarchyLevel, permissionIds, inheritedRoleIds } = body;

      const previousRoleState = {
        name: role.name,
        hierarchyLevel: role.hierarchyLevel,
        permissionsCount: role.permissions?.length || 0,
      };

      if (name) role.name = name;
      if (description !== undefined) role.description = description;
      if (hierarchyLevel !== undefined) {
        role.hierarchyLevel = Number(hierarchyLevel);
        role.priority = Number(hierarchyLevel);
      }
      if (permissionIds) role.permissions = permissionIds;
      if (inheritedRoleIds) role.inheritedRoles = inheritedRoleIds;

      await role.save();

      // Log matrix update audit log
      await AuditLog.create({
        companyId,
        actorId: userId,
        action: 'update_role',
        resource: 'roles',
        resourceId: role._id.toString(),
        ipAddress,
        userAgent,
        status: 'success',
        metadata: {
          roleName: role.name,
          previousState: previousRoleState,
          newState: {
            name: role.name,
            hierarchyLevel: role.hierarchyLevel,
            permissionsCount: role.permissions?.length || 0,
          },
        },
      });

      return NextResponse.json({ success: true, data: role });
    } catch (error: any) {
      return apiErrorResponse(error);
    }
  }
);

export const DELETE = withApiPermission(
  'roles',
  'delete',
  async (request: Request, context: any, session: any) => {
    try {
      await connectToDatabase();
      const companyId = session.user.companyId;
      const userId = session.user.id;
      const params = await context.params;
      const { id } = params;

      const headerList = await headers();
      const ipAddress = headerList.get('x-forwarded-for') || '127.0.0.1';
      const userAgent = headerList.get('user-agent') || 'Unknown';

      const role = await Role.findOne({ _id: id, companyId });
      if (!role) {
        return NextResponse.json(
          { success: false, error: 'API_ERROR', message: 'Role not found.' },
          { status: 404 }
        );
      }

      if (role.isSystem || role.isSystemRole) {
        return NextResponse.json(
          {
            success: false,
            error: 'API_ERROR',
            message: 'System-wide roles are immutable and cannot be deleted.',
          },
          { status: 400 }
        );
      }

      const assignedUsersCount = await User.countDocuments({ roles: role._id, companyId });
      const assignedAssignmentsCount = await RoleAssignment.countDocuments({
        roleId: role._id,
        companyId,
      });

      if (assignedUsersCount > 0 || assignedAssignmentsCount > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'API_ERROR',
            message: `Cannot delete role. It is currently active and assigned to ${assignedUsersCount + assignedAssignmentsCount} team members.`,
          },
          { status: 409 }
        );
      }

      await Role.deleteOne({ _id: id, companyId });

      // Log deletion success
      await AuditLog.create({
        companyId,
        actorId: userId,
        action: 'delete_role',
        resource: 'roles',
        resourceId: id,
        ipAddress,
        userAgent,
        status: 'success',
        metadata: { roleName: role.name },
      });

      return NextResponse.json({ success: true, message: 'Custom role removed successfully.' });
    } catch (error: any) {
      return apiErrorResponse(error);
    }
  }
);
