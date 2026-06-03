import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AttendanceLog } from '@/models';
import mongoose from 'mongoose';

const getTodayString = (date = new Date()) => {
  return date.toISOString().split('T')[0];
};

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    // Get URL params for date range if providing historical data
    const url = new URL(request.url);
    const localDate = url.searchParams.get('localDate');
    const today = localDate || getTodayString();

    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    if (startDate && endDate) {
      // Historical fetch
      const logs = await AttendanceLog.find({
        companyId: new mongoose.Types.ObjectId(companyId),
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
      })
        .sort({ date: -1 })
        .lean();

      return NextResponse.json({ success: true, data: logs });
    }

    // Default: Fetch today's session
    const log = await AttendanceLog.findOne({
      companyId: new mongoose.Types.ObjectId(companyId),
      userId: new mongoose.Types.ObjectId(userId),
      date: today,
    }).lean();

    return NextResponse.json({ success: true, data: log || null });
  } catch (error: any) {
    console.error('Fetch My Attendance Error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
