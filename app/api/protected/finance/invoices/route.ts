import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Invoice, Client, Project, FinancialActivity, Budget } from '@/models';
import { InvoiceCreateSchema, InvoiceItemCreateSchema } from '@/schemas/finance';
import { hasRole } from '@/lib/auth/permission-checks';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const clientId = url.searchParams.get('clientId') || '';

    const query: Record<string, any> = {
      companyId,
      isSoftDeleted: false,
    };

    if (status) {
      query.status = status;
    }
    if (clientId) {
      query.clientId = clientId;
    }

    let invoices = await Invoice.find(query)
      .populate({ path: 'clientId', select: 'name email company' })
      .populate({ path: 'projectId', select: 'name status' })
      .sort({ createdAt: -1 });

    if (search) {
      const lowerSearch = search.toLowerCase();
      invoices = invoices.filter((inv: any) => {
        const clientName = inv.clientId?.name?.toLowerCase() || '';
        const invNumber = inv.invoiceNumber?.toLowerCase() || '';
        const notes = inv.notes?.toLowerCase() || '';
        return (
          clientName.includes(lowerSearch) ||
          invNumber.includes(lowerSearch) ||
          notes.includes(lowerSearch)
        );
      });
    }

    return NextResponse.json({ success: true, data: invoices });
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
    const userName = session.user.name;
    const roles = session.user.roles || [];

    // RBAC: Only admin/finance can build invoices
    const hasWriteAccess = hasRole(roles, ['super-admin', 'admin', 'finance']);
    if (!hasWriteAccess) {
      return NextResponse.json(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'Unauthorized: Only Finance or Admins can generate corporate invoices',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parseResult = InvoiceCreateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: parseResult.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const validated = parseResult.data;

    // Verify Client
    const client = await Client.findOne({ _id: validated.clientId, companyId });
    if (!client) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Target Customer Client profile not found' },
        { status: 404 }
      );
    }

    // Generate consecutive sequential Invoice Number
    const count = await Invoice.countDocuments({ companyId });
    const sequentialNumber = `INV-${(1000 + count + 1).toString()}`;

    // Perform line item arithmetic calculations
    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;

    const lineItems = (validated.lineItems as z.infer<typeof InvoiceItemCreateSchema>[]).map(
      (item) => {
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
      }
    );

    const totalAmount = subtotal + taxTotal - discountTotal;
    const outstandingAmount = totalAmount;

    const invoice = new Invoice({
      companyId,
      invoiceNumber: sequentialNumber,
      clientId: validated.clientId,
      projectId: validated.projectId,
      issueDate: validated.issueDate || new Date(),
      dueDate: validated.dueDate,
      currency: validated.currency || 'USD',
      exchangeRate: validated.exchangeRate || 1.0,
      lineItems,
      subtotal,
      discountTotal,
      taxTotal,
      totalAmount,
      paidAmount: 0,
      outstandingAmount,
      status: 'draft',
      notes: validated.notes,
      terms: validated.terms,
      createdById: userId,
    });

    await invoice.save();

    // Log Financial Activity Audit Log
    const audit = new FinancialActivity({
      companyId,
      userId,
      userName,
      type: 'invoice_created',
      title: 'Invoice Draft Built',
      description: `Invoice ${sequentialNumber} created in draft state for client ${client.name} (Total: ${validated.currency} ${totalAmount.toFixed(2)}).`,
      metadata: { invoiceId: invoice._id, totalAmount, invoiceNumber: sequentialNumber },
      severity: 'info',
    });
    await audit.save();

    return NextResponse.json({ success: true, data: invoice }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
