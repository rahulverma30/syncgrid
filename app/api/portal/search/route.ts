import { NextResponse } from 'next/server';
import { requirePortalAuth } from '@/lib/auth/portal';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Project } from '@/models/Project';
import { Invoice } from '@/models/Invoice';
import { SupportTicket } from '@/models/SupportTicket';
import { ClientApprovalRequest } from '@/models/ClientApprovalRequest';
import { SharedDocument } from '@/models/SharedDocument';
import { Document } from '@/models/Document';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const session = await requirePortalAuth();
    const { clientId, companyId } = session.user;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query.trim()) {
      return NextResponse.json({ success: true, data: [] });
    }

    const regex = new RegExp(query, 'i');
    const results: any[] = [];

    // 1. Search Client Scoped Projects
    const projects = await Project.find({
      companyId,
      clientId,
      $or: [{ name: regex }, { description: regex }],
    }).limit(5);

    projects.forEach((p) => {
      results.push({
        id: p._id.toString(),
        type: 'project',
        title: p.name,
        subtitle: `Project • Status: ${p.status || 'Active'}`,
        status: p.status,
        href: `/portal/projects`,
        updatedAt: p.updatedAt || p.createdAt,
      });
    });

    // 2. Search Client Scoped Invoices
    const invoices = await Invoice.find({
      companyId,
      clientId,
      $or: [{ invoiceNumber: regex }, { status: regex }],
    }).limit(5);

    invoices.forEach((inv) => {
      results.push({
        id: inv._id.toString(),
        type: 'invoice',
        title: `Invoice #${inv.invoiceNumber || inv._id.toString().substring(0, 6)}`,
        subtitle: `Invoice • Amount: $${inv.total || 0} • Status: ${inv.status}`,
        status: inv.status,
        href: `/portal`, // Back to billing overview on landing dashboard
        updatedAt: inv.updatedAt || inv.createdAt,
      });
    });

    // 3. Search Support Tickets
    const tickets = await SupportTicket.find({
      companyId,
      clientId,
      $or: [{ title: regex }, { description: regex }],
    }).limit(5);

    tickets.forEach((t) => {
      results.push({
        id: t._id.toString(),
        type: 'support',
        title: t.title,
        subtitle: `Support Ticket • Priority: ${t.priority} • Status: ${t.status}`,
        status: t.status,
        href: `/portal/support`,
        updatedAt: t.updatedAt || t.createdAt,
      });
    });

    // 4. Search Approval Requests
    const approvals = await ClientApprovalRequest.find({
      companyId,
      clientId,
      $or: [{ title: regex }, { description: regex }],
    }).limit(5);

    approvals.forEach((appr) => {
      results.push({
        id: appr._id.toString(),
        type: 'approval',
        title: appr.title,
        subtitle: `Approval • Type: ${appr.type} • Status: ${appr.status}`,
        status: appr.status,
        href: `/portal/approvals`,
        updatedAt: appr.updatedAt || appr.createdAt,
      });
    });

    // 5. Search Shared Documents
    const sharedDocs = await SharedDocument.find({
      companyId,
      clientId,
    }).populate({
      path: 'documentId',
      model: Document,
    });

    const matchingDocs = sharedDocs.filter((sd) => {
      if (!sd.documentId) return false;
      const doc = sd.documentId;
      return regex.test(doc.name) || (doc.category && regex.test(doc.category));
    });

    matchingDocs.slice(0, 5).forEach((sd) => {
      results.push({
        id: sd._id.toString(),
        type: 'document',
        title: sd.documentId.name,
        subtitle: `Document • Category: ${sd.documentId.category || 'general'}`,
        status: sd.isDownloadable ? 'Downloadable' : 'Preview Only',
        href: `/portal/documents`,
        updatedAt: sd.updatedAt || sd.createdAt,
      });
    });

    // Sort results by similarity (recency as a simple secondary sorter)
    results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    console.error('Unified Search GET Error:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
