import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Account } from '@/models/Account';
import { CRMActivity } from '@/models/CRMActivity';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search');
    const ownerId = searchParams.get('ownerId');

    const filter: any = { companyId, isArchived: false };

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (ownerId) {
      filter.ownerId = ownerId;
    }

    const accounts = await Account.find(filter)
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: accounts });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'FETCH_ERROR', message: error.message },
      { status: 500 }
    );
  }
});

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const body = await request.json();

    const account = new Account({
      ...body,
      companyId,
      ownerId: body.ownerId || session.user.id,
    });
    await account.save();

    const activity = new CRMActivity({
      companyId,
      type: 'created',
      title: 'Account Created',
      description: `Account ${account.name} was created.`,
      accountId: account._id,
      userId: session.user.id,
      userName: session.user.name,
    });
    await activity.save();

    return NextResponse.json({ success: true, data: account }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'CREATE_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
