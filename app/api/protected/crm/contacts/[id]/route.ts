import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Contact } from '@/models/Contact';
import { CRMActivity } from '@/models/CRMActivity';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    const companyId = session.user.companyId;

    const contact = await Contact.findOne({ _id: id, companyId }).populate('accountId', 'name');
    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Contact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: contact });
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

    const contact = await Contact.findOneAndUpdate(
      { _id: id, companyId },
      { $set: body },
      { new: true }
    );

    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Contact not found' },
        { status: 404 }
      );
    }

    const activity = new CRMActivity({
      companyId,
      type: 'updated',
      title: 'Contact Updated',
      description: `Contact ${contact.firstName} ${contact.lastName} was updated.`,
      contactId: contact._id,
      accountId: contact.accountId,
      userId: session.user.id,
      userName: session.user.name,
    });
    await activity.save();

    return NextResponse.json({ success: true, data: contact });
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

    const contact = await Contact.findOneAndUpdate(
      { _id: id, companyId },
      { isArchived: true },
      { new: true }
    );

    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Contact not found' },
        { status: 404 }
      );
    }

    const activity = new CRMActivity({
      companyId,
      type: 'updated',
      title: 'Contact Archived',
      description: `Contact ${contact.firstName} ${contact.lastName} was archived.`,
      contactId: contact._id,
      accountId: contact.accountId,
      userId: session.user.id,
      userName: session.user.name,
    });
    await activity.save();

    return NextResponse.json({ success: true, message: 'Contact archived' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'DELETE_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
