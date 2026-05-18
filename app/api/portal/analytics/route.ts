import { NextResponse } from 'next/server';
import { requirePortalAuth } from '@/lib/auth/portal';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ClientApprovalRequest } from '@/models/ClientApprovalRequest';
import { SupportTicket } from '@/models/SupportTicket';
import { Project } from '@/models/Project';
import { SharedInvoice } from '@/models/SharedInvoice';
import { Invoice } from '@/models/Invoice';

export async function GET() {
  try {
    await connectToDatabase();

    const session = await requirePortalAuth();
    const { clientId, companyId } = session.user;

    // 1. Projects Breakdown & Health Indicators
    const projects = await Project.find({
      companyId,
      clientId,
      isArchived: false,
    });

    const projectCount = projects.length;
    const avgHealthScore = projectCount
      ? Math.round(projects.reduce((acc, p) => acc + (p.healthScore || 0), 0) / projectCount)
      : 100;

    // 2. Approvals Summary
    const approvals = await ClientApprovalRequest.find({
      companyId,
      clientId,
    });

    const approvalCount = approvals.length;
    const pendingApprovalsCount = approvals.filter((a) => a.status === 'pending').length;
    const approvedCount = approvals.filter((a) => a.status === 'approved').length;

    // Average approval turnaround time (in hours)
    let totalTurnaroundHours = 0;
    let turnaroundsCount = 0;

    approvals.forEach((a: any) => {
      if (a.status === 'approved' || a.status === 'rejected') {
        const decisionHistory = a.history.filter(
          (h: any) => h.action === 'approved' || h.action === 'rejected'
        );
        if (decisionHistory.length > 0) {
          const creationDate = new Date(a.createdAt);
          const actionDate = new Date(decisionHistory[0].actedAt);
          const diffMs = actionDate.getTime() - creationDate.getTime();
          totalTurnaroundHours += diffMs / (1000 * 60 * 60);
          turnaroundsCount++;
        }
      }
    });

    const avgApprovalTurnaroundHours = turnaroundsCount
      ? Math.round((totalTurnaroundHours / turnaroundsCount) * 10) / 10
      : 0;

    // 3. Support Tickets Resolution Rates
    const tickets = await SupportTicket.find({
      companyId,
      clientId,
    });

    const totalTicketsCount = tickets.length;
    const openTicketsCount = tickets.filter(
      (t) => t.status === 'open' || t.status === 'in-progress'
    ).length;
    const resolvedTicketsCount = tickets.filter(
      (t) => t.status === 'resolved' || t.status === 'closed'
    ).length;

    // 4. Invoices Summary
    const sharedInvoices = await SharedInvoice.find({
      companyId,
      clientId,
    }).populate({
      path: 'invoiceId',
      model: Invoice,
    });

    const invoiceCount = sharedInvoices.length;
    let totalInvoicedAmount = 0;
    let paidInvoicedAmount = 0;

    sharedInvoices.forEach((si) => {
      if (si.invoiceId) {
        totalInvoicedAmount += si.invoiceId.total || 0;
        if (si.invoiceId.status === 'paid') {
          paidInvoicedAmount += si.invoiceId.total || 0;
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        projects: {
          total: projectCount,
          averageHealth: avgHealthScore,
        },
        approvals: {
          total: approvalCount,
          pending: pendingApprovalsCount,
          completed: approvedCount,
          averageTurnaroundHours: avgApprovalTurnaroundHours,
        },
        support: {
          total: totalTicketsCount,
          open: openTicketsCount,
          resolved: resolvedTicketsCount,
          resolutionRate: totalTicketsCount
            ? Math.round((resolvedTicketsCount / totalTicketsCount) * 100)
            : 100,
        },
        finance: {
          totalCount: invoiceCount,
          totalAmount: totalInvoicedAmount,
          paidAmount: paidInvoicedAmount,
          outstandingAmount: totalInvoicedAmount - paidInvoicedAmount,
        },
      },
    });
  } catch (error: any) {
    console.error('Portal Analytics GET Error:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: 'QUERY_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
