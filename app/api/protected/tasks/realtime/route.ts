import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { registerClient } from '@/lib/realtime';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Task, Document, WikiSpace } from '@/models';
import { can } from '@/lib/auth/engine';
import { hasPermission } from '@/lib/auth/permission-checks';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;

    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    const taskId = url.searchParams.get('taskId');
    const documentId = url.searchParams.get('documentId');

    const userSessionObj = {
      id: userId,
      companyId,
      roles: session.user.roles,
      permissions: session.user.permissions,
    };

    // 1. Authorize Project room subscription
    if (projectId) {
      const isAuthorized = await can(userSessionObj, 'read', 'projects', { projectId });
      if (!isAuthorized) {
        return NextResponse.json(
          {
            success: false,
            error: 'FORBIDDEN',
            message: 'Unauthorized project room subscription.',
          },
          { status: 403 }
        );
      }
    }

    // 2. Authorize Task room subscription
    if (taskId) {
      const task = await Task.findOne({ _id: taskId, companyId }).select('projectId createdById');
      if (!task) {
        return NextResponse.json(
          { success: false, error: 'NOT_FOUND', message: 'Task not found.' },
          { status: 404 }
        );
      }
      const isAuthorized = await can(userSessionObj, 'read', 'tasks', {
        projectId: task.projectId,
        ownerId: task.createdById,
      });
      if (!isAuthorized) {
        return NextResponse.json(
          { success: false, error: 'FORBIDDEN', message: 'Unauthorized task room subscription.' },
          { status: 403 }
        );
      }
    }

    // 3. Authorize Document room subscription
    if (documentId) {
      const document = await Document.findOne({ _id: documentId, companyId }).select('spaceId');
      if (!document) {
        return NextResponse.json(
          { success: false, error: 'NOT_FOUND', message: 'Document not found.' },
          { status: 404 }
        );
      }
      const space = await WikiSpace.findOne({ _id: document.spaceId, companyId });
      if (!space) {
        return NextResponse.json(
          { success: false, error: 'NOT_FOUND', message: 'Wiki Space not found.' },
          { status: 404 }
        );
      }
      const isAdmin = hasPermission(session.user.permissions || [], 'wiki', 'manage');
      let hasAccess = isAdmin;
      if (!isAdmin) {
        if (space.visibility === 'public' || space.visibility === 'internal') {
          hasAccess = true;
        } else {
          hasAccess = space.permissions.some((p: any) => p.userId.toString() === userId);
        }
      }
      if (!hasAccess) {
        return NextResponse.json(
          {
            success: false,
            error: 'FORBIDDEN',
            message: 'Unauthorized document room subscription.',
          },
          { status: 403 }
        );
      }
    }

    let cleanup: () => void;

    const stream = new ReadableStream({
      start(controller) {
        cleanup = registerClient(companyId, userId, projectId, taskId, documentId, controller);
      },
      cancel() {
        if (cleanup) cleanup();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable buffering for Nginx
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});
