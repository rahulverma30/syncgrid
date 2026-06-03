import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Document, KnowledgeActivity } from '@/models';
import { broadcastEvent } from '@/lib/realtime';
import { logger } from '@/lib/logger';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const documentId = context.params.id;

    const document = await Document.findOne({ _id: documentId, companyId, deletedAt: null })
      .populate('comments.senderId', 'name email')
      .lean();

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: document.comments || [] });
  } catch (error: any) {
    logger.error('Failed to get comments:', error, { companyId: session?.user?.companyId });
    return NextResponse.json(
      { success: false, error: 'API_ERROR', message: error.message },
      { status: 500 }
    );
  }
});

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const documentId = context.params.id;
    const body = await request.json();

    const { content } = body;
    if (!content) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'Comment content is required' },
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

    const newComment = {
      senderId: userId,
      content,
      createdAt: new Date(),
    };

    document.comments.push(newComment);
    await document.save();

    // Create central audit activity log
    const activity = new KnowledgeActivity({
      companyId,
      userId,
      documentId: document._id,
      spaceId: document.spaceId,
      action: 'commented',
      details: `Added a comment on document: "${document.title}"`,
    });
    await activity.save();

    const updatedDocument = await Document.findById(document._id)
      .populate('ownerId', 'name email')
      .populate('spaceId', 'name visibility')
      .populate('categoryId', 'name colorCode')
      .populate('comments.senderId', 'name email')
      .lean();

    // Broadcast updated comment state
    broadcastEvent({
      companyId,
      event: 'document_updated',
      payload: updatedDocument,
    });

    return NextResponse.json({ success: true, data: updatedDocument.comments });
  } catch (error: any) {
    logger.error('Failed to add comment:', error, { companyId: session?.user?.companyId });
    return NextResponse.json(
      { success: false, error: 'API_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
