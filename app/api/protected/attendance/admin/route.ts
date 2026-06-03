import { NextResponse } from 'next/server';
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
    const date = url.searchParams.get('date') || today;

    // Fetch all logs for the given date, populated with user info
    const logs = await AttendanceLog.find({
      companyId: new mongoose.Types.ObjectId(companyId),
      date: date,
    })
      .populate('userId', 'name email image')
      .lean();

    // Fetch all active internal users to cross-reference who hasn't punched in
    // Internal users meaning not client-portal users. (Checking User model)
    const users = await User.find({
      companyId: new mongoose.Types.ObjectId(companyId),
      role: { $ne: 'client' }, // assuming we only want staff, this might vary depending on schema
      isActive: true, // or status: 'active'
    })
      .select('name email image role')
      .lean();

    const logsMap = new Map();
    logs.forEach((log) => logsMap.set(log.userId?._id?.toString(), log));

    const combinedData = users.map((user) => {
      const log = logsMap.get(user._id.toString());

      let status = 'Offline';
      if (log) {
        if (log.punchOut) {
          status = 'Punched Out';
        } else if (log.punchIn) {
          if (log.breaks && log.breaks.length > 0 && !log.breaks[log.breaks.length - 1].end) {
            status = 'On Break';
          } else {
            status = 'Working';
          }
        }
      }

      return {
        user,
        log: log || null,
        status,
      };
    });

    return NextResponse.json({ success: true, data: combinedData });
  } catch (error: any) {
    console.error('Fetch Admin Attendance Error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
