import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { PurchaseOrder, Vendor, Project, FinancialActivity } from '@/models';
import { hasRole } from '@/lib/auth/permission-checks';
import { PurchaseOrderCreateSchema } from '@/schemas/finance';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    const pos = await PurchaseOrder.find({ companyId, isSoftDeleted: false })
      .populate({ path: 'vendorId', select: 'name email phone category' })
      .populate({ path: 'projectId', select: 'name status' })
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: pos });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'QUERY_ERROR', message: error.message },
      { status: 500 }
    );
  }
});

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const roles = session.user.roles || [];

    const isAuthorized = hasRole(roles, ['super-admin', 'admin', 'finance']);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parseResult = PurchaseOrderCreateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const validated = parseResult.data;

    // Verify vendor
    const vendor = await Vendor.findOne({ _id: validated.vendorId, companyId });
    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Generate PO Number
    const count = await PurchaseOrder.countDocuments({ companyId });
    const poNumber = `PO-${(1000 + count + 1).toString()}`;

    let subtotal = 0;
    const lineItems = validated.lineItems.map((item) => {
      const amount = item.quantity * item.unitPrice;
      subtotal += amount;
      return {
        ...item,
        amount,
      };
    });

    const totalAmount = subtotal + validated.taxAmount;

    const po = new PurchaseOrder({
      companyId,
      poNumber,
      vendorId: validated.vendorId,
      projectId: validated.projectId,
      orderDate: new Date(),
      lineItems,
      subtotal,
      taxAmount: validated.taxAmount,
      totalAmount,
      status: 'pending_approval',
      approvalWorkflow: {
        status: 'pending',
      },
      notes: validated.notes,
      createdById: userId,
    });

    await po.save();

    return NextResponse.json({ success: true, data: po }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});

export const PUT = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const userName = session.user.name;
    const roles = session.user.roles || [];

    const isAuthorized = hasRole(roles, ['super-admin', 'admin', 'finance']);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id, status, comments } = await request.json();

    const po = await PurchaseOrder.findOne({ _id: id, companyId, isSoftDeleted: false });
    if (!po) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Purchase Order not found' },
        { status: 404 }
      );
    }

    po.status = status === 'approved' ? 'approved' : 'rejected';
    po.approvalWorkflow = {
      status: status === 'approved' ? 'approved' : 'rejected',
      approverId: userId,
      comments: comments || 'Resolved by finance director',
    };

    await po.save();

    // Log Financial Activity
    const audit = new FinancialActivity({
      companyId,
      userId,
      userName,
      type: 'po_approved',
      title: status === 'approved' ? 'Purchase Order Approved' : 'Purchase Order Rejected',
      description: `Purchase order ${po.poNumber} resolved as ${status.toUpperCase()} (Total Amount: ${po.totalAmount.toFixed(2)}).`,
      metadata: { poId: po._id, status },
      severity: 'info',
    });
    await audit.save();

    return NextResponse.json({ success: true, data: po });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
