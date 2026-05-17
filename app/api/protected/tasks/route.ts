import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Task, TaskStatus, TaskActivity, Project } from '@/models';
import { TaskCreateSchema } from '@/schemas/task';
import { getLevenshteinDistance } from '@/utils/searchRanker';
import { hasRole } from '@/lib/auth/permission-checks';

// Helper to rank tasks based on search query
function rankTasks(tasks: any[], query: string): any[] {
  const q = query.trim().toLowerCase();
  if (!q) return tasks;

  return tasks
    .map((task) => {
      let score = 0;
      const code = (task.code || '').toLowerCase();
      const title = (task.title || '').toLowerCase();
      const desc = (task.description || '').toLowerCase();

      // 1. Match code exactly or as prefix (highest priority)
      if (code === q) score += 30;
      else if (code.startsWith(q)) score += 20;
      else if (code.includes(q)) score += 10;

      // 2. Title exact or prefix
      if (title === q) score += 25;
      else if (title.startsWith(q)) score += 15;
      else if (title.includes(q)) score += 8;

      // 3. Typo tolerance check for title words
      const words = title.split(/\s+/);
      words.forEach((word: string) => {
        const dist = getLevenshteinDistance(word, q);
        if (dist === 0) score += 12;
        else if (dist === 1) score += 6;
        else if (dist === 2) score += 3;
      });

      // 4. Description match
      if (desc.includes(q)) score += 4;

      return { task, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.task);
}

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userName = session.user.name;
    const userId = session.user.id;
    const roles = session.user.roles || [];

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

    // RBAC: Devs see tasks they are assigned to, or sessional tasks, or project tasks.
    // Managers and Admins see everything.
    const hasElevatedAccess = hasRole(roles, [
      'super-admin',
      'admin',
      'manager',
      'project-manager',
    ]);

    if (!hasElevatedAccess) {
      // Dev / standard QA constraints: Can see tasks in their projects, or where they are assignees/watchers
      const usersProjects = await Project.find({
        companyId,
        $or: [{ projectManager: userName }, { 'teamMembers.userName': userName }],
      }).select('_id');
      const projectIds = usersProjects.map((p) => p._id);

      query.$or = [{ assignees: userId }, { watchers: userId }, { projectId: { $in: projectIds } }];
    }

    // Fetch and populate references
    const tasks = await Task.find(query)
      .populate({ path: 'projectId', select: 'name code' })
      .populate({ path: 'statusId', select: 'name key category color' })
      .populate({ path: 'assignees', select: 'name email image' })
      .sort({ createdAt: -1 });

    // Apply ranking if search term is provided
    const rankedTasks = search ? rankTasks(tasks, search) : tasks;

    return NextResponse.json({ success: true, data: rankedTasks });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'QUERY_ERROR', message: error.message },
      { status: 500 }
    );
  }
});

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
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
});
