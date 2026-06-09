import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AttendanceLog, AuditLog } from '@/models';
import mongoose from 'mongoose';
import { hasRole } from '@/lib/auth/permission-checks';

export const PUT = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const actorId = session.user.id;
    const roles = session.user.roles || [];

    // Only HR and Admins can perform corrections
    const isAuthorized = hasRole(roles, ['organization-owner', 'super-admin', 'admin', 'hr']);
    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'You do not have permission to correct attendance records.',
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { logId, startTime, endTime, projectId, description, action } = body;

    if (!logId) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: 'Log ID is required.' },
        { status: 400 }
      );
    }

    const log = await AttendanceLog.findOne({
      _id: new mongoose.Types.ObjectId(logId),
      companyId: new mongoose.Types.ObjectId(companyId),
    });

    if (!log) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Attendance log not found.' },
        { status: 404 }
      );
    }

    const originalData = {
      startTime: log.startTime,
      endTime: log.endTime,
      projectId: log.projectId,
      description: log.description,
      status: log.status,
    };

    if (action === 'force_end') {
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
    } else {
      if (startTime) log.startTime = new Date(startTime);
      if (endTime) log.endTime = new Date(endTime);
      if (projectId) log.projectId = projectId;
      if (description) log.description = description;

      if (log.endTime) {
        log.status = 'Completed';
      }
    }

    // Recalculate total worked minutes if we have both start and end
    if (log.startTime && log.endTime) {
      const grossMinutes = Math.round((log.endTime.getTime() - log.startTime.getTime()) / 60000);
      const netMinutes = Math.max(0, grossMinutes - (log.breakMinutes || 0));
      log.totalWorkedMinutes = netMinutes;
      if (netMinutes > 480) {
        log.overtimeMinutes = netMinutes - 480;
      } else {
        log.overtimeMinutes = 0;
      }
    }

    await log.save();

    // Generate Audit Log
    await AuditLog.create({
      companyId,
      actorId,
      action: 'attendance_correction',
      resource: 'attendance',
      resourceId: log._id.toString(),
      status: 'success',
      details: `HR corrected attendance for user ${log.userId}. Action: ${action || 'edit'}.`,
      metadata: {
        originalData,
        newData: {
          startTime: log.startTime,
          endTime: log.endTime,
          projectId: log.projectId,
          description: log.description,
          status: log.status,
        },
      },
    });

    return NextResponse.json({ success: true, data: log });
  } catch (error: any) {
    console.error('HR Correction Error:', error);
    return apiErrorResponse(error);
  }
});
