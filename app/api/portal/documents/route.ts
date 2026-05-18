import { NextResponse } from 'next/server';
import { requirePortalAuth } from '@/lib/auth/portal';
import { connectToDatabase } from '@/lib/db/mongodb';
import { SharedDocument } from '@/models/SharedDocument';
import { Document } from '@/models/Document';

export async function GET() {
  try {
    await connectToDatabase();

    const session = await requirePortalAuth();
    const { clientId, companyId } = session.user;

    const now = new Date();

    // Retrieve SharedDocument pointers that are not expired
    const sharedDocs = await SharedDocument.find({
      companyId,
      clientId,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .populate({
        path: 'documentId',
        model: Document,
      })
      .sort({ createdAt: -1 });

    // Map outputs cleanly, ensuring client portal configuration rules
    const formattedDocs = sharedDocs
      .filter((sd) => sd.documentId) // Ensure referenced doc exists
      .map((sd) => {
        const docObj = sd.documentId.toObject();
        return {
          id: sd._id.toString(),
          documentId: docObj._id.toString(),
          name: sd.documentId.name || docObj.name,
          category: sd.documentId.category || docObj.category || 'general',
          url: sd.documentId.url || docObj.url,
          size: sd.documentId.size || docObj.size || 0,
          isDownloadable: sd.isDownloadable,
          isWatermarked: sd.isWatermarked,
          watermarkText: sd.watermarkText,
          expiresAt: sd.expiresAt,
          sharedBy: sd.sharedBy,
          createdAt: sd.createdAt,
        };
      });

    return NextResponse.json({ success: true, data: formattedDocs });
  } catch (error: any) {
    console.error('Portal Documents GET Error:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: 'QUERY_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
