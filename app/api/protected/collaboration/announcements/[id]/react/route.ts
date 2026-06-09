import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Announcement } from '@/models';
import { broadcastEvent } from '@/lib/realtime';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const body = await request.json();
    const params = await context.params;

    const { id } = params;
    const { emoji } = body;

    if (!emoji) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'Emoji required' },
        { status: 400 }
      );
    }

    const ann = await Announcement.findOne({ _id: id, companyId });
    if (!ann) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Announcement not found' },
        { status: 404 }
      );
    }

    const existingReactionIndex = ann.reactions.findIndex(
      (r: any) => r.userId.toString() === userId.toString() && r.emoji === emoji
    );

    if (existingReactionIndex > -1) {
      // Toggle off
      ann.reactions.splice(existingReactionIndex, 1);
    } else {
      // Add reaction
      ann.reactions.push({ emoji, userId });
    }

    await ann.save();

    const populated = await Announcement.findById(ann._id)
      .populate('authorId', '_id name image')
      .populate('comments.authorId', '_id name image')
      .lean();

    // Broadcast update
    broadcastEvent({
      companyId,
      event: 'announcement_updated',
      payload: populated,
    });

    return NextResponse.json({ success: true, data: populated });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
