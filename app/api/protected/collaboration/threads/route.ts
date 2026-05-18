import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Thread, Message } from '@/models';
import { broadcastEvent } from '@/lib/realtime';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    const url = new URL(request.url);
    const parentMessageId = url.searchParams.get('parentMessageId');

    if (!parentMessageId) {
      return NextResponse.json(
        { success: false, message: 'parentMessageId is required' },
        { status: 400 }
      );
    }

    let thread = await Thread.findOne({ companyId, parentMessageId })
      .populate('replies.senderId', '_id name email avatarUrl')
      .lean();

    if (!thread) {
      // Return empty list if no thread has been created yet
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({ success: true, data: thread.replies });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const userName = session.user.name;
    const body = await request.json();

    const { parentMessageId, content, attachments } = body;
    if (!parentMessageId || !content) {
      return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
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

    // 2. Increment parent message reply count
    const parentMsg = await Message.findOne({ _id: parentMessageId, companyId });
    if (parentMsg) {
      parentMsg.replyCount = (parentMsg.replyCount || 0) + 1;
      await parentMsg.save();
    }

    // Populate reply sender details
    const populatedThread = await Thread.findById(thread._id)
      .populate('replies.senderId', '_id name email avatarUrl')
      .lean();

    const latestReply = populatedThread.replies[populatedThread.replies.length - 1];

    // Broadcast realtime update
    broadcastEvent({
      companyId,
      event: 'thread_reply_posted',
      payload: {
        parentMessageId,
        reply: latestReply,
        replyCount: parentMsg?.replyCount || 1,
      },
    });

    return NextResponse.json({ success: true, data: latestReply });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});
