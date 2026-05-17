import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Lead } from '@/models/Lead';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const userName = session.user.name;
    const leadId = context.params.id;
    const body = await request.json();

    const { content, isPinned, isPrivate } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: 'Note content is required.' },
        { status: 400 }
      );
    }

    const lead = await Lead.findOne({ _id: leadId, companyId });
    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Lead not found or unauthorized.' },
        { status: 404 }
      );
    }

    // Append Note
    const newNote = {
      content,
      createdById: userId,
      createdByName: userName,
      isPinned: !!isPinned,
      isPrivate: !!isPrivate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    lead.notes.push(newNote);

    // Append Timeline
    lead.timeline.push({
      type: 'note_added',
      title: 'Note Added',
      description: `New note added by ${userName}`,
      userId,
      userName,
    });

    await lead.save();

    return NextResponse.json({
      success: true,
      data: lead,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'CREATE_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
