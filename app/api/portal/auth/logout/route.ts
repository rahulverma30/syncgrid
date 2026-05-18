import { NextResponse } from 'next/server';
import { clearPortalSessionCookie, getPortalSession } from '@/lib/auth/portal';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ClientPortalAuditLog } from '@/models/ClientPortalAuditLog';

export async function POST() {
  try {
    await connectToDatabase();
    const session = await getPortalSession();

    if (session) {
      // Audit log the logout
      await ClientPortalAuditLog.create({
        companyId: session.user.companyId,
        clientId: session.user.clientId,
        portalUserId: session.user.id,
        portalUserName: session.user.name,
        eventType: 'logout',
        severity: 'info',
        actionDetails: `Client Portal user "${session.user.name}" successfully logged out.`,
      });
    }

    await clearPortalSessionCookie();

    return NextResponse.json({ success: true, message: 'Logged out successfully.' });
  } catch (error: any) {
    console.error('Portal Logout API Error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
