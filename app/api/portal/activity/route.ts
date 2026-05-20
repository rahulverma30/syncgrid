import { NextResponse } from 'next/server';
import { requirePortalAuth } from '@/lib/auth/portal';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ExternalActivityLog } from '@/models/ExternalActivityLog';

export async function GET() {
  try {
    await connectToDatabase();
    const session = await requirePortalAuth();
    const { id: portalUserId, name: portalUserName, clientId, companyId } = session.user;

    let logs = await ExternalActivityLog.find({
      companyId,
      clientId,
    }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    console.error('Activity GET Error:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: 'QUERY_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
