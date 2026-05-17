import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Task, User } from '@/models';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    // Load active (non-completed) sessional tasks
    const tasks = await Task.find({
      companyId,
      isArchived: false,
      isSoftDeleted: false,
    })
      .populate('statusId')
      .populate({ path: 'projectId', select: 'name code' });

    // Load all active company users
    const users = await User.find({ companyId, status: 'active' }).select('name email image');

    const standardWeeklyCapacityHours = 40;

    const workloadData = users.map((user) => {
      // Filter tasks assigned to this user that are active (not completed)
      const activeUserTasks = tasks.filter((task) => {
        const isAssigned = task.assignees.some((id: any) => id.toString() === user._id.toString());
        const isCompleted = task.statusId && task.statusId.category === 'done';
        return isAssigned && !isCompleted;
      });

      const totalEstimatedHours = activeUserTasks.reduce(
        (sum, t) => sum + (t.estimatedHours || 0),
        0
      );
      const totalActualHours = activeUserTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

      const allocationRatio = totalEstimatedHours / standardWeeklyCapacityHours;
      const isOverloaded = totalEstimatedHours > standardWeeklyCapacityHours;

      return {
        userId: user._id,
        userName: user.name,
        email: user.email,
        image: user.image,
        capacityHours: standardWeeklyCapacityHours,
        allocatedHours: Math.round(totalEstimatedHours),
        actualHoursLogged: Math.round(totalActualHours),
        allocationPercentage: Math.min(200, Math.round(allocationRatio * 100)),
        isOverloaded,
        burnoutWarning: isOverloaded,
        tasksCount: activeUserTasks.length,
        // Send basic details of tasks for drag-and-drop balancing
        tasks: activeUserTasks.map((t) => ({
          _id: t._id,
          code: t.code,
          title: t.title,
          projectId: t.projectId,
          priority: t.priority,
          estimatedHours: t.estimatedHours,
          status: t.statusId,
        })),
      };
    });

    return NextResponse.json({ success: true, data: workloadData });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'QUERY_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
