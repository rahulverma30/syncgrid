import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Document, Employee } from '@/models';
import { rankDocuments } from '@/lib/searchEngine';
import { logger } from '@/lib/logger';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const queryStr = searchParams.get('q') || '';

    if (!queryStr.trim()) {
      return NextResponse.json({ success: true, data: [] });
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

    // 2. Connect and retrieve all company docs to rank
    const documents = await Document.find({
      companyId,
      deletedAt: null,
      status: 'published',
      isTemplate: false,
    })
      .populate('spaceId', 'name icon department')
      .populate('categoryId', 'name department')
      .lean();

    // 3. Rank documents with advanced scoring engine
    const rankedResults = rankDocuments(documents, queryStr, userId, userDepartment);

    return NextResponse.json({ success: true, data: rankedResults });
  } catch (error: any) {
    logger.error('Failed search execution:', error, { companyId: session?.user?.companyId });
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});
