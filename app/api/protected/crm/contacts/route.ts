import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Contact } from '@/models/Contact';
import { CRMActivity } from '@/models/CRMActivity';
import { Client } from '@/models/Client';

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

    let contacts = await Contact.find(filter).sort({ createdAt: -1 });

    // Fallback for Next.js dev server model caching
    const contactsWithAccounts = await Promise.all(
      contacts.map(async (c) => {
        const cObj = c.toObject();
        console.log('DEBUG cObj.accountId:', cObj.accountId);
        if (
          cObj.accountId &&
          !cObj.accountId.name &&
          typeof cObj.accountId.toString === 'function'
        ) {
          const client = await Client.findById(cObj.accountId).select('name');
          console.log('DEBUG found client:', client);
          if (client) {
            cObj.accountId = { _id: client._id, name: client.name };
          }
        }
        return cObj;
      })
    );
    console.log('DEBUG First contact returning:', contactsWithAccounts[0]);
    return NextResponse.json({ success: true, data: contactsWithAccounts });
  } catch (error: any) {
    return apiErrorResponse(error);
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
    return apiErrorResponse(error);
  }
});
