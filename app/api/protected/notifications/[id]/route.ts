import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import mongoose from 'mongoose';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Notification } from '@/models';

// Mark single notification as read
export const PUT = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const notificationId = context.params.id;

    const notif = await Notification.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(notificationId),
        companyId: new mongoose.Types.ObjectId(companyId),
        userId: new mongoose.Types.ObjectId(userId),
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
      { new: true }
    );

    if (!notif) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: notif,
    });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
