import { NextResponse } from 'next/server';
import { withApiPermission } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Document, Employee, WikiSpace } from '@/models';
import { rankDocuments } from '@/lib/searchEngine';
import { logger } from '@/lib/logger';
import { analyticsCache } from '@/lib/cache/analyticsCache';
import { hasPermission } from '@/lib/auth/permission-checks';

export const GET = withApiPermission(
  'wiki',
  'read',
  async (request: Request, context: any, session: any) => {
    try {
      await connectToDatabase();
      const companyId = session.user.companyId;
      const userId = session.user.id;
      const { searchParams } = new URL(request.url);
      const queryStr = searchParams.get('q') || '';

      if (!queryStr.trim()) {
        return NextResponse.json({ success: true, data: [] });
      }

      const cacheKeyObj = { queryStr, userId };
      const cachedResults = await analyticsCache.get<any>(
        companyId,
        'knowledge-search',
        cacheKeyObj
      );
      if (cachedResults) {
        logger.info('Cache HIT for knowledge base fuzzy search query:', { queryStr, companyId });
        return NextResponse.json({ success: true, data: cachedResults });
      }

      // 1. Fetch user department to perform department-aware relevance boosting
      let userDepartment = '';
      try {
        const employee = await Employee.findOne({ userId, companyId })
          .populate('departmentId')
          .lean();
        if (employee && employee.departmentId) {
          userDepartment = (employee.departmentId as any).name || '';
        }
      } catch (err: any) {
        logger.warn('Failed to retrieve employee department for search ranking:', {
          error: err.message,
        });
      }

      // Resolve visible spaces for authorization filtering
      const isAdmin = hasPermission(session.user.permissions || [], 'wiki', 'manage');
      let spacesQuery: any = { companyId };
      if (!isAdmin) {
        spacesQuery.$or = [
          { visibility: { $in: ['public', 'internal'] } },
          { 'permissions.userId': userId },
        ];
      }
      const visibleSpaces = await WikiSpace.find(spacesQuery).select('_id').lean();
      const visibleSpaceIds = visibleSpaces.map((s) => s._id);

      // 2. Connect and retrieve authorized company docs to rank
      const documents = await Document.find({
        companyId,
        spaceId: { $in: visibleSpaceIds },
        deletedAt: null,
        status: 'published',
        isTemplate: false,
      })
        .populate('spaceId', 'name icon department')
        .populate('categoryId', 'name department')
        .lean();

      // 3. Rank documents with advanced scoring engine
      const rankedResults = rankDocuments(documents, queryStr, userId, userDepartment);

      // Cache the fuzzy-ranked document search results for 30 seconds
      await analyticsCache.set(companyId, 'knowledge-search', cacheKeyObj, rankedResults, 30);

      return NextResponse.json({ success: true, data: rankedResults });
    } catch (error: any) {
      logger.error('Failed search execution:', error, { companyId: session?.user?.companyId });
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
  }
);
