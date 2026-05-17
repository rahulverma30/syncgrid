import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { processRecurringTasks } from '@/lib/recurrenceProcessor';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();

    // Restrict trigger execution to elevated roles (Admins/Managers) for additional security
    const userRole = session.user.role?.toLowerCase() || '';
    if (userRole !== 'admin' && userRole !== 'manager') {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Only managers or administrators can trigger recurrence queues.',
        },
        { status: 403 }
      );
    }

    const stats = await processRecurringTasks();

    return NextResponse.json({
      success: true,
      message: 'Recurrence execution run successfully completed.',
      stats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
