import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Message, CollaborationActivity, Reaction } from '@/models';
import { broadcastEvent } from '@/lib/realtime';
import { logger } from '@/lib/logger';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    const url = new URL(request.url);
    const channelId = url.searchParams.get('channelId');
    const conversationId = url.searchParams.get('conversationId');

    // Cursor Pagination configuration params
    const cursor = url.searchParams.get('cursor'); // ISO date string or timestamp
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

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

    // Cursor boundaries (load older messages backwards)
    if (cursor) {
      filter.createdAt = { $lt: new Date(cursor) };
    }

    logger.info(`[Messages GET] Fetching feed. Limit: ${limit}, Cursor: ${cursor}`, {
      companyId,
      channelId,
      conversationId,
    });

    // Query sorted descending (latest first) to correctly paginate backwards
    const messages = await Message.find(filter)
      .populate('senderId', '_id name email avatarUrl')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Reverse array to render chronologically (ascending) in frontend stream
    messages.reverse();

    // 1. ELIMINATE N+1 REACTION QUERIES: Batch fetch reactions in a single network trip
    const messageIds = messages.map((m) => m._id);
    const rawReactions = await Reaction.find({ messageId: { $in: messageIds } })
      .populate('userId', '_id name')
      .lean();

    // 2. Map and Group reactions in-memory O(N)
    const reactionsMap = rawReactions.reduce((acc: Record<string, any[]>, curr: any) => {
      const msgIdStr = curr.messageId.toString();
      if (!acc[msgIdStr]) {
        acc[msgIdStr] = [];
      }
      acc[msgIdStr].push(curr);
      return acc;
    }, {});

    // Hydrate messages in-memory with zero N+1 database query cycles
    const enrichedMessages = messages.map((msg) => {
      const msgReactions = reactionsMap[msg._id.toString()] || [];
      const grouped = msgReactions.reduce((acc: any[], current: any) => {
        if (!current.userId) return acc;
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
        // AI-ready semantic metadata slots (pre-calculated indices)
        aiMetadata: {
          sentiment: 'neutral',
          embeddingStatus: 'pending',
          summarizationIndex: 0,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedMessages,
      nextCursor: messages.length > 0 ? messages[0].createdAt : null, // Earliest timestamp in batch
    });
  } catch (error: any) {
    logger.error('Failed messages retrieval:', error, { companyId: session?.user?.companyId });
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
      aiMetadata: {
        sentiment: 'neutral',
        embeddingStatus: 'pending',
        summarizationIndex: 0,
      },
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

    logger.info(`[Message Post] Created message: ${created._id}`, { companyId, userId });

    // Realtime Broadcast Event via SSE (lib/realtime.ts)
    broadcastEvent({
      companyId,
      event: 'message_posted',
      payload: responseData,
    });

    // Push global notification if it's a DM
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
    logger.error('Failed to post collaboration message:', error, {
      companyId: session?.user?.companyId,
    });
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});
