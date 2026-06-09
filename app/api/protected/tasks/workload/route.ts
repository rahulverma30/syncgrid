import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Task, User } from '@/models';
import { Project } from '@/models/Project';
import mongoose from 'mongoose';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const url = new URL(request.url);

    // Parse filter params
    const filterUserId = url.searchParams.get('userId') || '';
    const filterProjectId = url.searchParams.get('projectId') || '';
    const filterDateFrom = url.searchParams.get('dateFrom') || '';
    const filterDateTo = url.searchParams.get('dateTo') || '';

    // Build task query
    const taskQuery: Record<string, any> = {
      companyId,
      isArchived: false,
      isSoftDeleted: false,
    };

    if (filterProjectId && mongoose.isValidObjectId(filterProjectId)) {
      taskQuery.projectId = filterProjectId;
    }
    if (filterUserId && mongoose.isValidObjectId(filterUserId)) {
      taskQuery.assignees = filterUserId;
    }
    if (filterDateFrom || filterDateTo) {
      taskQuery.dueDate = {};
      if (filterDateFrom) taskQuery.dueDate.$gte = new Date(filterDateFrom);
      if (filterDateTo) taskQuery.dueDate.$lte = new Date(filterDateTo);
    }

    const tasks = await Task.find(taskQuery)
      .populate('statusId')
      .populate({ path: 'projectId', select: 'name code' });

    // Build user query
    // When a project filter is active, only show users who are team members of that project
    const userQuery: Record<string, any> = { companyId, status: 'active' };

    if (filterProjectId && mongoose.isValidObjectId(filterProjectId)) {
      // Fetch all tasks for this project to dynamically find who is working on it
      const projectTasks = await Task.find({
        companyId,
        projectId: filterProjectId,
        isArchived: false,
        isSoftDeleted: false,
      }).select('assignees');

      const assigneeIds = new Set<string>();
      projectTasks.forEach((t) => {
        t.assignees?.forEach((a: any) => assigneeIds.add(a.toString()));
      });

      if (assigneeIds.size > 0) {
        userQuery._id = { $in: Array.from(assigneeIds) };
      } else {
        // No one is assigned to any active tasks in this project
        return NextResponse.json({ success: true, data: [] });
      }
    }

    if (filterUserId && mongoose.isValidObjectId(filterUserId)) {
      if (userQuery._id && userQuery._id.$in) {
        // Intersect project members with selected member
        if (userQuery._id.$in.includes(filterUserId)) {
          userQuery._id = filterUserId;
        } else {
          // Selected user is not in the project
          return NextResponse.json({ success: true, data: [] });
        }
      } else {
        userQuery._id = filterUserId;
      }
    }

    const users = await User.find(userQuery).select('name email image');

    const standardWeeklyCapacityHours = 40;

    const workloadData = users
      .map((user) => {
        const activeUserTasks = tasks.filter((task) => {
          const isAssigned = task.assignees.some(
            (id: any) => id.toString() === user._id.toString()
          );
          const isDone = task.statusId?.category === 'done';
          return isAssigned && !isDone;
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
      })
      // When a project filter is active, only show members who have tasks in that project
      // (or always show all project team members even with 0 tasks when filter is active)
      .filter((member) => (filterProjectId ? true : true)); // always show; already scoped by user query

    return NextResponse.json({ success: true, data: workloadData });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
