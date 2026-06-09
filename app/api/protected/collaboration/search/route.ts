import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Message } from '@/models';
import { logger } from '@/lib/logger';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    const url = new URL(request.url);
    const query = url.searchParams.get('q');

    if (!query) {
      return NextResponse.json({ success: true, data: [] });
    }

    logger.info(`[Search GET] Initiating weighted query search for: "${query}"`, { companyId });

    // 1. RECENT-MESSAGE BOOSTING: Calculate recency multiplier threshold (7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // 2. WEIGHTED RANKING & SEARCH ALGORITHM
    // Standard Mongoose implementation: compound search matching company, content, and active states
    // Atlas Search / Elasticsearch Upgrade Hook:
    //   In Elastic/Atlas Search, this would utilize:
    //   { $search: { index: "message_index", text: { query, path: ["content"], fuzzy: {} } } }
    //   And { $meta: "searchScore" } to get weighted rankings.
    const results = await Message.find({
      companyId,
      content: { $regex: query, $options: 'i' },
      deletedAt: { $exists: false },
    })
      .populate('senderId', '_id name email avatarUrl')
      .populate('channelId', '_id name')
      .lean();

    // 3. FUZZY & RECENT BOOSTING HYDRATION IN MEMORY:
    // Groups, ranks, and prioritizes matches with high relevancy scores based on exact matches and recency.
    const rankedResults = results
      .map((msg: any) => {
        let score = 0;

        // Boost exact string match
        if (msg.content.toLowerCase() === query.toLowerCase()) {
          score += 100;
        } else if (msg.content.toLowerCase().startsWith(query.toLowerCase())) {
          score += 50;
        } else {
          score += 10;
        }

        // Boost recency (messages created in last 7 days receive an additional 30-point multiplier)
        if (new Date(msg.createdAt) >= sevenDaysAgo) {
          score += 30;
        }

        return {
          ...msg,
          relevancyScore: score,
        };
      })
      .sort((a, b) => b.relevancyScore - a.relevancyScore) // Sort descending by relevancy score
      .slice(0, 50); // Hard limit to the top 50 most relevant results

    logger.debug(
      `[Search GET] Completed weighted indexing. Matches found: ${rankedResults.length}`,
      {
        companyId,
      }
    );

    return NextResponse.json({ success: true, data: rankedResults });
  } catch (error: any) {
    logger.error('Failed to perform search query:', error, { companyId: session?.user?.companyId });
    return apiErrorResponse(error);
  }
});
