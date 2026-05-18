import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { SharedDocument } from '@/models/SharedDocument';
import { Document } from '@/models/Document';
import { logSecurityEvent } from '@/lib/security/logger';
import { getPortalSession } from '@/lib/auth/portal';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const sharedDocId = searchParams.get('id');
    const expiresStr = searchParams.get('expires');
    const token = searchParams.get('token');

    if (!sharedDocId || !expiresStr || !token) {
      return new Response('Forbidden: Missing signature parameters.', { status: 403 });
    }

    const expires = parseInt(expiresStr, 10);
    if (isNaN(expires) || Date.now() > expires) {
      return new Response('Forbidden: Presigned download link has expired.', { status: 403 });
    }

    // Recalculate HMAC-SHA256 signature and match against client-supplied token
    const secret =
      process.env.NEXTAUTH_SECRET || 'syncgrid-portal-super-secret-key-at-least-32-chars';
    const stringToSign = `${sharedDocId}:${expires}:${secret}`;
    const calculatedToken = crypto.createHmac('sha256', secret).update(stringToSign).digest('hex');

    if (calculatedToken !== token) {
      return new Response('Forbidden: Invalid cryptographic signature.', { status: 403 });
    }

    // Resolve document details
    const sharedDoc = await SharedDocument.findById(sharedDocId).populate({
      path: 'documentId',
      model: Document,
    });

    if (!sharedDoc || !sharedDoc.documentId) {
      return new Response('Not Found: The target document does not exist.', { status: 404 });
    }

    // Retrieve active session details for security auditing (degrades gracefully if logged out)
    const session = await getPortalSession();
    const portalUserId = session?.user?.id || sharedDoc.sharedBy || 'Unknown';
    const portalUserName = session?.user?.name || 'External Stakeholder';

    // Log the file access/download in compliance logs
    await logSecurityEvent({
      companyId: sharedDoc.companyId.toString(),
      clientId: sharedDoc.clientId.toString(),
      portalUserId,
      portalUserName,
      eventType: 'download_doc',
      severity: 'info',
      actionDetails: `Client Portal user "${portalUserName}" downloaded document: "${sharedDoc.documentId.name}" (ID: ${sharedDoc.documentId._id.toString()}).`,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'Unknown Browser',
    });

    // Support redirect or fallback inline streaming
    const documentUrl = sharedDoc.documentId.url;
    if (
      documentUrl &&
      (documentUrl.startsWith('http://') ||
        documentUrl.startsWith('https://') ||
        documentUrl.startsWith('/'))
    ) {
      return NextResponse.redirect(new URL(documentUrl, request.url));
    }

    // Fallback stream for local test mock assets
    const fallbackBuffer = Buffer.from(
      `SyncGrid Document Share: ${sharedDoc.documentId.name}\nShared via secure expiring link.`
    );
    return new Response(fallbackBuffer, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${sharedDoc.documentId.name || 'document.txt'}"`,
      },
    });
  } catch (error: any) {
    console.error('Presigned Download GET Error:', error);
    return new Response('Internal Server Error: ' + error.message, { status: 500 });
  }
}
