import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Task, TaskActivity } from '@/models';
import { TaskChecklistItemSchema } from '@/schemas/task';
import mongoose from 'mongoose';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
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

    const parseResult = TaskChecklistItemSchema.safeParse(body);
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

    const item = parseResult.data;

    // Append to subdocument checklist list
    const newItem = {
      _id: new mongoose.Types.ObjectId(),
      title: item.title,
      isCompleted: false,
      parentId: item.parentId || null,
      order: item.order || 0,
    };

    task.checklistItems.push(newItem);
    await task.save();

    // Log Activity
    const activity = new TaskActivity({
      companyId,
      taskId: task._id,
      userId,
      type: 'checklist_updated',
      title: 'Checklist Item Added',
      description: `${userName} added checklist item "${item.title}".`,
    });
    await activity.save();

    return NextResponse.json({ success: true, data: task.checklistItems });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
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

    const url = new URL(request.url);
    const itemId = url.searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'BAD_REQUEST', message: 'itemId query param required' },
        { status: 400 }
      );
    }

    const isObjectId = mongoose.isValidObjectId(id);
    const query = isObjectId ? { _id: id, companyId } : { code: id.toUpperCase(), companyId };

    const task = await Task.findOne(query);
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Task not found' },
        { status: 404 }
      );
    }

    const subItem = task.checklistItems.id(itemId);
    if (!subItem) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Checklist item not found' },
        { status: 404 }
      );
    }

    // Toggle completion status
    subItem.isCompleted = !subItem.isCompleted;
    if (subItem.isCompleted) {
      subItem.completedBy = userId;
      subItem.completedAt = new Date();
    } else {
      subItem.completedBy = null;
      subItem.completedAt = null;
    }

    await task.save();

    // Log Activity
    const activity = new TaskActivity({
      companyId,
      taskId: task._id,
      userId,
      type: 'checklist_updated',
      title: 'Checklist Toggled',
      description: `${userName} marked checklist item "${subItem.title}" as ${
        subItem.isCompleted ? 'completed' : 'uncompleted'
      }.`,
    });
    await activity.save();

    return NextResponse.json({ success: true, data: task.checklistItems });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
