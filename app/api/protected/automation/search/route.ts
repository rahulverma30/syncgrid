import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { WorkflowDefinition, WorkflowExecution } from '@/models';

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

    // Run parallel multi-tenant index lookups
    const [workflows, executions] = await Promise.all([
      WorkflowDefinition.find({ companyId, name: regex, isArchived: false }).limit(5),
      WorkflowExecution.find({ companyId, triggerEvent: regex }).limit(5),
    ]);

    const results: any[] = [];

    workflows.forEach((wf) => {
      results.push({
        id: wf._id,
        title: wf.name,
        type: 'definition',
        category: wf.category,
        url: `/automation?tab=builder&id=${wf._id}`,
        description: `Active operations configuration: ${wf.triggerConfig.type} trigger.`,
      });
    });

    executions.forEach((ex) => {
      results.push({
        id: ex._id,
        title: `Execution trace: ${ex.triggerEvent}`,
        type: 'execution',
        category: ex.status,
        url: `/automation?tab=executions&id=${ex._id}`,
        description: `Run trace in state: ${ex.status}. Completed steps count: ${ex.stepHistory.length}.`,
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
