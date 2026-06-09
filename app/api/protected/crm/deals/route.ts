import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Deal } from '@/models/Deal';
import { CRMActivity } from '@/models/CRMActivity';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search');
    const accountId = searchParams.get('accountId');
    const stage = searchParams.get('stage');

    const filter: any = { companyId, isArchived: false };

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (accountId) {
      filter.accountId = accountId;
    }
    if (stage) {
      filter.stage = stage;
    }

    const deals = await Deal.find(filter)
      .populate('accountId', 'name industry')
      .populate('contactId', 'firstName lastName email')
      .populate('ownerId', 'name email')
      .sort({ expectedCloseDate: 1 });

    return NextResponse.json({ success: true, data: deals });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const body = await request.json();

    const deal = new Deal({
      ...body,
      companyId,
      ownerId: body.ownerId || session.user.id,
    });
    await deal.save();

    const activity = new CRMActivity({
      companyId,
      type: 'created',
      title: 'Deal Created',
      description: `Deal ${deal.name} was created in stage ${deal.stage}.`,
      dealId: deal._id,
      accountId: deal.accountId,
      userId: session.user.id,
      userName: session.user.name,
    });
    await activity.save();

    return NextResponse.json({ success: true, data: deal }, { status: 201 });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
