import { NextResponse } from 'next/server';
import { requirePortalAuth } from '@/lib/auth/portal';
import { connectToDatabase } from '@/lib/db/mongodb';
import { SupportTicket } from '@/models/SupportTicket';
import { ClientPortalAuditLog } from '@/models/ClientPortalAuditLog';
import { z } from 'zod';

const createTicketSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  category: z.enum(['billing', 'technical', 'bug', 'feature-request', 'general']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
});

export async function GET() {
  try {
    await connectToDatabase();

    const session = await requirePortalAuth();
    const { clientId, companyId } = session.user;

    const tickets = await SupportTicket.find({
      companyId,
      clientId,
    }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: tickets });
  } catch (error: any) {
    console.error('Portal Support GET Error:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: 'QUERY_ERROR', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const session = await requirePortalAuth();
    const { id: portalUserId, name: portalUserName, clientId, companyId } = session.user;

    const body = await request.json();
    const parsed = createTicketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { title, category, description, priority } = parsed.data;

    // SLA Calculations: Low/Med = 48 hours, High = 24 hours, Urgent = 4 hours
    let slaHours = 48;
    if (priority === 'high') slaHours = 24;
    else if (priority === 'urgent') slaHours = 4;

    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    const ticket = new SupportTicket({
      companyId,
      clientId,
      portalUserId,
      title,
      category,
      description,
      priority,
      status: 'open',
      slaDeadline,
    });

    await ticket.save();

    // Audit log ticket creation
    await ClientPortalAuditLog.create({
      companyId,
      clientId,
      portalUserId,
      portalUserName,
      eventType: 'create_ticket',
      severity: 'info',
      actionDetails: `Client Portal user "${portalUserName}" created support ticket: "${title}" (Priority: ${priority}, SLA: ${slaHours}h).`,
    });

    return NextResponse.json({ success: true, data: ticket }, { status: 201 });
  } catch (error: any) {
    console.error('Portal Support POST Error:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
