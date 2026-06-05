import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Client } from '@/models/Client';
import { ClientActivity } from '@/models/ClientActivity';
import { validateUploadPayload } from '@/lib/validators/upload';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userName = session.user.name;
    const params = await context.params;
    const { id } = params;
    const body = await request.json();

    const { name, category, url, size } = body;

    const validation = validateUploadPayload({ name, category, url, size });
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: validation.error,
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

    const newDoc = {
      name,
      category: category || 'proposal',
      url,
      size: size || 0,
      uploadedBy: userName,
      createdAt: new Date(),
    };

    client.documents.push(newDoc);

    const activity = new ClientActivity({
      companyId,
      clientId: id,
      type: 'document_uploaded',
      title: 'Agreement Document Attached',
      description: `Uploaded document "${name}" (type: ${category}) under client folder.`,
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
