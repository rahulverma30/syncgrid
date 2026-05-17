import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Client } from '@/models/Client';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userName = session.user.name;
    const { id } = context.params;
    const body = await request.json();

    const { name, role, email, phone, isPrimary, communicationPref } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: 'Contact Name is required.' },
        { status: 400 }
      );
    }

    const client = await Client.findOne({ _id: id, companyId });

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Client account not found.' },
        { status: 404 }
      );
    }

    // If setting this contact as primary, unset other contacts
    if (isPrimary) {
      client.contacts.forEach((c: any) => {
        c.isPrimary = false;
      });
    }

    const newContact = {
      name,
      role: role || 'Point of Contact',
      email: email || '',
      phone: phone || '',
      isPrimary: !!isPrimary,
      communicationPref: communicationPref || 'email',
    };

    client.contacts.push(newContact);

    // Record inside account audit timeline
    client.timeline.push({
      type: 'contact_added',
      title: 'New Account Contact Added',
      description: `Contact person "${name}" (${role}) registered by ${userName}.`,
      userName,
      createdAt: new Date(),
    });

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
