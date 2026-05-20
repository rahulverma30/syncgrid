import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Client } from '@/models/Client';
import { ClientActivity } from '@/models/ClientActivity';

export const DELETE = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userName = session.user.name;
    const { id, contactId } = context.params;

    const client = await Client.findOne({ _id: id, companyId });

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Client account not found.' },
        { status: 404 }
      );
    }

    const contact = client.contacts.id(contactId);
    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Contact not found.' },
        { status: 404 }
      );
    }

    // Remove the contact
    client.contacts.pull(contactId);

    // Record inside account audit timeline
    const activity = new ClientActivity({
      companyId,
      clientId: id,
      type: 'contact_removed',
      title: 'Account Contact Removed',
      description: `Contact person "${contact.name}" removed by ${userName}.`,
      userName,
    });
    await activity.save();

    await client.save();

    return NextResponse.json({
      success: true,
      message: 'Contact removed successfully.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
