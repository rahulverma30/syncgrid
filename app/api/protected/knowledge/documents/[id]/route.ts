import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Document, DocumentVersion, KnowledgeActivity } from '@/models';
import { broadcastEvent } from '@/lib/realtime';
import { logger } from '@/lib/logger';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const documentId = context.params.id;

    const document = await Document.findOne({ _id: documentId, companyId, deletedAt: null })
      .populate('ownerId', 'name email')
      .populate('spaceId', 'name visibility')
      .populate('categoryId', 'name colorCode')
      .lean();

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'Document not found' },
        { status: 404 }
      );
    }

    // RBAC and visibility checks
    const userId = session.user.id;
    const roles = session.user.roles || [];
    const isAdmin = roles.includes('Admin') || roles.includes('Super Admin');
    const isOwner = document.ownerId._id.toString() === userId;

    if (document.visibility === 'private' && !isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'Access denied to private document' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: document });
  } catch (error: any) {
    logger.error('Failed to get document detail:', error, { companyId: session?.user?.companyId });
    return apiErrorResponse(error);
  }
});

export const PUT = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const documentId = context.params.id;
    const body = await request.json();

    const document = await Document.findOne({ _id: documentId, companyId, deletedAt: null });
    if (!document) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'Document not found' },
        { status: 404 }
      );
    }

    const {
      title,
      icon,
      coverImage,
      content,
      visibility,
      status,
      isTemplate,
      isSop,
      tags,
      changeSummary,
      parentDocumentId,
      categoryId,
    } = body;

    // RBAC controls
    const roles = session.user.roles || [];
    const isAdmin = roles.includes('Admin') || roles.includes('Super Admin');
    const isOwner = document.ownerId.toString() === userId;

    if (document.visibility === 'private' && !isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'Unauthorized modification' },
        { status: 403 }
      );
    }

    // Determine if content changed to compile a new revision history snapshot
    const contentChanged = content !== undefined && content !== document.content;

    if (title) {
      document.title = title;
      document.slug =
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || 'untitled';
    }
    if (icon !== undefined) document.icon = icon;
    if (coverImage !== undefined) document.coverImage = coverImage;
    if (content !== undefined) document.content = content;
    if (visibility !== undefined) document.visibility = visibility;
    if (status !== undefined) document.status = status;
    if (isTemplate !== undefined) document.isTemplate = isTemplate;
    if (isSop !== undefined) document.isSop = isSop;
    if (tags !== undefined) document.tags = tags;

    if (parentDocumentId !== undefined) {
      if (parentDocumentId === documentId) {
        return NextResponse.json(
          { success: false, error: 'API_ERROR', message: 'A page cannot be its own parent.' },
          { status: 400 }
        );
      }
      if (parentDocumentId) {
        let currentParentId = parentDocumentId;
        const seenIds = new Set<string>([documentId]);
        while (currentParentId) {
          if (seenIds.has(currentParentId)) {
            return NextResponse.json(
              {
                success: false,
                error: 'API_ERROR',
                message: 'Circular parent page reference detected.',
              },
              { status: 400 }
            );
          }
          seenIds.add(currentParentId);
          const parentDoc = await Document.findById(currentParentId)
            .select('parentDocumentId')
            .lean();
          if (!parentDoc) break;
          currentParentId = parentDoc.parentDocumentId ? parentDoc.parentDocumentId.toString() : '';
        }
        document.parentDocumentId = parentDocumentId;
      } else {
        document.parentDocumentId = null;
      }
    }

    if (categoryId !== undefined) {
      document.categoryId = categoryId || null;
    }

    if (contentChanged) {
      document.versionsCount = (document.versionsCount || 1) + 1;
    }

    await document.save();

    // Create a new Version Checkpoint if content changed
    if (contentChanged) {
      const version = new DocumentVersion({
        documentId: document._id,
        editorId: userId,
        title: document.title,
        content: document.content,
        changeSummary: changeSummary || 'Content updated',
        versionNumber: document.versionsCount,
      });
      await version.save();
    }

    // Create Knowledge activity log
    const activity = new KnowledgeActivity({
      companyId,
      userId,
      documentId: document._id,
      spaceId: document.spaceId,
      action: 'edited',
      details: changeSummary
        ? `Updated document "${document.title}": ${changeSummary}`
        : `Updated document: "${document.title}"`,
    });
    await activity.save();

    logger.info(`[Document PUT] Document "${document.title}" modified.`, { companyId, userId });

    const updatedDocument = await Document.findById(document._id)
      .populate('ownerId', 'name email')
      .populate('spaceId', 'name visibility')
      .populate('categoryId', 'name colorCode')
      .lean();

    // Broadcast SSE update
    broadcastEvent({
      companyId,
      event: 'document_updated',
      payload: updatedDocument,
    });

    return NextResponse.json({ success: true, data: updatedDocument });
  } catch (error: any) {
    logger.error('Failed to update document:', error, { companyId: session?.user?.companyId });
    return apiErrorResponse(error);
  }
});

export const DELETE = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const documentId = context.params.id;

    const document = await Document.findOne({ _id: documentId, companyId, deletedAt: null });
    if (!document) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'Document not found' },
        { status: 404 }
      );
    }

    // RBAC delete authorization check
    const roles = session.user.roles || [];
    const isAdmin = roles.includes('Admin') || roles.includes('Super Admin');
    const isOwner = document.ownerId.toString() === userId;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'Delete access denied' },
        { status: 403 }
      );
    }

    const deleteTime = new Date();

    // Soft delete target document
    document.deletedAt = deleteTime;
    await document.save();

    // Recursive Soft Delete: Purge all nested children sub-pages
    const recursiveDelete = async (parentId: string) => {
      const children = await Document.find({ parentDocumentId: parentId, deletedAt: null });
      for (const child of children) {
        child.deletedAt = deleteTime;
        await child.save();
        await recursiveDelete(child._id.toString());
      }
    };
    await recursiveDelete(documentId);

    // Audit trace
    const activity = new KnowledgeActivity({
      companyId,
      userId,
      documentId: document._id,
      spaceId: document.spaceId,
      action: 'acknowledged', // Use acknowledge category for deletion action
      details: `Soft-deleted document: "${document.title}" (Cascaded recursive sub-pages deletion)`,
      severity: 'warning',
    });
    await activity.save();

    logger.info(`[Document DELETE] Document "${document.title}" soft deleted recursively.`, {
      companyId,
      userId,
    });

    // Broadcast SSE update
    broadcastEvent({
      companyId,
      event: 'document_deleted',
      payload: { documentId },
    });

    return NextResponse.json({
      success: true,
      message: 'Document successfully soft-deleted along with children sub-pages',
    });
  } catch (error: any) {
    logger.error('Failed to soft delete document:', error, { companyId: session?.user?.companyId });
    return apiErrorResponse(error);
  }
});
