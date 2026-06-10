import { NextResponse } from 'next/server';
import { requirePortalAuth } from '@/lib/auth/portal';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Invoice } from '@/models/Invoice';

export async function GET() {
  try {
    await connectToDatabase();

    const session = await requirePortalAuth();
    const { clientId, companyId } = session.user;

    const invoices = await Invoice.find({
      companyId,
      clientId,
      isArchived: false,
      isSoftDeleted: false,
      status: { $in: ['sent', 'partially_paid', 'paid', 'overdue'] }, // Hide drafts from client
    })
      .sort({ issueDate: -1 })
      .lean();

    return NextResponse.json({ success: true, data: invoices });
  } catch (error: any) {
    console.error('Portal Invoices GET Error:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: 'QUERY_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
