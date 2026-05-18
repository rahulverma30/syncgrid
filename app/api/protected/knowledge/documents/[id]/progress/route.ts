import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Document, ReadingProgress, KnowledgeActivity } from '@/models';
import { broadcastEvent } from '@/lib/realtime';
import { logger } from '@/lib/logger';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const documentId = context.params.id;

    const progress = await ReadingProgress.findOne({ companyId, userId, documentId }).lean();
    return NextResponse.json({ success: true, data: progress });
  } catch (error: any) {
    logger.error('Failed to get reading progress:', error, { companyId: session?.user?.companyId });
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const documentId = context.params.id;

    const document = await Document.findOne({ _id: documentId, companyId, deletedAt: null });
    if (!document) {
      return NextResponse.json({ success: false, message: 'Document not found' }, { status: 404 });
    }

    const progress = await ReadingProgress.findOneAndUpdate(
      { companyId, userId, documentId },
      {
        companyId,
        userId,
        documentId,
        completedAt: new Date(),
        percentViewed: 100,
        acknowledged: true,
      },
      { upsert: true, new: true }
    );

    // Create central audit activity log
    const activity = new KnowledgeActivity({
      companyId,
      userId,
      documentId,
      spaceId: document.spaceId,
      action: 'acknowledged',
      details: `Acknowledged policy/SOP reading for document: "${document.title}"`,
    });
    await activity.save();

    logger.info(
      `[Document Progress POST] User ${userId} acknowledged reading document "${document.title}".`,
      { companyId }
    );

    // Broadcast updated progress metrics
    broadcastEvent({
      companyId,
      event: 'document_progress_submitted',
      payload: { userId, documentId, progress },
    });

    return NextResponse.json({ success: true, data: progress });
  } catch (error: any) {
    logger.error('Failed to update reading progress:', error, {
      companyId: session?.user?.companyId,
    });
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});
