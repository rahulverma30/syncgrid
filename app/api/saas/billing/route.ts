import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getAuthSecret } from '@/lib/env';
import { connectToDatabase } from '@/lib/db';
import { EnterpriseBillingEngine } from '@/lib/saas/billing';
import { z } from 'zod';

export async function GET(req: Request) {
  try {
    const token = await getToken({
      req: req as any,
      secret: getAuthSecret(),
    });

    if (!token || !token.companyId) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const quotas = await EnterpriseBillingEngine.getBillingQuotas(token.companyId as string);
    const invoices = EnterpriseBillingEngine.getInvoiceLog(
      token.companyId as string,
      quotas.priceMonthly,
      quotas.seats
    );

    return NextResponse.json({
      success: true,
      quotas,
      invoices,
    });
  } catch (err: any) {
    console.error('Billing GET route error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'SERVER_ERROR',
        message: err.message || 'Failed to fetch billing status',
      },
      { status: 500 }
    );
  }
}

const updateBillingSchema = z.object({
  planSlug: z.enum(['starter', 'pro', 'enterprise']),
  seats: z.number().min(1),
});

export async function POST(req: Request) {
  try {
    const token = await getToken({
      req: req as any,
      secret: getAuthSecret(),
    });

    if (!token || !token.companyId) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = updateBillingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'BAD_REQUEST', message: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const result = await EnterpriseBillingEngine.changePlan(
      token.companyId as string,
      parsed.data.planSlug,
      parsed.data.seats
    );

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Billing POST route error:', err);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: err.message || 'Failed to update plan' },
      { status: 500 }
    );
  }
}
