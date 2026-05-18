import { NextResponse } from 'next/server';
import { requirePortalAuth } from '@/lib/auth/portal';
import { connectToDatabase } from '@/lib/db/mongodb';
import { SharedDocument } from '@/models/SharedDocument';
import crypto from 'crypto';
import { z } from 'zod';

const signSchema = z.object({
  sharedDocId: z.string().min(1, 'Shared Document ID is required'),
});

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const session = await requirePortalAuth();
    const { clientId, companyId } = session.user;

    const body = await request.json();
    const parsed = signSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { sharedDocId } = parsed.data;

    // Retrieve SharedDocument, ensuring strict client tenancy isolation
    const sharedDoc = await SharedDocument.findOne({
      _id: sharedDocId,
      clientId,
      companyId,
    });

    if (!sharedDoc) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Document not found or access denied.' },
        { status: 404 }
      );
    }

    // Presigned expiry window: exactly 5 minutes (300 seconds) from now
    const expires = Date.now() + 5 * 60 * 1000;

    // Cryptographic signature formula
    const secret =
      process.env.NEXTAUTH_SECRET || 'syncgrid-portal-super-secret-key-at-least-32-chars';
    const stringToSign = `${sharedDocId}:${expires}:${secret}`;
    const token = crypto.createHmac('sha256', secret).update(stringToSign).digest('hex');

    // Construct the authenticated, expiring download link
    const downloadUrl = `/api/portal/documents/download?id=${sharedDocId}&expires=${expires}&token=${token}`;

    return NextResponse.json({
      success: true,
      data: {
        downloadUrl,
        expiresAt: new Date(expires).toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Presigned Sign API Error:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
