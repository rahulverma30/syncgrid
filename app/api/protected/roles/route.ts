import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Role, Permission, AuditLog } from '@/models';
import { hasRoleCheck } from '@/lib/auth/engine';
import { slugifyRole } from '@/lib/auth/permission-checks';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    const roles = await Role.find({
      $or: [{ companyId: null }, { companyId }],
    })
      .populate({ path: 'permissions', model: Permission })
      .populate({ path: 'inheritedRoles', model: Role })
      .lean();

    return NextResponse.json({ success: true, data: roles });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;

    const headerList = await headers();
    const ipAddress = headerList.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = headerList.get('user-agent') || 'Unknown';

    const isAdmin = await hasRoleCheck(userId, companyId, [
      'super-admin',
      'admin',
      'organization-owner',
    ]);
    if (!isAdmin) {
      // Log unauthorized escalation attempt
      await AuditLog.create({
        companyId,
        actorId: userId,
        action: 'privilege_escalation_attempt',
        resource: 'roles',
        ipAddress,
        userAgent,
        status: 'failure',
        metadata: { attemptedAction: 'create_role' },
      });

      return NextResponse.json(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'Privileged operations require administrative access.',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, hierarchyLevel, permissionIds, inheritedRoleIds } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Role name is required' },
        { status: 400 }
      );
    }

    const slug = slugifyRole(name);

    const existing = await Role.findOne({ slug, $or: [{ companyId: null }, { companyId }] });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'A role with this name or slug already exists.' },
        { status: 409 }
      );
    }

    const newRole = await Role.create({
      name,
      slug,
      description: description || '',
      companyId,
      permissions: permissionIds || [],
      inheritedRoles: inheritedRoleIds || [],
      hierarchyLevel: hierarchyLevel !== undefined ? Number(hierarchyLevel) : 100,
      priority: hierarchyLevel !== undefined ? Number(hierarchyLevel) : 100,
      isSystem: false,
      isSystemRole: false,
      metadata: { createdBy: userId, createdAt: new Date() },
    });

    // Write audit log
    await AuditLog.create({
      companyId,
      actorId: userId,
      action: 'create_role',
      resource: 'roles',
      resourceId: newRole._id.toString(),
      ipAddress,
      userAgent,
      status: 'success',
      metadata: { roleName: name, hierarchyLevel },
    });

    return NextResponse.json({ success: true, data: newRole }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});
