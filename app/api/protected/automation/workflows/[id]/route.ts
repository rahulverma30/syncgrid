import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { WorkflowDefinition, EventSubscription } from '@/models';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const { id } = context.params;

    const workflow = await WorkflowDefinition.findOne({
      _id: id,
      companyId,
      isArchived: false,
    });

    if (!workflow) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Workflow not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: workflow });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'FETCH_WORKFLOW_FAILED', message: error.message },
      { status: 500 }
    );
  }
});

export const PUT = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const { id } = context.params;

    const body = await request.json();
    const workflow = await WorkflowDefinition.findOne({
      _id: id,
      companyId,
      isArchived: false,
    });

    if (!workflow) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Workflow not found.' },
        { status: 404 }
      );
    }

    // Merge changes
    const previousStatus = workflow.status;
    if (body.name !== undefined) workflow.name = body.name;
    if (body.description !== undefined) workflow.description = body.description;
    if (body.category !== undefined) workflow.category = body.category;
    if (body.triggerConfig !== undefined) workflow.triggerConfig = body.triggerConfig;
    if (body.actionChain !== undefined) workflow.actionChain = body.actionChain;
    if (body.conditions !== undefined) workflow.conditions = body.conditions;
    if (body.status !== undefined) workflow.status = body.status;
    if (body.retryPolicy !== undefined) workflow.retryPolicy = body.retryPolicy;

    // Increment version if updating an active workflow's structure
    if (previousStatus === 'active' && body.actionChain !== undefined) {
      workflow.version += 1;
    }

    await workflow.save();

    // Dynamically manage multi-tenant event triggers subscription index
    if (workflow.status === 'active') {
      await EventSubscription.findOneAndUpdate(
        { companyId, workflowId: workflow._id },
        { eventName: workflow.triggerConfig.type, active: true },
        { upsert: true, new: true }
      );
    } else {
      await EventSubscription.findOneAndUpdate(
        { companyId, workflowId: workflow._id },
        { active: false }
      );
    }

    return NextResponse.json({ success: true, data: workflow });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'UPDATE_WORKFLOW_FAILED', message: error.message },
      { status: 500 }
    );
  }
});

export const DELETE = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const { id } = context.params;

    const workflow = await WorkflowDefinition.findOne({
      _id: id,
      companyId,
      isArchived: false,
    });

    if (!workflow) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Workflow not found.' },
        { status: 404 }
      );
    }

    // Soft delete
    workflow.isArchived = true;
    await workflow.save();

    // Disable any active event subscription
    await EventSubscription.findOneAndUpdate(
      { companyId, workflowId: workflow._id },
      { active: false }
    );

    return NextResponse.json({ success: true, message: 'Workflow archived cleanly.' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'DELETE_WORKFLOW_FAILED', message: error.message },
      { status: 500 }
    );
  }
});
