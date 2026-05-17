import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Client } from '@/models/Client';
import { ClientActivity } from '@/models/ClientActivity';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userName = session.user.name;
    const { id } = context.params;
    const body = await request.json();

    const { content, isPinned, isPrivate } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: 'Note content is required.' },
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

    const newNote = {
      content,
      createdByName: userName,
      isPinned: !!isPinned,
      isPrivate: !!isPrivate,
      createdAt: new Date(),
    };

    client.notes.push(newNote);

    // Timeline logs - save to decoupled ClientActivity collection
    const activity = new ClientActivity({
      companyId,
      clientId: id,
      type: 'note_added',
      title: isPrivate ? 'Internal Note Logged' : 'Public Note Logged',
      description: `Comment logged by ${userName}`,
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
