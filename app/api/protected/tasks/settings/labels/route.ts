import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { TaskLabel } from '@/models';
import { TaskLabelSchema } from '@/schemas/task';

const DEFAULT_LABELS = [
  { name: 'Feature', color: '#10b981', description: 'New capability or improvement' },
  { name: 'Bug', color: '#ef4444', description: 'Defect or unexpected behavior' },
  { name: 'Chore', color: '#6b7280', description: 'General operational work' },
  {
    name: 'Refactor',
    color: '#8b5cf6',
    description: 'Restructuring code without behavioral changes',
  },
  { name: 'Support', color: '#f59e0b', description: 'Customer help request or guidance' },
];

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    let labels = await TaskLabel.find({ companyId }).sort({ name: 1 });

    if (labels.length === 0) {
      const seeded = DEFAULT_LABELS.map((label) => ({
        ...label,
        companyId,
      }));
      await TaskLabel.insertMany(seeded);
      labels = await TaskLabel.find({ companyId }).sort({ name: 1 });
    }

    return NextResponse.json({ success: true, data: labels });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const body = await request.json();

    const parseResult = TaskLabelSchema.safeParse(body);
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

    // Check duplicate name
    const exists = await TaskLabel.findOne({
      companyId,
      name: { $regex: new RegExp(`^${validated.name}$`, 'i') },
    });
    if (exists) {
      return NextResponse.json(
        {
          success: false,
          error: 'DUPLICATE_NAME',
          message: `A label named "${validated.name}" already exists.`,
        },
        { status: 400 }
      );
    }

    const label = new TaskLabel({
      companyId,
      ...validated,
    });

    await label.save();

    return NextResponse.json({ success: true, data: label }, { status: 201 });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
