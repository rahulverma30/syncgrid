import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Reaction, Message } from '@/models';
import { broadcastEvent } from '@/lib/realtime';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const userName = session.user.name;
    const body = await request.json();

    const { messageId, emoji } = body;
    if (!messageId || !emoji) {
      return NextResponse.json(
        { success: false, message: 'messageId and emoji are required' },
        { status: 400 }
      );
    }

    // Toggle logic: Check if reaction already exists
    const existing = await Reaction.findOne({ companyId, messageId, userId, emoji });

    if (existing) {
      await Reaction.deleteOne({ _id: existing._id });
    } else {
      const newReaction = new Reaction({
        companyId,
        messageId,
        userId,
        emoji,
      });
      await newReaction.save();
    }

    // Get all reactions for this message to build the grouped response payload
    const allReactions = await Reaction.find({ messageId }).populate('userId', '_id name').lean();

    const grouped = allReactions.reduce((acc: any[], current: any) => {
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

    // Broadcast update
    broadcastEvent({
      companyId,
      event: 'message_reaction_toggled',
      payload: {
        messageId,
        reactions: grouped,
      },
    });

    return NextResponse.json({ success: true, data: grouped });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});
