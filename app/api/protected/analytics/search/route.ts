import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import mongoose from 'mongoose';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Project, Task, Client, Lead, Invoice, Deal } from '@/models';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    const regex = new RegExp(query, 'i');
    const filter = { companyId: new mongoose.Types.ObjectId(companyId), isArchived: false };

    // Parallel text search across core modules
    const [projects, tasks, clients, leads, invoices, deals] = await Promise.all([
      Project.find({ ...filter, name: regex })
        .select('name status code')
        .limit(5)
        .lean(),
      Task.find({ companyId, title: regex, isSoftDeleted: false })
        .select('title status priority')
        .limit(5)
        .lean(),
      Client.find({ ...filter, name: regex })
        .select('name industry')
        .limit(5)
        .lean(),
      Lead.find({ ...filter, $or: [{ firstName: regex }, { lastName: regex }, { company: regex }] })
        .select('firstName lastName company status')
        .limit(5)
        .lean(),
      Invoice.find({ companyId, invoiceNumber: regex, isSoftDeleted: false })
        .select('invoiceNumber status totalAmount')
        .limit(5)
        .lean(),
      Deal.find({ ...filter, name: regex })
        .select('name stage amount')
        .limit(5)
        .lean(),
    ]);

    const results: any[] = [];

    projects.forEach((p: any) =>
      results.push({
        id: p._id,
        title: p.name,
        type: 'Project',
        subtitle: p.status,
        link: `/projects?search=${encodeURIComponent(p.name)}`,
      })
    );
    tasks.forEach((t: any) =>
      results.push({
        id: t._id,
        title: t.title,
        type: 'Task',
        subtitle: t.status,
        link: `/projects/tasks`,
      })
    );
    clients.forEach((c: any) =>
      results.push({
        id: c._id,
        title: c.name,
        type: 'Client',
        subtitle: c.industry,
        link: `/crm/clients`,
      })
    );
    leads.forEach((l: any) =>
      results.push({
        id: l._id,
        title: `${l.firstName} ${l.lastName} (${l.company})`,
        type: 'Lead',
        subtitle: l.status,
        link: `/crm/leads`,
      })
    );
    invoices.forEach((i: any) =>
      results.push({
        id: i._id,
        title: i.invoiceNumber,
        type: 'Invoice',
        subtitle: i.status,
        link: `/finance/invoices`,
      })
    );
    deals.forEach((d: any) =>
      results.push({
        id: d._id,
        title: d.name,
        type: 'Deal',
        subtitle: d.stage,
        link: `/crm/pipeline`,
      })
    );

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
