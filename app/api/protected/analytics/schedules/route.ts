import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ReportSchedule, SavedReport } from '@/models';
import { hasRole } from '@/lib/auth/permission-checks';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    const schedules = await ReportSchedule.find({ companyId })
      .populate({ path: 'reportId', select: 'name type' })
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: schedules });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const roles = session.user.roles || [];

    const isAuthorized = hasRole(roles, ['super-admin', 'admin', 'finance']);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { reportId, frequency, recipients, active = true } = await request.json();

    if (!reportId || !frequency || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'BAD_REQUEST',
          message: 'Missing reportId, frequency, or recipients',
        },
        { status: 400 }
      );
    }

    const report = await SavedReport.findOne({ _id: reportId, companyId });
    if (!report) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Saved report not found' },
        { status: 404 }
      );
    }

    // Calculate next run date
    const now = new Date();
    let nextRun = new Date();
    if (frequency === 'daily') {
      nextRun.setDate(now.getDate() + 1);
    } else if (frequency === 'weekly') {
      nextRun.setDate(now.getDate() + 7);
    } else {
      nextRun.setMonth(now.getMonth() + 1);
    }

    let schedule = await ReportSchedule.findOne({ companyId, reportId });

    if (schedule) {
      schedule.frequency = frequency;
      schedule.recipients = recipients;
      schedule.active = active;
      schedule.nextRun = nextRun;
      await schedule.save();
    } else {
      schedule = new ReportSchedule({
        companyId,
        reportId,
        frequency,
        recipients,
        active,
        nextRun,
      });
      await schedule.save();

      // Back-reference schedule ID inside SavedReport
      report.scheduleId = schedule._id;
      await report.save();
    }

    return NextResponse.json({ success: true, data: schedule });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
