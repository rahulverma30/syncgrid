import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AttendanceLog } from '@/models/AttendanceLog';
import { Project } from '@/models/Project';
import { ProjectActivity } from '@/models/ProjectActivity';
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
    const body = await request.json().catch(() => ({}));
    const today = body.localDate || getTodayString();

    const existingLog = await AttendanceLog.findOne({
      companyId: new mongoose.Types.ObjectId(companyId),
      userId: new mongoose.Types.ObjectId(userId),
      date: today,
    });

    if (existingLog) {
      if (existingLog.startTime) {
        return NextResponse.json(
          {
            success: false,
            error: 'ALREADY_STARTED',
            message: 'You have already started a session today.',
          },
          { status: 400 }
        );
      }
    }

    if (!body.projectId || !body.description) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Project and Description are required to start work.',
        },
        { status: 400 }
      );
    }

    const log = await AttendanceLog.findOneAndUpdate(
      {
        companyId: new mongoose.Types.ObjectId(companyId),
        userId: new mongoose.Types.ObjectId(userId),
        date: today,
      },
      {
        $set: {
          startTime: new Date(),
          status: 'Working',
          projectId: body.projectId,
          description: body.description,
        },
      },
      { new: true, upsert: true }
    );

    // Track Project Activity if projectId is provided
    if (body.projectId) {
      await ProjectActivity.create({
        companyId,
        projectId: body.projectId,
        type: 'internal',
        title: 'Work Session Started',
        description: `Employee started work: ${body.description}`,
        userName: session.user.name,
      });
    }

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
    const body = await request.json().catch(() => ({}));
    const today = body.localDate || getTodayString();

    const log = await AttendanceLog.findOne({
      companyId: new mongoose.Types.ObjectId(companyId),
      userId: new mongoose.Types.ObjectId(userId),
      date: today,
    });

    if (!log) {
      return NextResponse.json(
        { success: false, error: 'NO_SESSION', message: 'You must start work first.' },
        { status: 400 }
      );
    }

    if (log.endTime) {
      return NextResponse.json(
        {
          success: false,
          error: 'ALREADY_ENDED',
          message: 'You have already ended work today.',
        },
        { status: 400 }
      );
    }

    // Check if on active pause and end it
    if (log.pauses && log.pauses.length > 0) {
      const activePause = log.pauses[log.pauses.length - 1];
      if (!activePause.end) {
        activePause.end = new Date();
        activePause.duration = Math.round(
          (activePause.end.getTime() - activePause.start.getTime()) / 60000
        );
        log.breakMinutes += activePause.duration;
      }
    }

    log.endTime = new Date();
    log.status = 'Completed';

    // Calculate total worked minutes (duration between startTime and endTime minus breaks)
    const grossMinutes = Math.round((log.endTime.getTime() - log.startTime.getTime()) / 60000);
    const netMinutes = Math.max(0, grossMinutes - (log.breakMinutes || 0));
    log.totalWorkedMinutes = netMinutes;

    // Standard 8 hours (480 mins) for overtime calc
    if (netMinutes > 480) {
      log.overtimeMinutes = netMinutes - 480;
    }

    await log.save();

    // Increment actual hours on the linked project and log activity
    if (log.projectId) {
      const loggedHours = netMinutes / 60;
      await Project.updateOne(
        { _id: log.projectId, companyId },
        { $inc: { actualHours: loggedHours } }
      );

      await ProjectActivity.create({
        companyId,
        projectId: log.projectId,
        type: 'internal',
        title: 'Work Session Completed',
        description: `Employee logged ${loggedHours.toFixed(2)} hours.`,
        userName: session.user.name,
      });
    }

    return NextResponse.json({ success: true, data: log });
  } catch (error: any) {
    console.error('Punch Out Error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
