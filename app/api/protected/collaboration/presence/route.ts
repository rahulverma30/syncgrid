import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { PresenceEngine } from '@/lib/presence';
import { broadcastEvent } from '@/lib/realtime';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    // Use fast in-memory / cache-aware Presence Engine
    const presenceMap = await PresenceEngine.getActivePresence(companyId);

    return NextResponse.json({ success: true, data: presenceMap });
  } catch (error: any) {
    return apiErrorResponse(error);
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
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'Status is required' },
        { status: 400 }
      );
    }

    // Set user presence using high-scale abstraction
    const updatedSession = await PresenceEngine.setUserPresence(
      companyId,
      userId,
      status,
      currentChannelId
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

    return NextResponse.json({ success: true, data: updatedSession });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
