import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Message, CollaborationActivity, Reaction } from '@/models';
import { broadcastEvent } from '@/lib/realtime';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    const url = new URL(request.url);
    const channelId = url.searchParams.get('channelId');
    const conversationId = url.searchParams.get('conversationId');

    if (!channelId && !conversationId) {
      return NextResponse.json(
        { success: false, message: 'channelId or conversationId required' },
        { status: 400 }
      );
    }

    let filter: any = { companyId };
    if (channelId) {
      filter.channelId = channelId;
    } else {
      filter.conversationId = conversationId;
    }

    // Retrieve last 100 messages to prevent heavy payload lists
    const messages = await Message.find(filter)
      .populate('senderId', '_id name email avatarUrl')
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    // Map each message to include its reactions list
    const enrichedMessages = await Promise.all(
      messages.map(async (msg) => {
        const rawReactions = await Reaction.find({ messageId: msg._id })
          .populate('userId', '_id name')
          .lean();

        // Group reactions by emoji character
        const grouped = rawReactions.reduce((acc: any[], current: any) => {
          const group = acc.find((g) => g.emoji === current.emoji);
          if (group) {
            group.users.push({ _id: current.userId._id, name: current.userId.name });
          } else {
            acc.push({
              emoji: current.emoji,
              users: [{ _id: current.userId._id, name: current.userId.name }],
            });
          }
          return acc;
        }, []);

        return {
          ...msg,
          reactions: grouped,
        };
      })
    );

    return NextResponse.json({ success: true, data: enrichedMessages });
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

    const { channelId, conversationId, contentType, content, attachments } = body;
    if (!content) {
      return NextResponse.json({ success: false, message: 'Content is required' }, { status: 400 });
    }

    const created = new Message({
      companyId,
      senderId: userId,
      channelId,
      conversationId,
      contentType: contentType || 'text',
      content,
      attachments: attachments || [],
    });

    await created.save();

    // Populate sender metadata before returning/broadcasting
    const populated = await Message.findById(created._id)
      .populate('senderId', '_id name email avatarUrl')
      .lean();

    const responseData = {
      ...populated,
      reactions: [],
    };

    // Centralized Audit Log
    const auditLog = new CollaborationActivity({
      companyId,
      userId,
      type: 'message_sent',
      targetId: created._id,
      description: `User ${userName} sent a collaboration message in ${channelId ? 'channel ' + channelId : 'direct chat'}`,
    });
    await auditLog.save();

    // Realtime Broadcast Event via SSE (lib/realtime.ts)
    broadcastEvent({
      companyId,
      event: 'message_posted',
      payload: responseData,
    });

    // Also push a global notification if user has @mentions or if it's a DM
    if (conversationId) {
      broadcastEvent({
        companyId,
        event: 'alert_notification',
        payload: {
          title: `New Direct Message from ${userName} 💬`,
          message: content.length > 50 ? `${content.substring(0, 50)}...` : content,
          type: 'info',
        },
      });
    }

    return NextResponse.json({ success: true, data: responseData });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});
