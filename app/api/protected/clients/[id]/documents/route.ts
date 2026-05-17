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

    const { name, category, url, size } = body;

    if (!name || !url) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Document name and URL are required.',
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

    client.timeline.push({
      type: 'document_uploaded',
      title: 'Agreement Document Attached',
      description: `Uploaded document "${name}" (type: ${category}) under client folder.`,
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
