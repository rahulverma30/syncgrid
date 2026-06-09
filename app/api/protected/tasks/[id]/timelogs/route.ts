import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Task, TaskTimeLog, TaskActivity, TaskStatus } from '@/models';
import { createNotification } from '@/lib/services/notificationService';
import { TaskTimeLogSchema } from '@/schemas/task';
import mongoose from 'mongoose';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    const companyId = session.user.companyId;

    const isObjectId = mongoose.isValidObjectId(id);
    const query = isObjectId ? { _id: id, companyId } : { code: id.toUpperCase(), companyId };

    const task = await Task.findOne(query).select('_id');
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Task not found' },
        { status: 404 }
      );
    }

    const logs = await TaskTimeLog.find({ taskId: task._id })
      .populate({ path: 'userId', select: 'name email image' })
      .sort({ startTime: -1 });

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const userName = session.user.name;

    const body = await request.json();
    const { action } = body; // 'start', 'stop', or 'manual'

    const isObjectId = mongoose.isValidObjectId(id);
    const query = isObjectId ? { _id: id, companyId } : { code: id.toUpperCase(), companyId };

    const task = await Task.findOne(query);
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Task not found' },
        { status: 404 }
      );
    }

    if (action === 'start') {
      // S8: Cross-task check — ONE active timer allowed per user across ALL tasks
      const anyRunningTimer = await TaskTimeLog.findOne({
        userId,
        isRunning: true,
      });

      if (anyRunningTimer) {
        return NextResponse.json(
          {
            success: false,
            error: 'ONE_ACTIVE_TIMER_ALLOWED',
            message:
              'You already have an active timer running. Stop your current timer before starting a new one.',
          },
          { status: 400 }
        );
      }

      // Create new timer log
      const timeLog = new TaskTimeLog({
        companyId,
        taskId: task._id,
        userId,
        startTime: new Date(),
        isRunning: true,
        durationMinutes: 0,
      });
      await timeLog.save();

      // Log Activity
      const activity = new TaskActivity({
        companyId,
        taskId: task._id,
        userId,
        type: 'timer_toggled',
        title: 'Timer Started',
        description: `${userName} started a live timer on task "${task.title}".`,
      });
      await activity.save();

      // Populate returned task
      const populated = await Task.findById(task._id)
        .populate({ path: 'projectId', select: 'name code' })
        .populate({ path: 'statusId', select: 'name key category color' })
        .populate({ path: 'assignees', select: 'name email image' })
        .populate({ path: 'watchers', select: 'name email image' })
        .populate({ path: 'parentId', select: 'title code' });

      // Realtime Broadcast
      try {
        const { broadcastEvent } = require('@/lib/realtime');
        broadcastEvent({
          companyId,
          projectId: task.projectId ? task.projectId.toString() : undefined,
          taskId: task._id.toString(),
          event: 'task_updated',
          payload: populated,
        });
      } catch (e) {
        console.error('SSE Timelog Broadcast error:', e);
      }

      return NextResponse.json({ success: true, data: timeLog });
    } else if (action === 'stop') {
      // Find the running timer
      const activeTimer = await TaskTimeLog.findOne({
        taskId: task._id,
        userId,
        isRunning: true,
      });

      if (!activeTimer) {
        return NextResponse.json(
          {
            success: false,
            error: 'NO_ACTIVE_TIMER',
            message: 'No running timer found for you on this task',
          },
          { status: 400 }
        );
      }

      const endTime = new Date();
      const diffMs = endTime.getTime() - activeTimer.startTime.getTime();
      const durationMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));

      activeTimer.endTime = endTime;
      activeTimer.durationMinutes = durationMinutes;
      activeTimer.isRunning = false;
      activeTimer.description = body.description || activeTimer.description || 'Live tracked time';
      activeTimer.billable = body.billable !== undefined ? body.billable : activeTimer.billable;

      await activeTimer.save();

      // Accumulate actual hours onto task and project
      const loggedHours = durationMinutes / 60;
      task.actualHours = (task.actualHours || 0) + loggedHours;
      await task.save();

      // ── S6: Time Exhaustion Check ─────────────────────────────────────────────
      if (task.estimatedHours > 0 && task.actualHours >= task.estimatedHours) {
        const currentStatus = await TaskStatus.findById(task.statusId);
        if (currentStatus && currentStatus.category !== 'done') {
          // Find the first review/backlog status to flag for human review
          const reviewStatus = await TaskStatus.findOne({
            companyId,
            $or: [{ category: 'in_review' }, { category: 'todo' }],
          }).sort({ position: 1 });

          if (reviewStatus) {
            task.statusId = reviewStatus._id;
            await task.save();

            // Notify assignees about the overrun
            for (const assigneeId of task.assignees) {
              try {
                await createNotification({
                  companyId,
                  userId: assigneeId.toString(),
                  title: '⏱ Time Estimate Exceeded',
                  description: `Task "${task.title}" has exceeded its estimated ${task.estimatedHours}h. It has been moved to "${reviewStatus.name}" for review.`,
                  type: 'task',
                  priority: 'high',
                });
              } catch (e) {
                console.error('Notification error (time exhaustion):', e);
              }
            }

            const exhaustionActivity = new TaskActivity({
              companyId,
              taskId: task._id,
              userId,
              type: 'time_exhausted',
              title: 'Time Estimate Exhausted',
              description: `Logged time (${task.actualHours.toFixed(1)}h) has exceeded the estimate (${task.estimatedHours}h). Task auto-transitioned to "${reviewStatus.name}".`,
            });
            await exhaustionActivity.save();
          }
        }
      }

      // ── S9: Trigger project health recalculation ─────────────────────────────
      if (task.projectId) {
        try {
          const Project = mongoose.model('Project');
          const project = await Project.findById(task.projectId);
          if (project) {
            project.actualHours = (project.actualHours || 0) + loggedHours;
            await project.save(); // triggers pre('save') health recalculation hook
          }
        } catch (e) {
          console.error('Project health update error:', e);
        }
      }

      // Log Activity
      const activity = new TaskActivity({
        companyId,
        taskId: task._id,
        userId,
        type: 'timer_toggled',
        title: 'Timer Stopped',
        description: `${userName} logged ${durationMinutes} minutes on task "${task.title}".`,
      });
      await activity.save();

      // Populate returned task
      const populated = await Task.findById(task._id)
        .populate({ path: 'projectId', select: 'name code' })
        .populate({ path: 'statusId', select: 'name key category color' })
        .populate({ path: 'assignees', select: 'name email image' })
        .populate({ path: 'watchers', select: 'name email image' })
        .populate({ path: 'parentId', select: 'title code' });

      // Realtime Broadcast
      try {
        const { broadcastEvent } = require('@/lib/realtime');
        broadcastEvent({
          companyId,
          projectId: task.projectId ? task.projectId.toString() : undefined,
          taskId: task._id.toString(),
          event: 'task_updated',
          payload: populated,
        });
      } catch (e) {
        console.error('SSE Timelog Broadcast error:', e);
      }

      return NextResponse.json({ success: true, data: activeTimer });
    } else if (action === 'manual') {
      // Validate payload
      const parseResult = TaskTimeLogSchema.safeParse(body);
      if (!parseResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'VALIDATION_ERROR',
            message: parseResult.error.errors[0].message,
          },
          { status: 400 }
        );
      }

      const validated = parseResult.data;

      // Create log
      const timeLog = new TaskTimeLog({
        companyId,
        taskId: task._id,
        userId,
        startTime: validated.startTime,
        endTime: validated.endTime || new Date(),
        durationMinutes: validated.durationMinutes,
        description: validated.description,
        billable: validated.billable,
        isRunning: false,
      });

      await timeLog.save();

      // Accumulate actual hours onto task
      const loggedHours = validated.durationMinutes / 60;
      task.actualHours = (task.actualHours || 0) + loggedHours;
      await task.save();

      // ── S6: Time Exhaustion Check ─────────────────────────────────────────────
      if (task.estimatedHours > 0 && task.actualHours >= task.estimatedHours) {
        const currentStatus = await TaskStatus.findById(task.statusId);
        if (currentStatus && currentStatus.category !== 'done') {
          const reviewStatus = await TaskStatus.findOne({
            companyId,
            $or: [{ category: 'in_review' }, { category: 'todo' }],
          }).sort({ position: 1 });

          if (reviewStatus) {
            task.statusId = reviewStatus._id;
            await task.save();

            for (const assigneeId of task.assignees) {
              try {
                await createNotification({
                  companyId,
                  userId: assigneeId.toString(),
                  title: '⏱ Time Estimate Exceeded',
                  description: `Task \"${task.title}\" has exceeded its estimated ${task.estimatedHours}h via manual log. Moved to \"${reviewStatus.name}\" for review.`,
                  type: 'task',
                  priority: 'high',
                });
              } catch (e) {
                console.error('Notification error (manual time exhaustion):', e);
              }
            }
          }
        }
      }

      // ── S9: Trigger project health recalculation ─────────────────────────────
      if (task.projectId) {
        try {
          const Project = mongoose.model('Project');
          const project = await Project.findById(task.projectId);
          if (project) {
            project.actualHours = (project.actualHours || 0) + loggedHours;
            await project.save(); // triggers pre('save') health recalculation hook
          }
        } catch (e) {
          console.error('Project health update error (manual):', e);
        }
      }

      // Log Activity
      const activity = new TaskActivity({
        companyId,
        taskId: task._id,
        userId,
        type: 'timer_toggled',
        title: 'Manual Time Logged',
        description: `${userName} manually logged ${validated.durationMinutes} minutes on task "${task.title}".`,
      });
      await activity.save();

      // Populate returned task
      const populated = await Task.findById(task._id)
        .populate({ path: 'projectId', select: 'name code' })
        .populate({ path: 'statusId', select: 'name key category color' })
        .populate({ path: 'assignees', select: 'name email image' })
        .populate({ path: 'watchers', select: 'name email image' })
        .populate({ path: 'parentId', select: 'title code' });

      // Realtime Broadcast
      try {
        const { broadcastEvent } = require('@/lib/realtime');
        broadcastEvent({
          companyId,
          projectId: task.projectId ? task.projectId.toString() : undefined,
          taskId: task._id.toString(),
          event: 'task_updated',
          payload: populated,
        });
      } catch (e) {
        console.error('SSE Timelog Broadcast error:', e);
      }

      return NextResponse.json({ success: true, data: timeLog });
    } else {
      return NextResponse.json(
        { success: false, error: 'BAD_REQUEST', message: 'Invalid timelog action' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
