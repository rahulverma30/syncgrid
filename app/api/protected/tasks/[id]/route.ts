import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Task, TaskStatus, TaskActivity, TaskWatcher } from '@/models';
import { TaskUpdateSchema } from '@/schemas/task';
import mongoose from 'mongoose';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    const companyId = session.user.companyId;

    // Smart Resolution: Resolve by ObjectId or Task Code (e.g., SYNC-1)
    const isObjectId = mongoose.isValidObjectId(id);
    const query = isObjectId ? { _id: id, companyId } : { code: id.toUpperCase(), companyId };

    const task = await Task.findOne(query)
      .populate({ path: 'projectId', select: 'name code sprints milestones teamMembers' })
      .populate({ path: 'statusId', select: 'name key category color' })
      .populate({ path: 'assignees', select: 'name email image' })
      .populate({ path: 'watchers', select: 'name email image' })
      .populate({ path: 'parentId', select: 'title code' });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Task not found' },
        { status: 404 }
      );
    }

    // Load subtasks hierarchy
    const subtasks = await Task.find({ parentId: task._id, isSoftDeleted: false })
      .populate({ path: 'statusId', select: 'name key category color' })
      .populate({ path: 'assignees', select: 'name email image' });

    // Load followers count from TaskWatcher
    const followers = await TaskWatcher.find({ taskId: task._id }).populate({
      path: 'userId',
      select: 'name email image',
    });

    return NextResponse.json({
      success: true,
      data: {
        ...task.toObject(),
        subtasks,
        followers,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'QUERY_ERROR', message: error.message },
      { status: 500 }
    );
  }
});

export const PUT = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const userName = session.user.name;
    const body = await request.json();

    const isObjectId = mongoose.isValidObjectId(id);
    const query = isObjectId ? { _id: id, companyId } : { code: id.toUpperCase(), companyId };

    const task = await Task.findOne(query);
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Task not found' },
        { status: 404 }
      );
    }

    const parseResult = TaskUpdateSchema.safeParse(body);
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

    // Track transitions for audit trail
    const changes: string[] = [];

    // 1. Status transition check
    if (validated.statusId && validated.statusId !== task.statusId.toString()) {
      const oldStatus = await TaskStatus.findById(task.statusId);
      const newStatus = await TaskStatus.findById(validated.statusId);
      if (oldStatus && newStatus) {
        changes.push(`status from "${oldStatus.name}" to "${newStatus.name}"`);

        // If transitioning to Done/Completed, auto-fill completedDate
        if (newStatus.category === 'done') {
          task.completedDate = new Date();
        } else {
          task.completedDate = null;
        }

        // Log specific transition activity
        const activity = new TaskActivity({
          companyId,
          taskId: task._id,
          userId,
          type: 'status_change',
          title: 'Status Transitioned',
          description: `${userName} moved task to "${newStatus.name}".`,
          metadata: {
            fromStatusId: oldStatus._id,
            toStatusId: newStatus._id,
            fromStatusName: oldStatus.name,
            toStatusName: newStatus.name,
          },
        });
        await activity.save();
      }
    }

    // 2. Assignees changes check
    if (validated.assignees) {
      const oldAssignees = task.assignees
        .map((a: any) => a.toString())
        .sort()
        .join(',');
      const newAssignees = validated.assignees.sort().join(',');
      if (oldAssignees !== newAssignees) {
        changes.push('assignees list');
        const activity = new TaskActivity({
          companyId,
          taskId: task._id,
          userId,
          type: 'assignee_changed',
          title: 'Assignees Modified',
          description: `${userName} updated task assignments.`,
        });
        await activity.save();
      }
    }

    // Update fields
    Object.keys(validated).forEach((key) => {
      if (validated[key as keyof typeof validated] !== undefined) {
        (task as any)[key] = validated[key as keyof typeof validated];
      }
    });

    await task.save();

    // Log general update activity
    if (changes.length > 0) {
      const updateActivity = new TaskActivity({
        companyId,
        taskId: task._id,
        userId,
        type: 'updated',
        title: 'Task Fields Updated',
        description: `Task was modified by ${userName}. Changed: ${changes.join(', ')}.`,
      });
      await updateActivity.save();
    }

    // Populate returned task
    const populated = await Task.findById(task._id)
      .populate({ path: 'projectId', select: 'name code' })
      .populate({ path: 'statusId', select: 'name key category color' })
      .populate({ path: 'assignees', select: 'name email image' })
      .populate({ path: 'watchers', select: 'name email image' })
      .populate({ path: 'parentId', select: 'title code' });

    return NextResponse.json({ success: true, data: populated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});

export const DELETE = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const userName = session.user.name;

    const url = new URL(request.url);
    const hard = url.searchParams.get('hard') === 'true';

    const isObjectId = mongoose.isValidObjectId(id);
    const query = isObjectId ? { _id: id, companyId } : { code: id.toUpperCase(), companyId };

    const task = await Task.findOne(query);
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Task not found' },
        { status: 404 }
      );
    }

    if (hard) {
      // Hard delete
      await Task.deleteOne({ _id: task._id });

      // Clean up activities, comments, logs
      await TaskActivity.deleteMany({ taskId: task._id });
      return NextResponse.json({ success: true, message: 'Task hard deleted' });
    } else {
      // Soft delete
      task.isSoftDeleted = true;
      await task.save();

      // Log soft delete activity
      const activity = new TaskActivity({
        companyId,
        taskId: task._id,
        userId,
        type: 'deleted',
        title: 'Task Soft Deleted',
        description: `Task "${task.title}" (${task.code}) was soft-deleted by ${userName}.`,
      });
      await activity.save();

      return NextResponse.json({ success: true, data: task });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
