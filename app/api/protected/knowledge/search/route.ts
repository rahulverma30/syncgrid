import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Document } from '@/models';
import { logger } from '@/lib/logger';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const { searchParams } = new URL(request.url);
    const queryStr = searchParams.get('q') || '';

    if (!queryStr.trim()) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Connect and retrieve all company docs to perform O(1) in-memory ranking
    const documents = await Document.find({
      companyId,
      deletedAt: null,
      status: 'published',
      isTemplate: false,
    })
      .populate('spaceId', 'name icon')
      .lean();

    const queryLower = queryStr.toLowerCase();
    const rankedResults = documents
      .map((doc: any) => {
        let score = 0;
        const titleLower = (doc.title || '').toLowerCase();
        const contentLower = (doc.content || '').toLowerCase();

        // 1. Title Exact match / Containment weights
        if (titleLower === queryLower) {
          score += 100;
        } else if (titleLower.includes(queryLower)) {
          score += 50;
        }

        // 2. Content matches count weights
        const contentMatches = (contentLower.match(new RegExp(escapeRegex(queryLower), 'g')) || []).length;
        score += contentMatches * 10;

        // 3. Tag checks
        const tagMatches = (doc.tags || []).filter((tag: string) => tag.toLowerCase().includes(queryLower)).length;
        score += tagMatches * 15;

        // 4. Recency Multiplier Boost: multiply score by 1.5 if document created within last 7 days
        const ageInMs = Date.now() - new Date(doc.createdAt).getTime();
        const ageInDays = ageInMs / (1000 * 60 * 60 * 24);
        if (ageInDays <= 7) {
          score = score * 1.5;
        }

        return { ...doc, searchScore: score };
      })
      .filter((doc) => doc.searchScore > 0)
      .sort((a, b) => b.searchScore - a.searchScore);

    return NextResponse.json({ success: true, data: rankedResults });
  } catch (error: any) {
    logger.error('Failed search execution:', error, { companyId: session?.user?.companyId });
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});

function escapeRegex(string: string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}
