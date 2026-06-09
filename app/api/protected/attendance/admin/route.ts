import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AttendanceLog, User } from '@/models';
import mongoose from 'mongoose';
import { hasRole } from '@/lib/auth/permission-checks';

const getTodayString = (date = new Date()) => {
  return date.toISOString().split('T')[0];
};

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    const roles = session.user.roles || [];
    const isAuthorized = hasRole(roles, ['super-admin', 'admin', 'hr']);

    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'Insufficient privileges to view company attendance.',
        },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const companyId = session.user.companyId;
    const today = getTodayString();

    const url = new URL(request.url);
    const date = url.searchParams.get('localDate') || url.searchParams.get('date') || today;

    // Fetch all logs for the given date, populated with user info
    const logs = await AttendanceLog.find({
      companyId: new mongoose.Types.ObjectId(companyId),
      date: date,
    })
      .populate('userId', 'name email image')
      .lean();

    // Fetch all active internal users to cross-reference who hasn't punched in
    const users = await User.find({
      companyId: new mongoose.Types.ObjectId(companyId),
      status: 'active',
    })
      .populate('roles', 'name')
      .select('name email image roles')
      .lean();

    const logsMap = new Map();
    logs.forEach((log) => logsMap.set(log.userId?._id?.toString(), log));

    const combinedData = users.map((user) => {
      const log = logsMap.get(user._id.toString());

      let status = 'Offline';
      if (log) {
        if (log.status) {
          status = log.status;
        } else if (log.endTime) {
          status = 'Completed';
        } else if (log.startTime) {
          if (log.pauses && log.pauses.length > 0 && !log.pauses[log.pauses.length - 1].end) {
            status = 'Paused';
          } else {
            status = 'Working';
          }
        }
      }

      return {
        user: {
          ...user,
          role: user.roles && user.roles.length > 0 ? user.roles[0].name : 'Employee',
        },
        log: log || null,
        status,
      };
    });

    return NextResponse.json({ success: true, data: combinedData });
  } catch (error: any) {
    console.error('Fetch Admin Attendance Error:', error);
    return apiErrorResponse(error);
  }
});
