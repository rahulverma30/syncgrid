import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
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

    const { title, type, dueDate } = body;

    if (!title || !dueDate) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: 'Title and due date are required.' },
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

    // Append Reminder
    const newReminder = {
      title,
      type: type || 'custom',
      dueDate: new Date(dueDate),
      isCompleted: false,
    };
    lead.reminders.push(newReminder);

    // Append Timeline
    lead.timeline.push({
      type: 'reminder_added',
      title: 'Reminder Scheduled',
      description: `Follow-up ${newReminder.type} scheduled by ${userName} for ${new Date(dueDate).toLocaleDateString()}`,
      userId,
      userName,
    });

    await lead.save();

    return NextResponse.json({
      success: true,
      data: lead,
    });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
