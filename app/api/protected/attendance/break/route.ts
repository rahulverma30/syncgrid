import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AttendanceLog } from '@/models/AttendanceLog';
import { ProjectActivity } from '@/models/ProjectActivity';
import mongoose from 'mongoose';

const getTodayString = (date = new Date()) => {
  return date.toISOString().split('T')[0];
};

// START BREAK
export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const body = await request.json().catch(() => ({}));
    const today = body.localDate || getTodayString();

    const log = await AttendanceLog.findOne({
      companyId: new mongoose.Types.ObjectId(companyId),
      userId: new mongoose.Types.ObjectId(userId),
      date: today,
    });

    if (!log || !log.startTime) {
      return NextResponse.json(
        { success: false, error: 'NO_SESSION', message: 'You must start work first.' },
        { status: 400 }
      );
    }

    if (log.endTime) {
      return NextResponse.json(
        { success: false, error: 'ALREADY_ENDED', message: 'You have already ended work.' },
        { status: 400 }
      );
    }

    if (log.pauses && log.pauses.length > 0) {
      const activePause = log.pauses[log.pauses.length - 1];
      if (!activePause.end) {
        return NextResponse.json(
          { success: false, error: 'ALREADY_PAUSED', message: 'You are already on a pause.' },
          { status: 400 }
        );
      }
    }

    log.pauses.push({ start: new Date() });
    log.status = 'Paused';
    await log.save();

    if (log.projectId) {
      await ProjectActivity.create({
        companyId,
        projectId: log.projectId,
        type: 'internal',
        title: 'Work Session Paused',
        description: 'Employee paused their work session.',
        userName: session.user.name,
      });
    }

    return NextResponse.json({ success: true, data: log });
  } catch (error: any) {
    console.error('Start Break Error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error.message },
      { status: 500 }
    );
  }
});

// END BREAK
export const PUT = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const body = await request.json().catch(() => ({}));
    const today = body.localDate || getTodayString();

    const log = await AttendanceLog.findOne({
      companyId: new mongoose.Types.ObjectId(companyId),
      userId: new mongoose.Types.ObjectId(userId),
      date: today,
    });

    if (!log || !log.startTime) {
      return NextResponse.json(
        { success: false, error: 'NO_SESSION', message: 'You must start work first.' },
        { status: 400 }
      );
    }

    if (!log.pauses || log.pauses.length === 0) {
      return NextResponse.json(
        { success: false, error: 'NOT_PAUSED', message: 'You are not paused.' },
        { status: 400 }
      );
    }

    const activePause = log.pauses[log.pauses.length - 1];
    if (activePause.end) {
      return NextResponse.json(
        { success: false, error: 'NOT_PAUSED', message: 'You are not paused.' },
        { status: 400 }
      );
    }

    activePause.end = new Date();
    activePause.duration = Math.round(
      (activePause.end.getTime() - activePause.start.getTime()) / 60000
    );

    log.breakMinutes = (log.breakMinutes || 0) + activePause.duration;
    log.status = 'Working';

    await log.save();

    if (log.projectId) {
      await ProjectActivity.create({
        companyId,
        projectId: log.projectId,
        type: 'internal',
        title: 'Work Session Resumed',
        description: `Employee resumed work after a ${activePause.duration} minute break.`,
        userName: session.user.name,
      });
    }

    return NextResponse.json({ success: true, data: log });
  } catch (error: any) {
    console.error('End Break Error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
