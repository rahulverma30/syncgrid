import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { WorkflowExecution, WorkflowLog } from '@/models';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    const url = new URL(request.url);
    const executionId = url.searchParams.get('executionId');

    if (executionId) {
      // Fetch details of a single execution plus its associated log trace
      const [execution, logs] = await Promise.all([
        WorkflowExecution.findOne({ _id: executionId, companyId })
          .populate({
            path: 'workflowId',
            select: 'name category',
          })
          .lean(),
        WorkflowLog.find({ executionId, companyId }).sort({ createdAt: 1 }).lean(),
      ]);

      if (!execution) {
        return NextResponse.json(
          { success: false, error: 'NOT_FOUND', message: 'Execution trace not found.' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: { execution, logs } });
    }

    // Fetch all executions timeline under tenant
    const executions = await WorkflowExecution.find({ companyId })
      .populate({
        path: 'workflowId',
        select: 'name category',
      })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ success: true, data: executions });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'FETCH_EXECUTIONS_FAILED', message: error.message },
      { status: 500 }
    );
  }
});
