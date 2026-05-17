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

    const { title, dueDate, attendees, notes, isCompleted } = body;

    if (!title || !dueDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Meeting title and date are required.',
        },
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

    const newMeeting = {
      title,
      dueDate: new Date(dueDate),
      attendees: attendees || [],
      notes: notes || '',
      isCompleted: !!isCompleted,
    };

    client.meetings.push(newMeeting);

    // Timeline logs
    client.timeline.push({
      type: 'meeting_scheduled',
      title: 'Sync Sync-up Scheduled',
      description: `Meeting "${title}" scheduled on ${new Date(dueDate).toLocaleDateString()} by ${userName}.`,
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
