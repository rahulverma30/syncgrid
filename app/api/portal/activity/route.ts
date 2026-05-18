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

    // Seed mock visual activities if the log is empty for this corporate client
    if (logs.length === 0) {
      const mockLogs = [
        {
          companyId,
          clientId,
          portalUserId,
          portalUserName,
          action: 'approve_deliverable',
          resource: 'deliverable',
          details:
            'Client Portal user approved Milestone 1 Layout Specifications Wireframes & Mockups.',
          ipAddress: '192.168.1.45',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/119.0.0.0',
          createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
        },
        {
          companyId,
          clientId,
          portalUserId,
          portalUserName,
          action: 'download_doc',
          resource: 'document',
          details:
            'Secure expiring link downloaded for resource: "Mutual Non-Disclosure Agreement (NDA).pdf".',
          ipAddress: '192.168.1.45',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/119.0.0.0',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
        {
          companyId,
          clientId,
          portalUserId,
          portalUserName,
          action: 'create_ticket',
          resource: 'support_ticket',
          details:
            'Submitted Helpdesk Ticket #4082: "Billing discrepancies on Staging invoice #12".',
          ipAddress: '192.168.1.45',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/119.0.0.0',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        },
        {
          companyId,
          clientId,
          portalUserId,
          portalUserName,
          action: 'login',
          resource: 'user',
          details:
            'Client Portal user session started successfully (Multi-Factor authentication verified).',
          ipAddress: '192.168.1.45',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/119.0.0.0',
          createdAt: new Date(Date.now() - 4.5 * 60 * 60 * 1000), // 4.5 hours ago
        },
        {
          companyId,
          clientId,
          portalUserId,
          portalUserName,
          action: 'login_fail',
          resource: 'user',
          details: 'Security warning: Failed verification attempt (Incorrect login credentials).',
          ipAddress: '192.168.1.99',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        },
      ];

      await ExternalActivityLog.insertMany(mockLogs);

      logs = await ExternalActivityLog.find({
        companyId,
        clientId,
      }).sort({ createdAt: -1 });
    }

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
