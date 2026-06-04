import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Deal } from '@/models/Deal';
import { CRMActivity } from '@/models/CRMActivity';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    const companyId = session.user.companyId;

    const deal = await Deal.findOne({ _id: id, companyId })
      .populate('accountId', 'name industry')
      .populate('contactId', 'firstName lastName email')
      .populate('ownerId', 'name email');

    if (!deal) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Deal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: deal });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'FETCH_ERROR', message: error.message },
      { status: 500 }
    );
  }
});

export const PUT = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    const companyId = session.user.companyId;
    const body = await request.json();

    const originalDeal = await Deal.findOne({ _id: id, companyId });
    if (!originalDeal) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Deal not found' },
        { status: 404 }
      );
    }

    const deal = await Deal.findOneAndUpdate({ _id: id, companyId }, { $set: body }, { new: true });

    if (body.stage && originalDeal.stage !== body.stage) {
      const activity = new CRMActivity({
        companyId,
        type: 'stage_change',
        title: 'Deal Stage Changed',
        description: `Deal moved from ${originalDeal.stage} to ${deal.stage}.`,
        dealId: deal._id,
        accountId: deal.accountId,
        userId: session.user.id,
        userName: session.user.name,
      });
      await activity.save();
    } else {
      const activity = new CRMActivity({
        companyId,
        type: 'updated',
        title: 'Deal Updated',
        description: `Deal ${deal.name} was updated.`,
        dealId: deal._id,
        accountId: deal.accountId,
        userId: session.user.id,
        userName: session.user.name,
      });
      await activity.save();
    }

    return NextResponse.json({ success: true, data: deal });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'UPDATE_ERROR', message: error.message },
      { status: 500 }
    );
  }
});

export const DELETE = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    const companyId = session.user.companyId;

    const deal = await Deal.findOneAndUpdate(
      { _id: id, companyId },
      { isArchived: true },
      { new: true }
    );

    if (!deal) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Deal not found' },
        { status: 404 }
      );
    }

    const activity = new CRMActivity({
      companyId,
      type: 'updated',
      title: 'Deal Archived',
      description: `Deal ${deal.name} was archived.`,
      dealId: deal._id,
      accountId: deal.accountId,
      userId: session.user.id,
      userName: session.user.name,
    });
    await activity.save();

    return NextResponse.json({ success: true, message: 'Deal archived' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'DELETE_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
