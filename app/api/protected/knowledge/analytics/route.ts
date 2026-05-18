import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { WikiSpace, Document, ReadingProgress, KnowledgeActivity, Employee } from '@/models';
import { logger } from '@/lib/logger';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;

    // 1. Fetch space and doc counts
    const spacesCount = await WikiSpace.countDocuments({ companyId });
    const docsCount = await Document.countDocuments({
      companyId,
      deletedAt: null,
      isTemplate: false,
    });

    // 2. Calculate Stale Documents: updatedAt is older than 90 days (Quarterly stale alert threshold)
    const staleCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const staleDocs = await Document.find({
      companyId,
      deletedAt: null,
      isTemplate: false,
      updatedAt: { $lte: staleCutoff },
    })
      .select('title spaceId updatedAt icon')
      .populate('spaceId', 'name')
      .limit(6)
      .lean();

    // 3. Find Abandoned Documents (no updates in 180 days)
    const abandonedCutoff = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const abandonedDocsCount = await Document.countDocuments({
      companyId,
      deletedAt: null,
      updatedAt: { $lte: abandonedCutoff },
    });

    // 4. Compliance statistics
    const totalSopsCount = await Document.countDocuments({
      companyId,
      deletedAt: null,
      isSop: true,
    });
    const totalUsersCount = await Employee.countDocuments({ companyId });
    const maxPossibleCompletions = totalSopsCount * totalUsersCount;

    const actualCompletions = await ReadingProgress.countDocuments({
      companyId,
      acknowledged: true,
    });
    const complianceRate =
      maxPossibleCompletions > 0
        ? Math.round((actualCompletions / maxPossibleCompletions) * 100)
        : 100;

    // 5. Compute Knowledge Base Overall Health Score
    // Formula: baseline 100, decremented by stale and abandoned ratio, boosted by compliance rate
    const staleRatio = docsCount > 0 ? (staleDocs.length / docsCount) * 100 : 0;
    const healthScore = Math.max(
      10,
      Math.min(
        100,
        Math.round(100 - staleRatio * 0.4 - abandonedDocsCount * 3 + complianceRate * 0.3)
      )
    );

    // 6. Contribution Activity Log Feed
    const latestActivities = await KnowledgeActivity.find({ companyId })
      .populate('userId', 'name')
      .populate('documentId', 'title slug icon')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    // Trace Structured Observability Log
    logger.info(
      `[Knowledge Analytics Query] Co: ${companyId} User: ${userId} Health: ${healthScore}% SOPs: ${totalSopsCount}`,
      {
        companyId,
        userId,
        healthScore,
        complianceRate,
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        spacesCount,
        docsCount,
        staleDocs,
        totalSopsCount,
        complianceRate,
        abandonedDocsCount,
        healthScore,
        latestActivities,
      },
    });
  } catch (error: any) {
    logger.error('Failed to aggregate analytics:', error, { companyId: session?.user?.companyId });
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});
