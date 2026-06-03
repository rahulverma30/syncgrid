import { NextResponse } from 'next/server';
import { withApiPermission } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Document, DocumentVersion, KnowledgeActivity, WikiSpace } from '@/models';
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
      const { searchParams } = new URL(request.url);

      const spaceId = searchParams.get('spaceId');
      const isSop = searchParams.get('isSop');
      const isTemplate = searchParams.get('isTemplate');

      // Resolve visible spaces for authorization filtering
      const isAdmin = hasPermission(session.user.permissions || [], 'wiki', 'manage');
      let spacesQuery: any = { companyId };
      if (!isAdmin) {
        spacesQuery.$or = [
          { visibility: { $in: ['public', 'internal'] } },
          { 'permissions.userId': userId },
        ];
      }
      const visibleSpaces = await WikiSpace.find(spacesQuery).select('_id').lean();
      const visibleSpaceIds = visibleSpaces.map((s) => s._id.toString());

      let query: any = { companyId, deletedAt: null };

      if (spaceId) {
        if (!visibleSpaceIds.includes(spaceId.toString())) {
          return NextResponse.json(
            {
              success: false,
              error: 'FORBIDDEN',
              message: 'You do not have access to this Wiki Space.',
            },
            { status: 403 }
          );
        }
        query.spaceId = spaceId;
      } else {
        query.spaceId = { $in: visibleSpaceIds };
      }

      if (isSop !== null && isSop !== undefined) query.isSop = isSop === 'true';
      if (isTemplate !== null && isTemplate !== undefined) query.isTemplate = isTemplate === 'true';

      // Fetch documents, including user mapping fields
      const docs = await Document.find(query)
        .select('-content')
        .populate('ownerId', 'name email')
        .populate('categoryId', 'name colorCode')
        .sort({ title: 1 })
        .lean();

      return NextResponse.json({ success: true, data: docs });
    } catch (error: any) {
      logger.error('Failed to load documents:', error, { companyId: session?.user?.companyId });
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

      const {
        spaceId,
        parentDocumentId,
        categoryId,
        title,
        icon,
        coverImage,
        content,
        visibility,
        status,
        isTemplate,
        isSop,
        tags,
      } = body;

      if (!spaceId || !title) {
        return NextResponse.json(
          {
            success: false,
            error: 'API_ERROR',
            message: 'Space ID and Document Title are required',
          },
          { status: 400 }
        );
      }

      // Resolve visible spaces to verify create permission
      const isAdmin = hasPermission(session.user.permissions || [], 'wiki', 'manage');
      let spacesQuery: any = { companyId };
      if (!isAdmin) {
        spacesQuery.$or = [
          { visibility: { $in: ['public', 'internal'] } },
          { 'permissions.userId': userId },
        ];
      }
      const visibleSpaces = await WikiSpace.find(spacesQuery).select('_id').lean();
      const visibleSpaceIds = visibleSpaces.map((s) => s._id.toString());

      if (!visibleSpaceIds.includes(spaceId.toString())) {
        return NextResponse.json(
          {
            success: false,
            error: 'FORBIDDEN',
            message: 'You do not have write access to this Wiki Space.',
          },
          { status: 403 }
        );
      }

      const slug =
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || 'untitled';

      const document = new Document({
        companyId,
        spaceId,
        parentDocumentId: parentDocumentId || null,
        categoryId: categoryId || null,
        ownerId: userId,
        title,
        slug,
        icon: icon || 'page',
        coverImage: coverImage || '',
        content: content || '',
        visibility: visibility || 'internal',
        status: status || 'published',
        isTemplate: isTemplate || false,
        isSop: isSop || false,
        tags: tags || [],
        collaborators: [userId],
      });

      await document.save();

      // Create Initial Version Checkpoint
      const version = new DocumentVersion({
        documentId: document._id,
        editorId: userId,
        title: document.title,
        content: document.content,
        changeSummary: 'Document created',
        versionNumber: 1,
      });
      await version.save();

      // Register knowledge activity log
      const activity = new KnowledgeActivity({
        companyId,
        userId,
        documentId: document._id,
        spaceId,
        action: 'created',
        details: `Created document: "${title}"`,
      });
      await activity.save();

      logger.info(`[Document POST] Document "${title}" created.`, { companyId, userId });

      // Broadcast SSE update
      broadcastEvent({
        companyId,
        event: 'document_created',
        payload: { ...document.toObject(), ownerId: { _id: userId, name: session.user.name } },
      });

      return NextResponse.json({ success: true, data: document });
    } catch (error: any) {
      logger.error('Failed to create document:', error, { companyId: session?.user?.companyId });
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: error.message },
        { status: 500 }
      );
    }
  }
);
