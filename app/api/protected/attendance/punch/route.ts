import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AttendanceLog } from '@/models';
import mongoose from 'mongoose';

const getTodayString = (date = new Date()) => {
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
};

// PUNCH IN
export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const today = getTodayString();

    const existingLog = await AttendanceLog.findOne({
      companyId: new mongoose.Types.ObjectId(companyId),
      userId: new mongoose.Types.ObjectId(userId),
      date: today,
    });

    if (existingLog) {
      if (existingLog.punchIn) {
        return NextResponse.json(
          {
            success: false,
            error: 'ALREADY_PUNCHED_IN',
            message: 'You have already punched in today.',
          },
          { status: 400 }
        );
      }
    }

    const log = await AttendanceLog.findOneAndUpdate(
      {
        companyId: new mongoose.Types.ObjectId(companyId),
        userId: new mongoose.Types.ObjectId(userId),
        date: today,
      },
      {
        $set: {
          punchIn: new Date(),
          attendanceStatus: 'Present',
        },
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, data: log });
  } catch (error: any) {
    console.error('Punch In Error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error.message },
      { status: 500 }
    );
  }
});

// PUNCH OUT
export const PUT = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const today = getTodayString();

    const log = await AttendanceLog.findOne({
      companyId: new mongoose.Types.ObjectId(companyId),
      userId: new mongoose.Types.ObjectId(userId),
      date: today,
    });

    if (!log) {
      return NextResponse.json(
        { success: false, error: 'NO_PUNCH_IN', message: 'You must punch in first.' },
        { status: 400 }
      );
    }

    if (log.punchOut) {
      return NextResponse.json(
        {
          success: false,
          error: 'ALREADY_PUNCHED_OUT',
          message: 'You have already punched out today.',
        },
        { status: 400 }
      );
    }

    // Check if on active break and end it
    if (log.breaks && log.breaks.length > 0) {
      const activeBreak = log.breaks[log.breaks.length - 1];
      if (!activeBreak.end) {
        activeBreak.end = new Date();
        activeBreak.duration = Math.round(
          (activeBreak.end.getTime() - activeBreak.start.getTime()) / 60000
        );
        log.breakMinutes += activeBreak.duration;
      }
    }

    log.punchOut = new Date();

    // Calculate total worked minutes (duration between punchIn and punchOut minus breaks)
    const grossMinutes = Math.round((log.punchOut.getTime() - log.punchIn.getTime()) / 60000);
    const netMinutes = Math.max(0, grossMinutes - (log.breakMinutes || 0));
    log.totalWorkedMinutes = netMinutes;

    // Standard 8 hours (480 mins) for overtime calc
    if (netMinutes > 480) {
      log.overtimeMinutes = netMinutes - 480;
    }

    await log.save();

    return NextResponse.json({ success: true, data: log });
  } catch (error: any) {
    console.error('Punch Out Error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
