import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Client } from '@/models/Client';
import { ClientActivity } from '@/models/ClientActivity';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userName = session.user.name;
    const params = await context.params;
    const { id } = params;
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

    // Timeline logs - save to decoupled ClientActivity collection
    const activity = new ClientActivity({
      companyId,
      clientId: id,
      type: 'meeting_scheduled',
      title: 'Sync Sync-up Scheduled',
      description: `Meeting "${title}" scheduled on ${new Date(dueDate).toLocaleDateString()} by ${userName}.`,
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
