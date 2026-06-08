import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Invoice, Transaction, Client, Project, FinancialActivity, Budget } from '@/models';
import { hasRole } from '@/lib/auth/permission-checks';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const { id } = context.params;

    const invoice = await Invoice.findOne({ _id: id, companyId, isSoftDeleted: false })
      .populate({ path: 'clientId', select: 'name email phone company billingAddress' })
      .populate({ path: 'projectId', select: 'name status' });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Invoice not found or is soft deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: invoice });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'QUERY_ERROR', message: error.message },
      { status: 500 }
    );
  }
});

export const PUT = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const userName = session.user.name || 'System User';
    const roles = session.user.roles || [];
    const { id } = context.params;

    // RBAC check: admin/finance can update or process invoices
    const isAuthorized = hasRole(roles, ['super-admin', 'admin', 'finance']);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Unauthorized finance permissions' },
        { status: 403 }
      );
    }

    const invoice = await Invoice.findOne({ _id: id, companyId, isSoftDeleted: false });
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Invoice not found' },
        { status: 404 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || '';

    if (action === 'send') {
      invoice.status = 'sent';
      await invoice.save();

      // Log Financial Activity
      const audit = new FinancialActivity({
        companyId,
        userId,
        userName,
        type: 'invoice_sent',
        title: 'Invoice Sent',
        description: `Invoice ${invoice.invoiceNumber} status moved to "sent". Transmitted to clients.`,
        metadata: { invoiceId: invoice._id, invoiceNumber: invoice.invoiceNumber },
        severity: 'info',
      });
      await audit.save();

      return NextResponse.json({ success: true, data: invoice });
    }

    if (action === 'archive') {
      invoice.isArchived = !invoice.isArchived;
      await invoice.save();
      return NextResponse.json({ success: true, data: invoice });
    }

    if (action === 'record-payment') {
      const payment = await request.json();
      const paidAmount = Number(payment.amount);

      if (isNaN(paidAmount) || paidAmount <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'BAD_REQUEST',
            message: 'Payment amount must be greater than zero',
          },
          { status: 400 }
        );
      }

      // Create new transaction receipt entry
      const txnCount = await Transaction.countDocuments({ companyId });
      const transactionNumber = `TXN-${(10000 + txnCount + 1).toString()}`;

      const txn = new Transaction({
        companyId,
        transactionNumber,
        invoiceId: invoice._id,
        clientId: invoice.clientId,
        paymentMethod: payment.paymentMethod || 'manual',
        type: 'income',
        currency: invoice.currency,
        exchangeRate: invoice.exchangeRate,
        amount: paidAmount,
        status: 'cleared',
        referenceNumber: payment.referenceNumber,
        paymentDate: payment.paymentDate || new Date(),
        description: payment.description || `Payment record for Invoice ${invoice.invoiceNumber}`,
        createdById: userId,
      });

      await txn.save();

      // Update Invoice payment tracking totals
      const newPaidAmount = invoice.paidAmount + paidAmount;
      const newOutstanding = Math.max(0, invoice.totalAmount - newPaidAmount);

      invoice.paidAmount = newPaidAmount;
      invoice.outstandingAmount = newOutstanding;

      if (newOutstanding === 0) {
        invoice.status = 'paid';
      } else {
        invoice.status = 'partially_paid';
      }

      await invoice.save();

      // Budget utilization - If there is a project budget, log it
      if (invoice.projectId) {
        const projectBudget = await Budget.findOne({
          companyId,
          projectId: invoice.projectId,
          status: 'active',
        });
        if (projectBudget) {
          // Since this is income, we can track project financial health contextually
          // or update department spent ratios if linked to corporate allocations.
        }
      }

      // Log Financial Activity
      const audit = new FinancialActivity({
        companyId,
        userId,
        userName,
        type: 'payment_received',
        title: 'Payment Received',
        description: `Logged transaction ${transactionNumber}. Received ${invoice.currency} ${paidAmount.toFixed(2)} on Invoice ${invoice.invoiceNumber}.`,
        metadata: {
          invoiceId: invoice._id,
          transactionId: txn._id,
          amount: paidAmount,
          invoiceNumber: invoice.invoiceNumber,
        },
        severity: 'info',
      });
      await audit.save();

      return NextResponse.json({ success: true, data: invoice });
    }

    // Default: Edit invoice details (only if it is a draft)
    if (invoice.status !== 'draft') {
      return NextResponse.json(
        {
          success: false,
          error: 'BAD_REQUEST',
          message: 'Only invoice drafts can be updated. Void or refund sent bills.',
        },
        { status: 400 }
      );
    }

    const payload = await request.json();

    // Perform line item arithmetic calculations
    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;

    const lineItems = payload.lineItems.map((item: any) => {
      const amount = item.quantity * item.unitPrice;
      const taxAmount = (amount * item.taxRate) / 100;
      const total = amount + taxAmount - item.discountAmount;

      subtotal += amount;
      taxTotal += taxAmount;
      discountTotal += item.discountAmount;

      return {
        ...item,
        amount,
        taxAmount,
        total,
      };
    });

    const totalAmount = subtotal + taxTotal - discountTotal;
    const outstandingAmount = totalAmount;

    invoice.clientId = payload.clientId;
    invoice.projectId = payload.projectId;
    invoice.dueDate = payload.dueDate;
    invoice.currency = payload.currency || 'USD';
    invoice.exchangeRate = payload.exchangeRate || 1.0;
    invoice.lineItems = lineItems;
    invoice.subtotal = subtotal;
    invoice.discountTotal = discountTotal;
    invoice.taxTotal = taxTotal;
    invoice.totalAmount = totalAmount;
    invoice.outstandingAmount = outstandingAmount;
    invoice.notes = payload.notes;
    invoice.terms = payload.terms;

    await invoice.save();

    return NextResponse.json({ success: true, data: invoice });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});

export const DELETE = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const userName = session.user.name || 'System User';
    const roles = session.user.roles || [];
    const { id } = context.params;

    const isAuthorized = hasRole(roles, ['super-admin', 'admin', 'finance']);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Unauthorized finance permissions' },
        { status: 403 }
      );
    }

    const invoice = await Invoice.findOne({ _id: id, companyId, isSoftDeleted: false });
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Invoice not found' },
        { status: 404 }
      );
    }

    invoice.isSoftDeleted = true;
    await invoice.save();

    // Log Financial Activity Audit Log
    const audit = new FinancialActivity({
      companyId,
      userId,
      userName,
      type: 'invoice_voided',
      title: 'Invoice Voided / Archived',
      description: `Invoice ${invoice.invoiceNumber} has been soft-deleted/voided in the ERP records.`,
      metadata: { invoiceId: invoice._id, invoiceNumber: invoice.invoiceNumber },
      severity: 'warning',
    });
    await audit.save();

    return NextResponse.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});

// Duplication operation
export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const userName = session.user.name || 'System User';
    const roles = session.user.roles || [];
    const { id } = context.params;

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action !== 'duplicate') {
      return NextResponse.json(
        { success: false, error: 'BAD_REQUEST', message: 'Action not supported' },
        { status: 400 }
      );
    }

    const isAuthorized = hasRole(roles, ['super-admin', 'admin', 'finance']);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const invoiceToClone = await Invoice.findOne({ _id: id, companyId, isSoftDeleted: false });
    if (!invoiceToClone) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Source invoice not found' },
        { status: 404 }
      );
    }

    const count = await Invoice.countDocuments({ companyId });
    const sequentialNumber = `INV-${(1000 + count + 1).toString()}`;

    const newInvoice = new Invoice({
      companyId,
      invoiceNumber: sequentialNumber,
      clientId: invoiceToClone.clientId,
      projectId: invoiceToClone.projectId,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // Default Net 30
      currency: invoiceToClone.currency,
      exchangeRate: invoiceToClone.exchangeRate,
      lineItems: invoiceToClone.lineItems.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount,
        discountAmount: item.discountAmount,
        total: item.total,
      })),
      subtotal: invoiceToClone.subtotal,
      discountTotal: invoiceToClone.discountTotal,
      taxTotal: invoiceToClone.taxTotal,
      totalAmount: invoiceToClone.totalAmount,
      paidAmount: 0,
      outstandingAmount: invoiceToClone.totalAmount,
      status: 'draft',
      notes: invoiceToClone.notes,
      terms: invoiceToClone.terms,
      createdById: userId,
    });

    await newInvoice.save();

    return NextResponse.json({ success: true, data: newInvoice }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
