import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Project } from '@/models/Project';
import mongoose from 'mongoose';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    const companyIdObjectId = new mongoose.Types.ObjectId(companyId);

    const aggregates = await Project.aggregate([
      // 1. Filter by companyId and ignore archived projects
      { $match: { companyId: companyIdObjectId, isArchived: false } },
      // 2. Unwind the teamMembers array
      { $unwind: '$teamMembers' },
      // 3. Group by userName and sum up their allocation percentages
      {
        $group: {
          _id: '$teamMembers.userName',
          userName: { $first: '$teamMembers.userName' },
          totalAllocation: { $sum: '$teamMembers.allocation' },
          roles: { $addToSet: '$teamMembers.role' },
          projectCounts: { $sum: 1 },
          projects: {
            $push: {
              projectId: '$_id',
              projectName: '$name',
              role: '$teamMembers.role',
              allocation: '$teamMembers.allocation',
            },
          },
        },
      },
      // 4. Sort by totalAllocation descending
      { $sort: { totalAllocation: -1 } },
    ]);

    return NextResponse.json({ success: true, data: aggregates });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
