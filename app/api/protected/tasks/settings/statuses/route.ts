import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { TaskStatus } from '@/models';
import { TaskStatusSchema } from '@/schemas/task';

// Default statuses to seed if none exist
const DEFAULT_STATUSES = [
  {
    name: 'Backlog',
    key: 'backlog',
    category: 'backlog',
    color: '#64748b',
    order: 10,
    isDefault: true,
    isSystem: true,
  },
  {
    name: 'Todo',
    key: 'todo',
    category: 'todo',
    color: '#3b82f6',
    order: 20,
    isDefault: false,
    isSystem: true,
  },
  {
    name: 'In Progress',
    key: 'in-progress',
    category: 'in_progress',
    color: '#f59e0b',
    order: 30,
    isDefault: false,
    isSystem: true,
  },
  {
    name: 'Review',
    key: 'review',
    category: 'in_progress',
    color: '#8b5cf6',
    order: 40,
    isDefault: false,
    isSystem: true,
  },
  {
    name: 'Testing',
    key: 'testing',
    category: 'in_progress',
    color: '#ec4899',
    order: 50,
    isDefault: false,
    isSystem: true,
  },
  {
    name: 'Completed',
    key: 'completed',
    category: 'done',
    color: '#10b981',
    order: 60,
    isDefault: false,
    isSystem: true,
  },
];

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    // Fetch custom workflow statuses
    let statuses = await TaskStatus.find({ companyId }).sort({ order: 1 });

    // Seed defaults if empty
    if (statuses.length === 0) {
      const seeded = DEFAULT_STATUSES.map((status) => ({
        ...status,
        companyId,
      }));
      await TaskStatus.insertMany(seeded);
      statuses = await TaskStatus.find({ companyId }).sort({ order: 1 });
    }

    return NextResponse.json({ success: true, data: statuses });
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

    const parseResult = TaskStatusSchema.safeParse(body);
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

    // Check key duplicate
    const exists = await TaskStatus.findOne({ companyId, key: validated.key });
    if (exists) {
      return NextResponse.json(
        {
          success: false,
          error: 'DUPLICATE_KEY',
          message: `A status key "${validated.key}" already exists.`,
        },
        { status: 400 }
      );
    }

    // Create custom status
    const status = new TaskStatus({
      companyId,
      ...validated,
      isSystem: false,
    });

    await status.save();

    return NextResponse.json({ success: true, data: status }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
