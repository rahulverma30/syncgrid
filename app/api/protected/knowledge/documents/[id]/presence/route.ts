import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { broadcastEvent } from '@/lib/realtime';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Document } from '@/models';
import { logger } from '@/lib/logger';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const documentId = context.params.id;
    const body = await request.json();

    const { cursor, selection, typing, userName, userColor } = body;

    // Verify the document exists and belongs to the company (multi-tenant security lock)
    const docExists = await Document.exists({ _id: documentId, companyId, deletedAt: null });
    if (!docExists) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'Document not found' },
        { status: 404 }
      );
    }

    // Broadcast the cursor presence event
    broadcastEvent({
      companyId,
      documentId,
      event: 'cursor_presence_updated',
      payload: {
        documentId,
        userId,
        userName: userName || session.user.name || 'Anonymous Partner',
        userColor: userColor || '#10B981', // fallback emerald
        cursor: cursor || null,
        selection: selection || null,
        typing: !!typing,
        lastActiveAt: Date.now(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Failed to broadcast cursor presence:', error, {
      companyId: session?.user?.companyId,
    });
    return NextResponse.json(
      { success: false, error: 'API_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
