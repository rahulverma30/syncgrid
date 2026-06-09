import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Client } from '@/models/Client';
import { ClientActivity } from '@/models/ClientActivity';
import { ContractIngestSchema } from '@/lib/validators/client';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userName = session.user.name;
    const params = await context.params;
    const { id } = params;
    const body = await request.json();

    const parseResult = ContractIngestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: parseResult.error.errors[0].message,
          issues: parseResult.error.errors,
        },
        { status: 400 }
      );
    }

    const validated = parseResult.data;

    const client = await Client.findOne({ _id: id, companyId });

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Client account not found.' },
        { status: 404 }
      );
    }

    const newContract = {
      title: validated.title,
      value: validated.value,
      startDate: validated.startDate ? new Date(validated.startDate) : undefined,
      endDate: validated.endDate ? new Date(validated.endDate) : undefined,
      status: validated.status,
    };

    client.contracts.push(newContract);

    // Dynamic Recalculation: Tally total client contracts to update overall revenueContribution
    const totalRevenue = client.contracts.reduce((sum: number, c: any) => {
      if (c.status === 'active') {
        return sum + (c.value || 0);
      }
      return sum;
    }, 0);

    client.revenueContribution = totalRevenue;

    // Record timeline logs - save to decoupled ClientActivity collection
    const activity = new ClientActivity({
      companyId,
      clientId: id,
      type: 'contract_added',
      title: 'Contract Agreement Signed',
      description: `Contract "${validated.title}" valued at $${(validated.value || 0).toLocaleString()} approved by ${userName}.`,
      userName,
    });
    await activity.save();

    await client.save();

    return NextResponse.json({
      success: true,
      data: client,
    });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
