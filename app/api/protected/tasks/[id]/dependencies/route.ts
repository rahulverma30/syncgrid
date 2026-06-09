import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Task, TaskActivity } from '@/models';
import mongoose from 'mongoose';

// DFS Helper: returns true if searchId is reachable from startId in the blocked_by graph
async function hasCircularDependency(
  startId: string,
  searchId: string,
  visited = new Set<string>()
): Promise<boolean> {
  if (startId === searchId) return true;
  if (visited.has(startId)) return false;

  visited.add(startId);

  // Fetch the task and check its blockers
  const task = await Task.findById(startId).select('dependencies');
  if (!task || !task.dependencies) return false;

  const blockers = task.dependencies
    .filter((dep: any) => dep.type === 'blocked_by')
    .map((dep: any) => dep.targetTaskId.toString());

  for (const blockerId of blockers) {
    const isCycle = await hasCircularDependency(blockerId, searchId, visited);
    if (isCycle) return true;
  }

  return false;
}

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const userName = session.user.name;
    const body = await request.json();

    const { type, targetTaskId } = body; // type is 'blocked_by', 'blocks' or 'relates_to'

    if (!type || !targetTaskId) {
      return NextResponse.json(
        { success: false, error: 'BAD_REQUEST', message: 'type and targetTaskId are required' },
        { status: 400 }
      );
    }

    if (id === targetTaskId) {
      return NextResponse.json(
        {
          success: false,
          error: 'BAD_REQUEST',
          message: 'A task cannot have a dependency on itself',
        },
        { status: 400 }
      );
    }

    const isObjectId = mongoose.isValidObjectId(id);
    const query = isObjectId ? { _id: id, companyId } : { code: id.toUpperCase(), companyId };

    const task = await Task.findOne(query);
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Source task not found' },
        { status: 404 }
      );
    }

    const targetTask = await Task.findOne({ _id: targetTaskId, companyId });
    if (!targetTask) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Target task not found' },
        { status: 404 }
      );
    }

    // Circular Dependency Validation
    if (type === 'blocked_by') {
      // If task A is blocked by task B, we must ensure B is not transitively blocked by A
      const isCycle = await hasCircularDependency(targetTask._id.toString(), task._id.toString());
      if (isCycle) {
        return NextResponse.json(
          {
            success: false,
            error: 'CIRCULAR_DEPENDENCY',
            message: `Cannot block by "${targetTask.title}" because it creates a circular dependency chain.`,
          },
          { status: 400 }
        );
      }
    } else if (type === 'blocks') {
      // If task A blocks task B, we must ensure A is not transitively blocked by B
      const isCycle = await hasCircularDependency(task._id.toString(), targetTask._id.toString());
      if (isCycle) {
        return NextResponse.json(
          {
            success: false,
            error: 'CIRCULAR_DEPENDENCY',
            message: `Cannot block "${targetTask.title}" because it creates a circular dependency chain.`,
          },
          { status: 400 }
        );
      }
    }

    // Check if dependency already exists
    const duplicate = task.dependencies.some(
      (dep: any) => dep.targetTaskId.toString() === targetTask._id.toString() && dep.type === type
    );
    if (duplicate) {
      return NextResponse.json({ success: true, data: task.dependencies });
    }

    // Add dependencies in sync:
    // Task A: blocked_by Task B  ===> Task B: blocks Task A
    if (type === 'blocked_by') {
      task.dependencies.push({ type: 'blocked_by', targetTaskId: targetTask._id });
      targetTask.dependencies.push({ type: 'blocks', targetTaskId: task._id });
    } else if (type === 'blocks') {
      task.dependencies.push({ type: 'blocks', targetTaskId: targetTask._id });
      targetTask.dependencies.push({ type: 'blocked_by', targetTaskId: task._id });
    } else {
      task.dependencies.push({ type: 'relates_to', targetTaskId: targetTask._id });
      targetTask.dependencies.push({ type: 'relates_to', targetTaskId: task._id });
    }

    await task.save();
    await targetTask.save();

    // Log Activity
    const activity = new TaskActivity({
      companyId,
      taskId: task._id,
      userId,
      type: 'dependency_added',
      title: 'Dependency Created',
      description: `${userName} linked "${task.title}" to "${targetTask.title}" as ${type}.`,
    });
    await activity.save();

    return NextResponse.json({ success: true, data: task.dependencies });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
