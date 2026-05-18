import { NextResponse } from 'next/server';
import { requirePortalAuth } from '@/lib/auth/portal';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ClientAnnouncement } from '@/models/ClientAnnouncement';

export async function GET() {
  try {
    await connectToDatabase();

    const session = await requirePortalAuth();
    const { clientId, companyId } = session.user;

    const now = new Date();

    // Retrieve announcements that are targeted to the client or broadcasted to everyone (empty targetClients)
    const announcements = await ClientAnnouncement.find({
      companyId,
      $and: [
        {
          $or: [{ targetClients: { $size: 0 } }, { targetClients: clientId }],
        },
        {
          $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
        },
      ],
    }).sort({ isPinned: -1, createdAt: -1 });

    return NextResponse.json({ success: true, data: announcements });
  } catch (error: any) {
    console.error('Portal Announcements GET Error:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: 'QUERY_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
