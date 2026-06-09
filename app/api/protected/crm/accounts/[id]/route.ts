import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Account } from '@/models/Account';
import { CRMActivity } from '@/models/CRMActivity';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    const companyId = session.user.companyId;

    const account = await Account.findOne({ _id: id, companyId }).populate('ownerId', 'name email');
    if (!account) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: account });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});

export const PUT = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    const companyId = session.user.companyId;
    const body = await request.json();

    const account = await Account.findOneAndUpdate(
      { _id: id, companyId },
      { $set: body },
      { new: true }
    );

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Account not found' },
        { status: 404 }
      );
    }

    const activity = new CRMActivity({
      companyId,
      type: 'updated',
      title: 'Account Updated',
      description: `Account ${account.name} was updated.`,
      accountId: account._id,
      userId: session.user.id,
      userName: session.user.name,
    });
    await activity.save();

    return NextResponse.json({ success: true, data: account });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});

export const DELETE = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    const companyId = session.user.companyId;

    const account = await Account.findOneAndUpdate(
      { _id: id, companyId },
      { isArchived: true },
      { new: true }
    );

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Account not found' },
        { status: 404 }
      );
    }

    const activity = new CRMActivity({
      companyId,
      type: 'updated',
      title: 'Account Archived',
      description: `Account ${account.name} was archived.`,
      accountId: account._id,
      userId: session.user.id,
      userName: session.user.name,
    });
    await activity.save();

    return NextResponse.json({ success: true, message: 'Account archived' });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
