import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Task, TaskTimeLog, TaskActivity } from '@/models';
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
    return NextResponse.json(
      { success: false, error: 'QUERY_ERROR', message: error.message },
      { status: 500 }
    );
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
      // Check if there is an active running timer already for this user on this task
      const activeTimer = await TaskTimeLog.findOne({
        taskId: task._id,
        userId,
        isRunning: true,
      });

      if (activeTimer) {
        return NextResponse.json(
          {
            success: false,
            error: 'ACTIVE_TIMER_EXISTS',
            message: 'You already have an active timer running on this task',
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
      const durationMinutes = Math.max(1, Math.round(diffMs / (1000 * 60))); // at least 1 minute

      activeTimer.endTime = endTime;
      activeTimer.durationMinutes = durationMinutes;
      activeTimer.isRunning = false;
      activeTimer.description = body.description || activeTimer.description || 'Live tracked time';
      activeTimer.billable = body.billable !== undefined ? body.billable : activeTimer.billable;

      await activeTimer.save();

      // Accumulate actual hours onto task
      const loggedHours = durationMinutes / 60;
      task.actualHours = (task.actualHours || 0) + loggedHours;
      await task.save();

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

      return NextResponse.json({ success: true, data: timeLog });
    } else {
      return NextResponse.json(
        { success: false, error: 'BAD_REQUEST', message: 'Invalid timelog action' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
