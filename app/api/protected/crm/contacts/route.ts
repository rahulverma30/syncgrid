import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Contact } from '@/models/Contact';
import { CRMActivity } from '@/models/CRMActivity';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search');
    const accountId = searchParams.get('accountId');

    const filter: any = { companyId, isArchived: false };

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (accountId) {
      filter.accountId = accountId;
    }

    const contacts = await Contact.find(filter)
      .populate('accountId', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: contacts });
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

    const contact = new Contact({
      ...body,
      companyId,
      ownerId: body.ownerId || session.user.id,
    });
    await contact.save();

    const activity = new CRMActivity({
      companyId,
      type: 'created',
      title: 'Contact Created',
      description: `Contact ${contact.firstName} ${contact.lastName} was created.`,
      contactId: contact._id,
      accountId: contact.accountId,
      userId: session.user.id,
      userName: session.user.name,
    });
    await activity.save();

    return NextResponse.json({ success: true, data: contact }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'CREATE_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
