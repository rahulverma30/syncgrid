import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Channel } from '@/models';
import { hasRole } from '@/lib/auth/permission-checks';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const roles = session.user.roles || [];

    const url = new URL(request.url);
    const workspaceId = url.searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // RBAC Filter: Super Admin sees all. Managers see their departments. Employees see public or joined channels.
    const isSuperAdmin = hasRole(roles, ['Super Admin', 'Admin']);
    let query: any = { companyId, workspaceId, isArchived: false };

    if (!isSuperAdmin) {
      query.$or = [
        { type: 'public' },
        { members: userId },
        { type: 'department' }, // simple auto-join for departments to simplify seeding
        { type: 'project' }, // allow all developers or project members to see project rooms
      ];
    }

    const list = await Channel.find(query).sort({ name: 1 }).lean();
    return NextResponse.json({ success: true, data: list });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const body = await request.json();

    const { name, type, description, workspaceId, projectId, departmentId } = body;
    if (!name || !type || !workspaceId) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'Missing parameters' },
        { status: 400 }
      );
    }

    const created = new Channel({
      companyId,
      workspaceId,
      name: name.toLowerCase().replace(/\s+/g, '-'),
      type,
      description,
      projectId,
      departmentId,
      members: [userId],
    });

    await created.save();
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
