import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Client } from '@/models/Client';
import { ClientActivity } from '@/models/ClientActivity';
import { Contact } from '@/models/Contact';
import { ContactIngestSchema } from '@/lib/validators/client';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userName = session.user.name;
    const params = await context.params;
    const { id } = params;
    const body = await request.json();

    const parseResult = ContactIngestSchema.safeParse(body);
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

    // If setting this contact as primary, unset other contacts for this Client
    if (validated.isPrimary) {
      await Contact.updateMany({ clientId: id }, { $set: { isPrimary: false } });
    }

    // Split name into first/last
    const nameParts = validated.name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || ' ';

    const newContact = new Contact({
      companyId,
      clientId: id,
      accountId: client.crmAccountId || undefined,
      ownerId: session.user.id,
      firstName,
      lastName,
      role: validated.role,
      email: validated.email,
      phone: validated.phone,
      isPrimary: validated.isPrimary,
      // Note: communicationPref is not natively in the CRM Contact schema currently,
      // but we can append it if we update the schema later, or omit it.
    });

    await newContact.save();

    // Record inside account audit timeline
    const activity = new ClientActivity({
      companyId,
      clientId: id,
      type: 'contact_added',
      title: 'New Account Contact Added',
      description: `Contact person "${validated.name}" (${validated.role || 'No title'}) registered by ${userName}.`,
      userName,
    });
    await activity.save();

    // Re-fetch contacts to return updated state
    const contactQuery = client.crmAccountId
      ? { $or: [{ clientId: id }, { accountId: client.crmAccountId }] }
      : { clientId: id };

    const unifiedContacts = await Contact.find({
      companyId,
      ...contactQuery,
      isArchived: false,
    }).sort({ isPrimary: -1, createdAt: -1 });

    const clientObj = client.toObject();
    clientObj.contacts = unifiedContacts;

    return NextResponse.json({
      success: true,
      data: clientObj,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
