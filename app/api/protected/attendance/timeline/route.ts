import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AttendanceLog } from '@/models/AttendanceLog';
import { TaskActivity } from '@/models/TaskActivity';
import { ProjectActivity } from '@/models/ProjectActivity';
import { Activity } from '@/models/Activity';
import { FinancialActivity } from '@/models/FinancialActivity';
import { AuditLog } from '@/models/AuditLog';
import { User } from '@/models/User';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const targetDate = searchParams.get('date'); // Expected format: YYYY-MM-DD

    if (!userId || !targetDate) {
      return NextResponse.json(
        { success: false, message: 'userId and date are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const companyId = session.user.companyId;

    // Fetch the target user to get their name
    const targetUser = await User.findById(userId).lean();
    if (!targetUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }
    const userName = targetUser.name;

    // Time boundaries for the day
    // The attendance date represents the local day. To query global collections, we need a time range.
    // Assuming the user's activities happened generally on this date.
    // For exact match, we need a start and end of day in UTC or local, but we'll use a broad 24h window based on the date string
    const startOfDay = new Date(`${targetDate}T00:00:00.000Z`);
    const endOfDay = new Date(`${targetDate}T23:59:59.999Z`);

    const dateQuery = { $gte: startOfDay, $lte: endOfDay };

    const [
      attendanceLog,
      taskActivities,
      projectActivities,
      activities,
      financialActivities,
      auditLogs,
    ] = await Promise.all([
      AttendanceLog.findOne({ companyId, userId, date: targetDate }).lean(),
      TaskActivity.find({ companyId, userId, createdAt: dateQuery }).lean(),
      ProjectActivity.find({ companyId, userName, createdAt: dateQuery }).lean(), // uses userName
      Activity.find({ companyId, userId, createdAt: dateQuery }).lean(),
      FinancialActivity.find({ companyId, userId, createdAt: dateQuery }).lean(),
      AuditLog.find({ companyId, actorId: userId, createdAt: dateQuery }).lean(),
    ]);

    // Aggregate into a single timeline feed
    const timeline: any[] = [];

    // 1. Process Attendance
    if (attendanceLog) {
      if (attendanceLog.punchIn) {
        timeline.push({
          id: `punch-in-${attendanceLog._id}`,
          type: 'punch_in',
          title: 'Punched In',
          description: 'Started the workday',
          module: 'Attendance',
          time: new Date(attendanceLog.punchIn),
        });
      }
      if (attendanceLog.punchOut) {
        timeline.push({
          id: `punch-out-${attendanceLog._id}`,
          type: 'punch_out',
          title: 'Punched Out',
          description: 'Ended the workday',
          module: 'Attendance',
          time: new Date(attendanceLog.punchOut),
        });
      }
      if (attendanceLog.breaks && Array.isArray(attendanceLog.breaks)) {
        attendanceLog.breaks.forEach((brk: any, i: number) => {
          if (brk.start) {
            timeline.push({
              id: `break-start-${attendanceLog._id}-${i}`,
              type: 'break_start',
              title: 'Started Break',
              description: 'Went on break',
              module: 'Attendance',
              time: new Date(brk.start),
            });
          }
          if (brk.end) {
            timeline.push({
              id: `break-end-${attendanceLog._id}-${i}`,
              type: 'break_end',
              title: 'Ended Break',
              description: `Returned from break (${brk.duration} min)`,
              module: 'Attendance',
              time: new Date(brk.end),
            });
          }
        });
      }
    }

    // 2. Process Task Activities
    taskActivities.forEach((act) => {
      timeline.push({
        id: `task-${act._id}`,
        type: act.type,
        title: act.title,
        description: act.description || 'Updated a task',
        module: 'Tasks',
        time: new Date(act.createdAt),
      });
    });

    // 3. Process Project Activities
    projectActivities.forEach((act) => {
      timeline.push({
        id: `project-${act._id}`,
        type: act.type,
        title: act.title,
        description: act.description || 'Updated a project',
        module: 'Projects',
        time: new Date(act.createdAt),
      });
    });

    // 4. Process General Activities
    activities.forEach((act) => {
      timeline.push({
        id: `activity-${act._id}`,
        type: act.type,
        title: act.title,
        description: act.description || 'Performed an action',
        module: 'General',
        time: new Date(act.createdAt),
      });
    });

    // 5. Process Financial Activities
    financialActivities.forEach((act) => {
      timeline.push({
        id: `finance-${act._id}`,
        type: act.type,
        title: act.title,
        description: act.description || 'Financial action',
        module: 'Finance',
        time: new Date(act.createdAt),
      });
    });

    // 6. Process Audit Logs (CRM, Policies, Roles, etc.)
    auditLogs.forEach((log) => {
      timeline.push({
        id: `audit-${log._id}`,
        type: log.action,
        title: `Audit: ${log.action}`,
        description: `Modified ${log.resource}`,
        module: 'System',
        time: new Date(log.createdAt),
      });
    });

    // Sort by time ascending (chronological)
    timeline.sort((a, b) => a.time.getTime() - b.time.getTime());

    // Compute basic employee stats for the drawer header
    const stats = {
      status: 'Offline', // Default
      todayHours: 0,
      breakTime: 0,
      overtime: 0,
      lastActivity: null as Date | null,
    };

    if (attendanceLog) {
      stats.todayHours = attendanceLog.totalWorkedMinutes / 60;
      stats.breakTime = attendanceLog.breakMinutes / 60;
      stats.overtime = attendanceLog.overtimeMinutes / 60;

      if (attendanceLog.punchIn && !attendanceLog.punchOut) {
        // Find if currently on break
        const openBreak = attendanceLog.breaks?.find((b: any) => !b.end);
        stats.status = openBreak ? 'On Break' : 'Working';
      }
    }

    if (timeline.length > 0) {
      stats.lastActivity = timeline[timeline.length - 1].time;
    }

    return NextResponse.json({
      success: true,
      timeline,
      stats,
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
    });
  } catch (error: any) {
    console.error('Timeline API Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
