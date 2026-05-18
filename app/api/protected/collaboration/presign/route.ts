import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { CloudStorageEngine } from '@/lib/storage';
import { logger } from '@/lib/logger';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const body = await request.json();

    const { fileName, mimeType } = body;
    if (!fileName || !mimeType) {
      return NextResponse.json(
        { success: false, message: 'fileName and mimeType required' },
        { status: 400 }
      );
    }

    // Call storage engine to generate isolated secure signed token details
    const presignData = await CloudStorageEngine.getPresignedUploadUrl(
      companyId,
      userId,
      fileName,
      mimeType
    );

    return NextResponse.json({ success: true, data: presignData });
  } catch (error: any) {
    logger.error('Failed creating presigned upload credentials:', error, {
      companyId: session?.user?.companyId,
    });
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});
