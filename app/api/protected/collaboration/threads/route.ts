import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Thread, Message } from '@/models';
import { broadcastEvent } from '@/lib/realtime';
import { ThreadConsistencyEngine } from '@/lib/threadReconciliation';
import { logger } from '@/lib/logger';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    const url = new URL(request.url);
    const parentMessageId = url.searchParams.get('parentMessageId');

    if (!parentMessageId) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'parentMessageId is required' },
        { status: 400 }
      );
    }

    const thread = await Thread.findOne({ companyId, parentMessageId })
      .populate('replies.senderId', '_id name email avatarUrl')
      .lean();

    if (!thread) {
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({ success: true, data: thread.replies });
  } catch (error: any) {
    logger.error('Failed to load thread replies:', error, { companyId: session?.user?.companyId });
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
    const body = await request.json();

    const { parentMessageId, content, attachments } = body;
    if (!parentMessageId || !content) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'Missing parameters' },
        { status: 400 }
      );
    }

    // 1. Locate or create thread definition
    let thread = await Thread.findOne({ companyId, parentMessageId });
    if (!thread) {
      thread = new Thread({
        companyId,
        parentMessageId,
        replies: [],
        participants: [],
      });
    }

    const replyObject = {
      senderId: userId,
      content,
      attachments: attachments || [],
      createdAt: new Date(),
    };

    thread.replies.push(replyObject);
    if (!thread.participants.includes(userId)) {
      thread.participants.push(userId);
    }
    await thread.save();

    // 2. Perform atomic parent-child integrity reconciliation
    const activeReplyCount = await ThreadConsistencyEngine.reconcileThreadReplyCount(
      companyId,
      parentMessageId
    );

    // Populate reply sender details
    const populatedThread = await Thread.findById(thread._id)
      .populate('replies.senderId', '_id name email avatarUrl')
      .lean();

    const latestReply = populatedThread.replies[populatedThread.replies.length - 1];

    logger.info(
      `[Thread POST] Reply created on parent message ${parentMessageId}. Active count: ${activeReplyCount}`,
      {
        companyId,
        userId,
      }
    );

    // Broadcast realtime update
    broadcastEvent({
      companyId,
      event: 'thread_reply_posted',
      payload: {
        parentMessageId,
        reply: latestReply,
        replyCount: activeReplyCount,
      },
    });

    return NextResponse.json({ success: true, data: latestReply });
  } catch (error: any) {
    logger.error('Failed to create thread reply:', error, { companyId: session?.user?.companyId });
    return NextResponse.json(
      { success: false, error: 'API_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
