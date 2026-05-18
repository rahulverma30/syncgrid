import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Announcement } from '@/models';
import { broadcastEvent } from '@/lib/realtime';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    const list = await Announcement.find({ companyId })
      .populate('authorId', '_id name')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const body = await request.json();

    const { title, content, pinnedUntil } = body;
    if (!title || !content) {
      return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
    }

    const created = new Announcement({
      companyId,
      title,
      content,
      pinnedUntil,
      authorId: userId,
      acknowledgedBy: [],
    });

    await created.save();

    const populated = await Announcement.findById(created._id)
      .populate('authorId', '_id name')
      .lean();

    // Broadcast new announcement
    broadcastEvent({
      companyId,
      event: 'announcement_posted',
      payload: populated,
    });

    // Alert toast notification
    broadcastEvent({
      companyId,
      event: 'alert_notification',
      payload: {
        title: 'New Announcement Posted 📢',
        message: title,
        type: 'warning',
      },
    });

    return NextResponse.json({ success: true, data: populated });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});

// Acknowledge announcement
export const PUT = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const body = await request.json();

    const { announcementId } = body;
    if (!announcementId) {
      return NextResponse.json(
        { success: false, message: 'announcementId is required' },
        { status: 400 }
      );
    }

    const ann = await Announcement.findOne({ _id: announcementId, companyId });
    if (!ann) {
      return NextResponse.json(
        { success: false, message: 'Announcement not found' },
        { status: 404 }
      );
    }

    if (!ann.acknowledgedBy.includes(userId)) {
      ann.acknowledgedBy.push(userId);
      await ann.save();
    }

    return NextResponse.json({ success: true, data: ann });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});
