import { NextResponse } from 'next/server';
import { requirePortalAuth } from '@/lib/auth/portal';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ClientApprovalRequest } from '@/models/ClientApprovalRequest';
import { ClientPortalAuditLog } from '@/models/ClientPortalAuditLog';
import { SharedDeliverable } from '@/models/SharedDeliverable';
import { z } from 'zod';

const approvalActionSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  action: z.enum(['approved', 'revision_requested']),
  comments: z.string().optional(),
  signatureVerified: z.boolean().optional(),
});

export async function GET() {
  try {
    await connectToDatabase();

    const session = await requirePortalAuth();
    const { clientId, companyId } = session.user;

    // Retrieve all approval requests scoped strictly to this client
    const approvals = await ClientApprovalRequest.find({
      companyId,
      clientId,
    }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: approvals });
  } catch (error: any) {
    console.error('Portal Approvals GET Error:', error);
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
    const parsed = approvalActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { requestId, action, comments, signatureVerified } = parsed.data;

    const approval = await ClientApprovalRequest.findOne({
      _id: requestId,
      companyId,
      clientId,
    });

    if (!approval) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Approval request not found.' },
        { status: 404 }
      );
    }

    const finalStatus = action === 'approved' ? 'approved' : 'revision_requested';

    const signaturePrefix = signatureVerified
      ? `[SECURE DIGITAL SIGNATURE CERTIFIED - AUTHORIZED SIGN-OFF] `
      : '';
    const finalComments = signaturePrefix + (comments || '');

    // Append decision to history
    approval.history.push({
      action: finalStatus,
      actedBy: 'client',
      userId: portalUserId,
      userName: portalUserName,
      comments: finalComments,
      actedAt: new Date(),
    });

    approval.status = finalStatus;
    await approval.save();

    // If deliverable, update status on SharedDeliverable model too
    if (approval.type === 'deliverable') {
      await SharedDeliverable.updateOne(
        { _id: approval.referenceId },
        {
          $set: {
            status: finalStatus === 'approved' ? 'approved' : 'revision_requested',
            approvedBy: finalStatus === 'approved' ? portalUserName : undefined,
            approvedAt: finalStatus === 'approved' ? new Date() : undefined,
          },
        }
      );
    }

    // Create Audit Log Entry
    await ClientPortalAuditLog.create({
      companyId,
      clientId,
      portalUserId,
      portalUserName,
      eventType: 'approve_item',
      severity: 'info',
      actionDetails: `Client Portal user "${portalUserName}" set status to "${finalStatus}" for approval item: "${approval.title}". Comments: "${comments || ''}".`,
    });

    return NextResponse.json({ success: true, data: approval });
  } catch (error: any) {
    console.error('Portal Approvals POST Error:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
