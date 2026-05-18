import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Message, CollaborationActivity } from '@/models';
import { broadcastEvent } from '@/lib/realtime';

export const PUT = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const messageId = context.params?.id;
    const body = await request.json();

    const { content } = body;
    if (!content) {
      return NextResponse.json({ success: false, message: 'Content required' }, { status: 400 });
    }

    const message = await Message.findOne({ _id: messageId, companyId });
    if (!message) {
      return NextResponse.json({ success: false, message: 'Message not found' }, { status: 404 });
    }

    // Owner protection checks
    if (message.senderId.toString() !== userId) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    message.content = content;
    message.editedAt = new Date();
    await message.save();

    const populated = await Message.findById(messageId)
      .populate('senderId', '_id name email avatarUrl')
      .lean();

    // Broadcast SSE update
    broadcastEvent({
      companyId,
      event: 'message_updated',
      payload: populated,
    });

    return NextResponse.json({ success: true, data: populated });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});

export const DELETE = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const messageId = context.params?.id;

    const message = await Message.findOne({ _id: messageId, companyId });
    if (!message) {
      return NextResponse.json({ success: false, message: 'Message not found' }, { status: 404 });
    }

    // Owner verification checks
    if (message.senderId.toString() !== userId) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // Soft delete to protect thread continuity
    message.content = 'This message has been deleted.';
    message.deletedAt = new Date();
    await message.save();

    // Broadcast delete event
    broadcastEvent({
      companyId,
      event: 'message_deleted',
      payload: { _id: messageId },
    });

    return NextResponse.json({ success: true, message: 'Message deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});
