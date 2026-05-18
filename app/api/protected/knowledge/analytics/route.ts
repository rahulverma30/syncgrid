import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { WikiSpace, Document, ReadingProgress, KnowledgeActivity, Employee } from '@/models';
import { logger } from '@/lib/logger';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    const spacesCount = await WikiSpace.countDocuments({ companyId });
    const docsCount = await Document.countDocuments({ companyId, deletedAt: null, isTemplate: false });

    // Calculate Stale Documents: updatedAt is older than 180 days
    const staleCutoff = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const staleDocs = await Document.find({
      companyId,
      deletedAt: null,
      isTemplate: false,
      updatedAt: { $lte: staleCutoff },
    })
      .select('title spaceId updatedAt icon')
      .populate('spaceId', 'name')
      .limit(5)
      .lean();

    // Compliance statistics
    const totalSopsCount = await Document.countDocuments({ companyId, deletedAt: null, isSop: true });
    const totalUsersCount = await Employee.countDocuments({ companyId });
    const maxPossibleCompletions = totalSopsCount * totalUsersCount;

    const actualCompletions = await ReadingProgress.countDocuments({ companyId, acknowledged: true });
    const complianceRate = maxPossibleCompletions > 0 ? Math.round((actualCompletions / maxPossibleCompletions) * 100) : 100;

    // Contribution Activity Log Feed
    const latestActivities = await KnowledgeActivity.find({ companyId })
      .populate('userId', 'name')
      .populate('documentId', 'title slug icon')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        spacesCount,
        docsCount,
        staleDocs,
        totalSopsCount,
        complianceRate,
        latestActivities,
      },
    });
  } catch (error: any) {
    logger.error('Failed to aggregate analytics:', error, { companyId: session?.user?.companyId });
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});
