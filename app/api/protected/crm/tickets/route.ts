import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { SupportTicket } from '@/models/SupportTicket';
import { Client } from '@/models/Client';
import { ClientPortalUser } from '@/models/ClientPortalUser';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query: any = { companyId: session.user.companyId };
    if (status) {
      query.status = status;
    }

    // Ensure models are registered for populate
    Client.schema;
    ClientPortalUser.schema;

    const tickets = await SupportTicket.find(query)
      .populate('clientId', 'name')
      .populate('portalUserId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: tickets });
  } catch (error: any) {
    console.error('Support tickets GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
