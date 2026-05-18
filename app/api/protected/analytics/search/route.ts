import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { SavedReport, KPIConfiguration } from '@/models';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';

    if (!query) {
      return NextResponse.json({ success: true, data: [] });
    }

    const regex = new RegExp(query, 'i');

    // Query both collections in parallel
    const [reports, kpis] = await Promise.all([
      SavedReport.find({ companyId, name: regex }).limit(5),
      KPIConfiguration.find({ companyId, title: regex }).limit(5),
    ]);

    const results: any[] = [];

    reports.forEach((rep) => {
      results.push({
        id: rep._id,
        title: rep.name,
        type: 'report',
        category: rep.type,
        url: `/analytics?tab=builder&id=${rep._id}`,
        description: `Saved custom ${rep.type} builder report.`,
      });
    });

    kpis.forEach((kpi) => {
      results.push({
        id: kpi._id,
        title: kpi.title,
        type: 'kpi',
        category: kpi.metricName,
        url: `/analytics?tab=kpi`,
        description: `Active corporate target goal metric: ${kpi.targetValue}${kpi.unit === 'percent' ? '%' : ''}.`,
      });
    });

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'SEARCH_FAILED', message: error.message },
      { status: 500 }
    );
  }
});
