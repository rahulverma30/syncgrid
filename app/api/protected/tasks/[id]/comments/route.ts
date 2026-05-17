import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Task, TaskComment, TaskActivity, TaskMention, User } from '@/models';
import { TaskCommentSchema } from '@/schemas/task';
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

    // Fetch flat list of comments sorted chronologically
    const comments = await TaskComment.find({ taskId: task._id })
      .populate({ path: 'userId', select: 'name email image' })
      .sort({ createdAt: 1 });

    return NextResponse.json({ success: true, data: comments });
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

    const isObjectId = mongoose.isValidObjectId(id);
    const query = isObjectId ? { _id: id, companyId } : { code: id.toUpperCase(), companyId };

    const task = await Task.findOne(query);
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Task not found' },
        { status: 404 }
      );
    }

    const parseResult = TaskCommentSchema.safeParse(body);
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

    // Create the comment
    const comment = new TaskComment({
      companyId,
      taskId: task._id,
      userId,
      content: validated.content,
      parentId: validated.parentId || null,
      isPrivate: validated.isPrivate || false,
    });

    await comment.save();

    // Mentions Engine: Parse content for '@[Name]' or `@email` tags
    const mentionRegex = /@([a-zA-Z0-9\s._-]+)/g;
    let match;
    const mentionsFound = new Set<string>();

    while ((match = mentionRegex.exec(validated.content)) !== null) {
      const parsedNameOrEmail = match[1].trim();

      // Search for user in company with matching name or email
      const userMatch = await User.findOne({
        companyId,
        $or: [
          { name: { $regex: new RegExp(`^${parsedNameOrEmail}$`, 'i') } },
          { email: { $regex: new RegExp(`^${parsedNameOrEmail}$`, 'i') } },
        ],
      }).select('_id');

      if (userMatch && userMatch._id.toString() !== userId.toString()) {
        mentionsFound.add(userMatch._id.toString());
      }
    }

    // Insert Mention records
    for (const mentionedId of Array.from(mentionsFound)) {
      const mention = new TaskMention({
        companyId,
        taskId: task._id,
        commentId: comment._id,
        userId: mentionedId,
        mentionedBy: userId,
      });
      await mention.save();
    }

    // Log Activity
    const activity = new TaskActivity({
      companyId,
      taskId: task._id,
      userId,
      type: 'comment_added',
      title: 'Comment Added',
      description: `${userName} left a comment on task "${task.title}".`,
      metadata: { commentId: comment._id },
    });
    await activity.save();

    // Populate user info for immediate frontend update
    const populated = await TaskComment.findById(comment._id).populate({
      path: 'userId',
      select: 'name email image',
    });

    // Realtime Broadcast
    try {
      const { broadcastEvent } = require('@/lib/realtime');
      broadcastEvent({
        companyId,
        projectId: task.projectId ? task.projectId.toString() : undefined,
        taskId: task._id.toString(),
        event: 'comment_posted',
        payload: populated,
      });
    } catch (e) {
      console.error('SSE Comment Broadcast error:', e);
    }

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
