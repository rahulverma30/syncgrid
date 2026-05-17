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

    const { type, summary } = body;

    if (!summary) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Communication summary is required.',
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

    const newLog = {
      type: type || 'email',
      summary,
      loggedBy: userName,
      createdAt: new Date(),
    };

    client.communicationLogs.push(newLog);

    client.timeline.push({
      type: 'comm_logged',
      title: `${type === 'call' ? '📞 Call' : type === 'meeting' ? '🤝 Meeting' : '📧 Email'} Logged`,
      description: `${summary} (logged by ${userName})`,
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
