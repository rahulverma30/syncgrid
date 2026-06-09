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

    const { name, url, size, category } = body;

    if (!name || !url) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Attachment name and URL are required.',
        },
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

    // Append Attachment
    const newAttachment = {
      name,
      url,
      size: size || 0,
      category: category || 'other',
      uploadedBy: userName,
    };
    lead.attachments.push(newAttachment);

    // Append Timeline
    lead.timeline.push({
      type: 'attachment_added',
      title: 'Attachment Uploaded',
      description: `File "${name}" (${category}) uploaded by ${userName}`,
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
