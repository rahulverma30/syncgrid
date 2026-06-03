import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AttendanceLog } from '@/models';
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

    if (!log || !log.punchIn) {
      return NextResponse.json(
        { success: false, error: 'NO_PUNCH_IN', message: 'You must punch in first.' },
        { status: 400 }
      );
    }

    if (log.punchOut) {
      return NextResponse.json(
        { success: false, error: 'ALREADY_PUNCHED_OUT', message: 'You have already punched out.' },
        { status: 400 }
      );
    }

    if (log.breaks && log.breaks.length > 0) {
      const activeBreak = log.breaks[log.breaks.length - 1];
      if (!activeBreak.end) {
        return NextResponse.json(
          { success: false, error: 'ALREADY_ON_BREAK', message: 'You are already on a break.' },
          { status: 400 }
        );
      }
    }

    log.breaks.push({ start: new Date() });
    await log.save();

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

    if (!log || !log.punchIn) {
      return NextResponse.json(
        { success: false, error: 'NO_PUNCH_IN', message: 'You must punch in first.' },
        { status: 400 }
      );
    }

    if (!log.breaks || log.breaks.length === 0) {
      return NextResponse.json(
        { success: false, error: 'NOT_ON_BREAK', message: 'You are not on a break.' },
        { status: 400 }
      );
    }

    const activeBreak = log.breaks[log.breaks.length - 1];
    if (activeBreak.end) {
      return NextResponse.json(
        { success: false, error: 'NOT_ON_BREAK', message: 'You are not on a break.' },
        { status: 400 }
      );
    }

    activeBreak.end = new Date();
    activeBreak.duration = Math.round(
      (activeBreak.end.getTime() - activeBreak.start.getTime()) / 60000
    );

    log.breakMinutes = (log.breakMinutes || 0) + activeBreak.duration;

    await log.save();

    return NextResponse.json({ success: true, data: log });
  } catch (error: any) {
    console.error('End Break Error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
