import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ClientProjectAccess } from '@/models/ClientProjectAccess';

/**
 * GET Visibility Rules for a specific Client
 */
export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'BAD_REQUEST', message: 'Missing clientId query parameter.' },
        { status: 400 }
      );
    }

    const rules = await ClientProjectAccess.find({ clientId });
    return NextResponse.json({ success: true, data: rules });
  } catch (error: any) {
    console.error('Rules GET error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST / Save Visibility Overrides
 */
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { clientId, rules } = body;

    if (!clientId || !Array.isArray(rules)) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Missing clientId or rules list parameters.',
        },
        { status: 400 }
      );
    }

    // Save rules dynamically utilizing bulk updating or loop updates
    for (const rule of rules) {
      if (!rule.projectId) continue;

      await ClientProjectAccess.updateOne(
        { clientId, projectId: rule.projectId },
        {
          $set: {
            isAccessAllowed: rule.isAccessAllowed ?? true,
            showMilestones: rule.showMilestones ?? true,
            showTasks: rule.showTasks ?? false,
            showBudgets: rule.showBudgets ?? false,
            showTimeLogs: rule.showTimeLogs ?? false,
          },
        },
        { upsert: true }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Client project visibility rules persisted successfully.',
    });
  } catch (error: any) {
    console.error('Rules POST error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
