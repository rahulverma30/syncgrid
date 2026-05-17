import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { TaskAutomationRule } from '@/models';
import { TaskAutomationRuleSchema } from '@/schemas/task';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    const rules = await TaskAutomationRule.find({ companyId })
      .populate({ path: 'trigger.statusId', select: 'name key' })
      .populate({ path: 'actions.statusId', select: 'name key' })
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: rules });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'QUERY_ERROR', message: error.message },
      { status: 500 }
    );
  }
});

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const body = await request.json();

    const parseResult = TaskAutomationRuleSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: parseResult.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const validated = parseResult.data;

    const rule = new TaskAutomationRule({
      companyId,
      ...validated,
    });

    await rule.save();

    // Populate references before returning
    const populated = await TaskAutomationRule.findById(rule._id)
      .populate({ path: 'trigger.statusId', select: 'name key' })
      .populate({ path: 'actions.statusId', select: 'name key' });

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
