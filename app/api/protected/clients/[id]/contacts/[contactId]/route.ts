import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Client } from '@/models/Client';
import { ClientActivity } from '@/models/ClientActivity';
import { Contact } from '@/models/Contact';

export const DELETE = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userName = session.user.name;
    const { id, contactId } = await context.params;

    const client = await Client.findOne({ _id: id, companyId });

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Client account not found.' },
        { status: 404 }
      );
    }

    const contact = await Contact.findOne({ _id: contactId });
    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Contact not found.' },
        { status: 404 }
      );
    }

    // Instead of completely deleting, we can either delete or just unlink from this Client.
    // We will hard delete it.
    await Contact.deleteOne({ _id: contactId });

    // Record inside account audit timeline
    const activity = new ClientActivity({
      companyId,
      clientId: id,
      type: 'contact_removed',
      title: 'Account Contact Removed',
      description: `Contact person "${contact.firstName} ${contact.lastName}" removed by ${userName}.`,
      userName,
    });
    await activity.save();

    return NextResponse.json({
      success: true,
      message: 'Contact removed successfully.',
    });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
