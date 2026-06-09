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

    // Security Gate check
    const document = await Document.findOne({ _id: documentId, companyId, deletedAt: null })
      .select('_id')
      .lean();
    if (!document) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'Document not found' },
        { status: 404 }
      );
    }

    const versions = await DocumentVersion.find({ documentId })
      .select('-content')
      .populate('editorId', 'name email')
      .sort({ versionNumber: -1 })
      .lean();

    return NextResponse.json({ success: true, data: versions });
  } catch (error: any) {
    logger.error('Failed to get versions:', error, { companyId: session?.user?.companyId });
    return apiErrorResponse(error);
  }
});

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const documentId = context.params.id;
    const body = await request.json();

    const { versionNumber } = body;
    if (!versionNumber) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'Version number to restore is required' },
        { status: 400 }
      );
    }

    const document = await Document.findOne({ _id: documentId, companyId, deletedAt: null });
    if (!document) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'Document not found' },
        { status: 404 }
      );
    }

    const version = await DocumentVersion.findOne({ documentId, versionNumber });
    if (!version) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'Specified version log not found' },
        { status: 404 }
      );
    }

    // Rollback current document parameters
    document.title = version.title;
    document.content = version.content;
    document.versionsCount = (document.versionsCount || 1) + 1;
    await document.save();

    // Create a new version checkpoint for the rollback event itself
    const newCheckpoint = new DocumentVersion({
      documentId: document._id,
      editorId: userId,
      title: document.title,
      content: document.content,
      changeSummary: `Restored to version ${versionNumber} ("${version.changeSummary}")`,
      versionNumber: document.versionsCount,
    });
    await newCheckpoint.save();

    // Write audit trail log
    const activity = new KnowledgeActivity({
      companyId,
      userId,
      documentId: document._id,
      spaceId: document.spaceId,
      action: 'version_restored',
      details: `Rolled back document "${document.title}" to version ${versionNumber}`,
    });
    await activity.save();

    logger.info(`[Document Rollback] Document "${document.title}" restored to V${versionNumber}.`, {
      companyId,
      userId,
    });

    const updatedDocument = await Document.findById(document._id)
      .populate('ownerId', 'name email')
      .populate('spaceId', 'name visibility')
      .populate('categoryId', 'name colorCode')
      .lean();

    // Broadcast updated document state
    broadcastEvent({
      companyId,
      event: 'document_updated',
      payload: updatedDocument,
    });

    return NextResponse.json({ success: true, data: updatedDocument, checkpoint: newCheckpoint });
  } catch (error: any) {
    logger.error('Failed to rollback document:', error, { companyId: session?.user?.companyId });
    return apiErrorResponse(error);
  }
});
