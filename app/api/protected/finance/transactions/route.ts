import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Transaction, Invoice, Client, FinancialActivity } from '@/models';
import { hasRole } from '@/lib/auth/permission-checks';
import { TransactionRecordSchema } from '@/schemas/finance';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || '';
    const status = url.searchParams.get('status') || '';

    const query: Record<string, any> = { companyId };

    if (type) {
      query.type = type;
    }
    if (status) {
      query.status = status;
    }

    const txns = await Transaction.find(query)
      .populate({ path: 'invoiceId', select: 'invoiceNumber status totalAmount' })
      .populate({ path: 'clientId', select: 'name company' })
      .sort({ paymentDate: -1 })
      .lean();

    return NextResponse.json({ success: true, data: txns });
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
    const userName = session.user.name || 'System User';
    const roles = session.user.roles || [];

    const isAuthorized = hasRole(roles, ['super-admin', 'admin', 'finance']);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Unauthorized finance permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parseResult = TransactionRecordSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const validated = parseResult.data;

    // Generate Transaction Number
    const count = await Transaction.countDocuments({ companyId });
    const transactionNumber = `TXN-${(10000 + count + 1).toString()}`;

    const txn = new Transaction({
      companyId,
      transactionNumber,
      invoiceId: validated.invoiceId,
      clientId: validated.clientId,
      paymentMethod: validated.paymentMethod,
      type: validated.type,
      currency: validated.currency || 'USD',
      exchangeRate: 1.0,
      amount: validated.amount,
      status: 'cleared',
      referenceNumber: validated.referenceNumber,
      paymentDate: validated.paymentDate || new Date(),
      description: validated.description,
      createdById: userId,
    });

    await txn.save();

    // If transaction is linked to an invoice and it is income, update paid status
    if (validated.invoiceId && validated.type === 'income') {
      const invoice = await Invoice.findOne({ _id: validated.invoiceId, companyId });
      if (invoice) {
        const newPaidAmount = invoice.paidAmount + validated.amount;
        const newOutstanding = Math.max(0, invoice.totalAmount - newPaidAmount);

        invoice.paidAmount = newPaidAmount;
        invoice.outstandingAmount = newOutstanding;

        if (newOutstanding === 0) {
          invoice.status = 'paid';
        } else {
          invoice.status = 'partially_paid';
        }
        await invoice.save();
      }
    }

    // Log Financial Activity Audit Log
    const audit = new FinancialActivity({
      companyId,
      userId,
      userName,
      type: validated.type === 'refund' ? 'refund_issued' : 'payment_received',
      title: validated.type === 'refund' ? 'Refund Issued' : 'Payment Recorded',
      description: `${validated.type === 'refund' ? 'Issued refund of' : 'Recorded payment of'} ${validated.currency} ${validated.amount.toFixed(2)} with transaction number ${transactionNumber}.`,
      metadata: { transactionId: txn._id, amount: validated.amount, type: validated.type },
      severity: 'info',
    });
    await audit.save();

    return NextResponse.json({ success: true, data: txn }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});

// Reconciliation put handler
export const PUT = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const userName = session.user.name || 'System User';
    const roles = session.user.roles || [];

    const isAuthorized = hasRole(roles, ['super-admin', 'admin', 'finance']);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const action = url.searchParams.get('action');

    if (!id || action !== 'reconcile') {
      return NextResponse.json(
        { success: false, error: 'BAD_REQUEST', message: 'Parameters missing' },
        { status: 400 }
      );
    }

    const txn = await Transaction.findOne({ _id: id, companyId });
    if (!txn) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Transaction not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    txn.reconciliationMetadata = {
      reconciled: true,
      reconciledAt: new Date(),
      reconciledById: userId,
      notes: body.notes || 'Reconciled manual ledger ledger matching',
    };

    await txn.save();

    return NextResponse.json({ success: true, data: txn });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
