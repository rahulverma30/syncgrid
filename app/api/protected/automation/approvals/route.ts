import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ApprovalChain, WorkflowExecution, WorkflowLog } from '@/models';
import { executeWorkflow } from '@/lib/automation/executionEngine';
import { broadcastEvent } from '@/lib/realtime';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;

    // Fetch approvals where the current user is active in the sequence
    const approvals = await ApprovalChain.find({
      companyId,
      status: 'pending',
    }).sort({ createdAt: -1 });

    // Filter down to steps matching active approver
    const activeApprovals = approvals.filter((app) => {
      const activeStep = app.steps[app.currentStepIndex];
      return activeStep && activeStep.approverId === userId && activeStep.status === 'pending';
    });

    return NextResponse.json({ success: true, data: activeApprovals });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'FETCH_APPROVALS_FAILED', message: error.message },
      { status: 500 }
    );
  }
});

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;

    const { approvalId, action, comment } = await request.json(); // action: 'approve' | 'reject'

    if (!approvalId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'BAD_REQUEST', message: 'Parameters mismatch.' },
        { status: 400 }
      );
    }

    const approval = await ApprovalChain.findOne({ _id: approvalId, companyId, status: 'pending' });

    if (!approval) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Pending approval chain not found.' },
        { status: 404 }
      );
    }

    const activeStep = approval.steps[approval.currentStepIndex];

    if (!activeStep || activeStep.approverId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'You are not the active approver for this step.',
        },
        { status: 403 }
      );
    }

    // 1. Record reviewer decision
    activeStep.status = action === 'approve' ? 'approved' : 'rejected';
    activeStep.comment = comment;
    activeStep.decidedAt = new Date();

    const executionId = approval.executionId;

    if (action === 'reject') {
      approval.status = 'rejected';
      await approval.save();

      // Cancel halted workflow execution
      if (executionId) {
        await WorkflowExecution.updateOne(
          { _id: executionId },
          { status: 'cancelled', endedAt: new Date() }
        );

        const log = new WorkflowLog({
          companyId,
          executionId,
          workflowId: approval.metadata?.workflowId || executionId,
          nodeId: executionId.toString(),
          level: 'error',
          message: `Sequential Approval rejected by ${activeStep.approverName}. Workflow execution cancelled.`,
        });
        await log.save();

        broadcastEvent({
          companyId: companyId.toString(),
          event: 'workflow_execution_cancelled',
          payload: { executionId, approvalId, status: 'cancelled' },
        });
      }

      return NextResponse.json({ success: true, data: approval });
    }

    // 2. If approved, check sequence list
    if (approval.currentStepIndex + 1 < approval.steps.length) {
      // Step sequentially to next supervisor
      approval.currentStepIndex += 1;
      await approval.save();

      if (executionId) {
        const nextStep = approval.steps[approval.currentStepIndex];
        const log = new WorkflowLog({
          companyId,
          executionId,
          workflowId: approval.metadata?.workflowId || executionId,
          nodeId: executionId.toString(),
          level: 'info',
          message: `Approval step ${approval.currentStepIndex} completed by ${activeStep.approverName}. Step advanced to: ${nextStep.approverName}.`,
        });
        await log.save();
      }
    } else {
      // End approval chain successfully
      approval.status = 'approved';
      await approval.save();

      if (executionId) {
        const log = new WorkflowLog({
          companyId,
          executionId,
          workflowId: approval.metadata?.workflowId || executionId,
          nodeId: executionId.toString(),
          level: 'success',
          message: `Sequential Approval chain completely approved. Resuming workflow engine.`,
        });
        await log.save();

        // RESUME THE ORCHESTRATION ENGINE
        executeWorkflow(executionId.toString()).catch(console.error);
      }
    }

    return NextResponse.json({ success: true, data: approval });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'RESOLVE_APPROVAL_FAILED', message: error.message },
      { status: 500 }
    );
  }
});
