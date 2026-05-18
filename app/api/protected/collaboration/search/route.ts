import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Message } from '@/models';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    const url = new URL(request.url);
    const query = url.searchParams.get('q');

    if (!query) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Weighted index query search
    const results = await Message.find({
      companyId,
      content: { $regex: query, $options: 'i' },
      deletedAt: { $exists: false },
    })
      .populate('senderId', '_id name email avatarUrl')
      .populate('channelId', '_id name')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});
