import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { SupportTicket } from '@/models/SupportTicket';
import { Client } from '@/models/Client';
import { ClientPortalUser } from '@/models/ClientPortalUser';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    await connectToDatabase();
    Client.schema;
    ClientPortalUser.schema;

    const ticket = await SupportTicket.findOne({
      _id: resolvedParams.id,
      companyId: session.user.companyId,
    })
      .populate('clientId', 'name')
      .populate('portalUserId', 'name email')
      .lean();

    if (!ticket) {
      return NextResponse.json({ success: false, error: 'NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: ticket });
  } catch (error: any) {
    console.error('Support ticket GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId || !session?.user?.id) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();
    await connectToDatabase();

    const updates: any = {};
    if (body.status) {
      updates.status = body.status;
      if (body.status === 'resolved' || body.status === 'closed') {
        updates.resolvedAt = new Date();
      } else {
        updates.resolvedAt = null;
      }
    }

    // Auto-assign to current user if not assigned and status is changing to in-progress
    if (body.status === 'in-progress') {
      const existing = await SupportTicket.findById(resolvedParams.id);
      if (existing && !existing.assigneeId) {
        updates.assigneeId = session.user.id;
        updates.assigneeName = session.user.name || 'Admin';
      }
    }

    const ticket = await SupportTicket.findOneAndUpdate(
      { _id: resolvedParams.id, companyId: session.user.companyId },
      { $set: updates },
      { new: true }
    );

    if (!ticket) {
      return NextResponse.json({ success: false, error: 'NOT_FOUND' }, { status: 404 });
    }

    // Attempt to notify client portal realtime server if it's connected
    // This makes the portal support page update automatically
    fetch(`http://localhost:${process.env.PORT || 3000}/api/portal/realtime`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ticket_update',
        portalUserId: ticket.portalUserId,
        data: ticket,
      }),
    }).catch(() => {}); // ignore errors if realtime server fails

    return NextResponse.json({ success: true, data: ticket });
  } catch (error: any) {
    console.error('Support ticket PATCH error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
