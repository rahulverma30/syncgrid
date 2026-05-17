import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Client } from '@/models/Client';
import { ClientActivity } from '@/models/ClientActivity';
import { ContactIngestSchema } from '@/lib/validators/client';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userName = session.user.name;
    const { id } = context.params;
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

    // If setting this contact as primary, unset other contacts
    if (validated.isPrimary) {
      client.contacts.forEach((c: any) => {
        c.isPrimary = false;
      });
    }

    const newContact = {
      name: validated.name,
      role: validated.role,
      email: validated.email,
      phone: validated.phone,
      isPrimary: validated.isPrimary,
      communicationPref: validated.communicationPref,
    };

    client.contacts.push(newContact);

    // Record inside account audit timeline - save to decoupled ClientActivity collection
    const activity = new ClientActivity({
      companyId,
      clientId: id,
      type: 'contact_added',
      title: 'New Account Contact Added',
      description: `Contact person "${validated.name}" (${validated.role || 'No title'}) registered by ${userName}.`,
      userName,
    });
    await activity.save();

    await client.save();

    return NextResponse.json({
      success: true,
      data: client,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
