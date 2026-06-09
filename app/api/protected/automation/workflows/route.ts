import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { WorkflowDefinition } from '@/models';
import { z } from 'zod';

const CreateWorkflowSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  category: z.enum(['hr', 'finance', 'project', 'operations', 'general']).default('general'),
  triggerConfig: z.object({
    type: z.string(),
    options: z.record(z.any()).optional(),
  }),
  actionChain: z.array(
    z.object({
      actionId: z.string(),
      type: z.string(),
      options: z.record(z.any()).optional(),
    })
  ),
  conditions: z
    .object({
      logicalOperator: z.enum(['and', 'or']).default('and'),
      rules: z.array(
        z.object({
          field: z.string(),
          operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'in']),
          value: z.any(),
        })
      ),
    })
    .optional(),
});

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    const workflows = await WorkflowDefinition.find({
      companyId,
      isArchived: false,
    })
      .select('-actionChain -conditions')
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: workflows });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;

    const body = await request.json();
    const parsed = CreateWorkflowSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const workflow = new WorkflowDefinition({
      ...parsed.data,
      companyId,
      ownerId: userId,
      status: 'draft',
      version: 1,
      isArchived: false,
    });

    await workflow.save();

    return NextResponse.json({ success: true, data: workflow }, { status: 201 });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
