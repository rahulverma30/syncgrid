import { NextResponse } from 'next/server';
import { withApiPermission } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Task, TaskStatus, TaskActivity, Project } from '@/models';
import { TaskCreateSchema } from '@/schemas/task';
import { hasPermission } from '@/lib/auth/permission-checks';
import { rankTasks } from '@/lib/searchEngine';

export const GET = withApiPermission(
  'tasks',
  'read',
  async (request: Request, context: any, session: any) => {
    try {
      await connectToDatabase();
      const companyId = session.user.companyId;
      const userName = session.user.name;
      const userId = session.user.id;

      const url = new URL(request.url);
      const search = url.searchParams.get('search') || '';
      const projectId = url.searchParams.get('projectId') || '';
      const sprintId = url.searchParams.get('sprintId') || '';
      const milestoneId = url.searchParams.get('milestoneId') || '';
      const parentId = url.searchParams.get('parentId') || '';
      const priority = url.searchParams.get('priority') || '';
      const severity = url.searchParams.get('severity') || '';
      const statusId = url.searchParams.get('statusId') || '';
      const assigneeId = url.searchParams.get('assigneeId') || '';

      const isArchivedParam = url.searchParams.get('isArchived');
      const isArchived = isArchivedParam === 'true';

      const isSoftDeletedParam = url.searchParams.get('isSoftDeleted');
      const isSoftDeleted = isSoftDeletedParam === 'true';

      const query: Record<string, any> = {
        companyId,
        isArchived,
        isSoftDeleted,
      };

      // Filters
      if (projectId) query.projectId = projectId;
      if (sprintId) query.sprintId = sprintId === 'backlog' ? null : sprintId;
      if (milestoneId) query.milestoneId = milestoneId;

      // Parent hierarchy filter
      if (parentId) {
        query.parentId = parentId === 'null' ? null : parentId;
      }

      if (priority) query.priority = priority;
      if (severity) query.severity = severity;
      if (statusId) query.statusId = statusId;
      if (assigneeId) query.assignees = assigneeId;

      // Dynamic Permission check instead of hardcoded roles
      const hasElevatedAccess = hasPermission(session.user.permissions || [], 'tasks', 'manage');

      if (!hasElevatedAccess) {
        // Dev / standard QA constraints: Can see tasks in their projects, or where they are assignees/watchers
        const usersProjects = await Project.find({
          companyId,
          $or: [{ projectManager: userName }, { 'teamMembers.userName': userName }],
        })
          .select('_id')
          .lean();
        const projectIds = usersProjects.map((p) => p._id);

        query.$or = [
          { assignees: userId },
          { watchers: userId },
          { projectId: { $in: projectIds } },
        ];
      }

      // Fetch and populate references
      const tasks = await Task.find(query)
        .select('-checklistItems -attachments -dependencies')
        .populate({ path: 'projectId', select: 'name code' })
        .populate({ path: 'statusId', select: 'name key category color' })
        .populate({ path: 'assignees', select: 'name email image' })
        .sort({ createdAt: -1 })
        .lean();

      // Apply ranking if search term is provided
      const rankedTasks = search ? rankTasks(tasks, search, userId) : tasks;

      return NextResponse.json({ success: true, data: rankedTasks });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: 'QUERY_ERROR', message: error.message },
        { status: 500 }
      );
    }
  }
);

export const POST = withApiPermission(
  'tasks',
  'create',
  async (request: Request, context: any, session: any) => {
    try {
      await connectToDatabase();
      const companyId = session.user.companyId;
      const userId = session.user.id;
      const userName = session.user.name;
      const body = await request.json();

      const parseResult = TaskCreateSchema.safeParse(body);
      if (!parseResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'VALIDATION_ERROR',
            message: parseResult.error.errors[0].message,
            issues: parseResult.error.errors,
          },
          { status: 400 }
        );
      }

      const validated = parseResult.data;

      // Check status exists and belongs to company
      const status = await TaskStatus.findOne({ _id: validated.statusId, companyId });
      if (!status) {
        return NextResponse.json(
          { success: false, error: 'NOT_FOUND', message: 'TaskStatus not found' },
          { status: 404 }
        );
      }

      // Create the task
      const newTask = new Task({
        companyId,
        ...validated,
      });

      await newTask.save();

      // Log Activity
      const activity = new TaskActivity({
        companyId,
        taskId: newTask._id,
        userId,
        type: 'created',
        title: 'Task Created',
        description: `Task "${newTask.title}" (${newTask.code}) was created by ${userName}.`,
        metadata: { taskCode: newTask.code, taskTitle: newTask.title },
      });
      await activity.save();

      // Populate returned task
      const populated = await Task.findById(newTask._id)
        .populate({ path: 'projectId', select: 'name code' })
        .populate({ path: 'statusId', select: 'name key category color' })
        .populate({ path: 'assignees', select: 'name email image' });

      return NextResponse.json({ success: true, data: populated }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: 'ACTION_ERROR', message: error.message },
        { status: 500 }
      );
    }
  }
);
