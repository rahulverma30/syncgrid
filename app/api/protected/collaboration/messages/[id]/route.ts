import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Message, CollaborationActivity } from '@/models';
import { broadcastEvent } from '@/lib/realtime';
import { hasRole } from '@/lib/auth/permission-checks';
import { logger } from '@/lib/logger';
import { ThreadConsistencyEngine } from '@/lib/threadReconciliation';

export const PUT = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const userName = session.user.name;
    const roles = session.user.roles || [];
    const messageId = context.params?.id;
    const body = await request.json();

    const { content, reason } = body;
    if (!content) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'Content required' },
        { status: 400 }
      );
    }

    const message = await Message.findOne({ _id: messageId, companyId });
    if (!message) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'Message not found' },
        { status: 404 }
      );
    }

    // Role-Aware Moderation bypass
    const isOwner = message.senderId.toString() === userId;
    const isModerator = hasRole(roles, ['Super Admin', 'Admin']);

    if (!isOwner && !isModerator) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'Forbidden' },
        { status: 403 }
      );
    }

    const oldContent = message.content;
    message.content = content;
    message.editedAt = new Date();
    await message.save();

    const populated = await Message.findById(messageId)
      .populate('senderId', '_id name email avatarUrl')
      .lean();

    // Audit trace logging
    logger.info(
      `[Message PUT] Edited message ${messageId}. By owner: ${isOwner}, Moderator: ${isModerator}`,
      {
        companyId,
        userId,
      }
    );

    if (isModerator && !isOwner) {
      const auditLog = new CollaborationActivity({
        companyId,
        userId,
        type: 'message_sent',
        targetId: message._id,
        description: `MODERATION OVERRIDE: Admin ${userName} edited message from sender ID ${message.senderId} due to: ${reason || 'Corporate guidelines review'}. Original text: "${oldContent}"`,
      });
      await auditLog.save();
    }

    // Broadcast SSE update
    broadcastEvent({
      companyId,
      event: 'message_updated',
      payload: populated,
    });

    return NextResponse.json({ success: true, data: populated });
  } catch (error: any) {
    logger.error('Failed to update message:', error, { companyId: session?.user?.companyId });
    return NextResponse.json(
      { success: false, error: 'API_ERROR', message: error.message },
      { status: 500 }
    );
  }
});

export const DELETE = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const userName = session.user.name;
    const roles = session.user.roles || [];
    const messageId = context.params?.id;

    const message = await Message.findOne({ _id: messageId, companyId });
    if (!message) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'Message not found' },
        { status: 404 }
      );
    }

    // Role-Aware Moderation bypass
    const isOwner = message.senderId.toString() === userId;
    const isModerator = hasRole(roles, ['Super Admin', 'Admin']);

    if (!isOwner && !isModerator) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'Forbidden' },
        { status: 403 }
      );
    }

    // Soft delete to protect thread continuity
    message.content = 'This message has been deleted by moderation guidelines.';
    message.deletedAt = new Date();
    await message.save();

    logger.info(
      `[Message DELETE] Deleted message ${messageId}. By owner: ${isOwner}, Moderator: ${isModerator}`,
      {
        companyId,
        userId,
      }
    );

    if (isModerator && !isOwner) {
      const auditLog = new CollaborationActivity({
        companyId,
        userId,
        type: 'message_sent',
        targetId: message._id,
        description: `MODERATION OVERRIDE: Admin ${userName} deleted message from sender ID ${message.senderId}.`,
      });
      await auditLog.save();
    }

    // Automatically trigger thread count integrity reconciliation
    await ThreadConsistencyEngine.reconcileThreadReplyCount(companyId, messageId);

    // Broadcast delete event
    broadcastEvent({
      companyId,
      event: 'message_deleted',
      payload: { _id: messageId },
    });

    return NextResponse.json({ success: true, message: 'Message deleted successfully' });
  } catch (error: any) {
    logger.error('Failed message deletion:', error, { companyId: session?.user?.companyId });
    return NextResponse.json(
      { success: false, error: 'API_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
