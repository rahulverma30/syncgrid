import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { PresenceSession } from '@/models';
import { broadcastEvent } from '@/lib/realtime';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    // Fetch presence sessions updated in the last 15 minutes to guarantee accuracy
    const activeTimeThreshold = new Date(Date.now() - 1000 * 60 * 15);
    const sessions = await PresenceSession.find({
      companyId,
      lastActiveAt: { $gte: activeTimeThreshold },
    }).lean();

    // Group presence state mapping (userId -> status)
    const map = sessions.reduce((acc: Record<string, string>, current: any) => {
      acc[current.userId.toString()] = current.status;
      return acc;
    }, {});

    return NextResponse.json({ success: true, data: map });
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

    const { status, currentChannelId } = body; // status: 'online' | 'offline' | 'away' | 'busy'
    if (!status) {
      return NextResponse.json({ success: false, message: 'Status is required' }, { status: 400 });
    }

    // Upsert user presence session
    const updated = await PresenceSession.findOneAndUpdate(
      { companyId, userId },
      {
        status,
        currentChannelId: currentChannelId || null,
        lastActiveAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Broadcast presence update event to all connected workspace clients
    broadcastEvent({
      companyId,
      event: 'presence_updated',
      payload: {
        userId,
        status,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});
