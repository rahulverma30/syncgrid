import { NextResponse } from 'next/server';
import { withApiPermission } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { WikiSpace, KnowledgeActivity } from '@/models';
import { broadcastEvent } from '@/lib/realtime';
import { logger } from '@/lib/logger';
import { hasPermission } from '@/lib/auth/permission-checks';

export const GET = withApiPermission(
  'wiki',
  'read',
  async (request: Request, context: any, session: any) => {
    try {
      await connectToDatabase();
      const companyId = session.user.companyId;
      const userId = session.user.id;

      // Dynamic Permission check instead of hardcoded roles
      const isAdmin = hasPermission(session.user.permissions || [], 'wiki', 'manage');

      // Return spaces scoped by companyId
      // If not Admin, filter out private visibility spaces unless the user is explicitly on permissions
      let query: any = { companyId };

      if (!isAdmin) {
        query.$or = [
          { visibility: { $in: ['public', 'internal'] } },
          { 'permissions.userId': userId },
        ];
      }

      const spaces = await WikiSpace.find(query).sort({ name: 1 }).lean();
      return NextResponse.json({ success: true, data: spaces });
    } catch (error: any) {
      logger.error('Failed to load wiki spaces:', error, { companyId: session?.user?.companyId });
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: error.message },
        { status: 500 }
      );
    }
  }
);

export const POST = withApiPermission(
  'wiki',
  'create',
  async (request: Request, context: any, session: any) => {
    try {
      await connectToDatabase();
      const companyId = session.user.companyId;
      const userId = session.user.id;
      const body = await request.json();

      const { name, icon, description, visibility, tags } = body;
      if (!name) {
        return NextResponse.json(
          { success: false, error: 'API_ERROR', message: 'Space name required' },
          { status: 400 }
        );
      }

      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check unique slug within tenant
      const existing = await WikiSpace.findOne({ companyId, slug });
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'API_ERROR', message: 'Space with similar name already exists' },
          { status: 400 }
        );
      }

      const space = new WikiSpace({
        companyId,
        name,
        slug,
        icon: icon || 'folder',
        description: description || '',
        visibility: visibility || 'internal',
        tags: tags || [],
        permissions: [{ userId, role: 'admin' }],
      });

      await space.save();

      // Register knowledge activity log
      const activity = new KnowledgeActivity({
        companyId,
        userId,
        spaceId: space._id,
        action: 'space_created',
        details: `Created new Wiki Space: "${name}"`,
      });
      await activity.save();

      logger.info(`[KnowledgeSpace POST] Space "${name}" created.`, { companyId, userId });

      // Broadcast SSE update
      broadcastEvent({
        companyId,
        event: 'knowledge_space_added',
        payload: space,
      });

      return NextResponse.json({ success: true, data: space });
    } catch (error: any) {
      logger.error('Failed to create wiki space:', error, { companyId: session?.user?.companyId });
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: error.message },
        { status: 500 }
      );
    }
  }
);
