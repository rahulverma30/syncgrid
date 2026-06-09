import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Client } from '@/models/Client';
import { ClientActivity } from '@/models/ClientActivity';

import { NoteIngestSchema } from '@/lib/validators/client';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userName = session.user.name;
    const params = await context.params;
    const { id } = params;
    const body = await request.json();

    const parseResult = NoteIngestSchema.safeParse(body);
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

    const newNote = {
      content: validated.content,
      createdByName: userName,
      isPinned: validated.isPinned,
      isPrivate: validated.isPrivate,
      createdAt: new Date(),
      editHistory: [],
    };

    client.notes.push(newNote);

    // Timeline logs - save to decoupled ClientActivity collection
    const activity = new ClientActivity({
      companyId,
      clientId: id,
      type: 'note_added',
      title: validated.isPrivate ? 'Internal Note Logged' : 'Public Note Logged',
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
    return apiErrorResponse(error);
  }
});

export const PUT = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userName = session.user.name;
    const params = await context.params;
    const { id } = params;
    const body = await request.json();

    const { noteId, content } = body;

    if (!noteId || !content) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: 'noteId and content are required.' },
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

    const note = client.notes.id(noteId);
    if (!note) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Note not found.' },
        { status: 404 }
      );
    }

    // Capture version in editHistory
    if (!note.editHistory) {
      note.editHistory = [];
    }

    note.editHistory.push({
      content: note.content,
      editedBy: note.createdByName || 'System',
      editedAt: note.createdAt || new Date(),
    });

    // Update current content
    note.content = content;
    note.createdAt = new Date(); // update note timestamp
    note.createdByName = userName; // current editor

    const activity = new ClientActivity({
      companyId,
      clientId: id,
      type: 'note_edited',
      title: 'Internal Note Edited',
      description: `Internal comment trace edited and version logged by ${userName}.`,
      userName,
    });
    await activity.save();

    await client.save();

    return NextResponse.json({
      success: true,
      data: client,
    });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
