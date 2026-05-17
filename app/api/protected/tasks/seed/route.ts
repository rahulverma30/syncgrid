import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import {
  Task,
  TaskStatus,
  TaskLabel,
  TaskAutomationRule,
  Project,
  User,
  TaskTimeLog,
  TaskComment,
} from '@/models';
import mongoose from 'mongoose';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;

    // 1. Ensure a Project exists to attach sessional tasks to
    let project = await Project.findOne({ companyId });
    if (!project) {
      project = new Project({
        companyId,
        name: 'SyncGrid ERP Core',
        code: 'SYNC',
        description: 'Primary software development project for Agency ERP core systems.',
        status: 'development',
        priority: 'high',
        projectManager: session.user.name,
        startDate: new Date(),
        deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      });
      await project.save();
    }

    // 2. Load users to assign sessional tasks
    const users = await User.find({ companyId }).limit(3);
    const teamUserIds = users.map((u) => u._id);
    if (teamUserIds.length === 0) {
      teamUserIds.push(new mongoose.Types.ObjectId(userId));
    }

    // 3. Ensure TaskStatus exist (will auto-seed standard if GET/POST settings run)
    let statuses = await TaskStatus.find({ companyId }).sort({ order: 1 });
    if (statuses.length === 0) {
      const defaultStatuses = [
        {
          name: 'Backlog',
          key: 'backlog',
          category: 'backlog',
          color: '#64748b',
          order: 10,
          isDefault: true,
          isSystem: true,
        },
        {
          name: 'Todo',
          key: 'todo',
          category: 'todo',
          color: '#3b82f6',
          order: 20,
          isDefault: false,
          isSystem: true,
        },
        {
          name: 'In Progress',
          key: 'in-progress',
          category: 'in_progress',
          color: '#f59e0b',
          order: 30,
          isDefault: false,
          isSystem: true,
        },
        {
          name: 'Review',
          key: 'review',
          category: 'in_progress',
          color: '#8b5cf6',
          order: 40,
          isDefault: false,
          isSystem: true,
        },
        {
          name: 'Testing',
          key: 'testing',
          category: 'in_progress',
          color: '#ec4899',
          order: 50,
          isDefault: false,
          isSystem: true,
        },
        {
          name: 'Completed',
          key: 'completed',
          category: 'done',
          color: '#10b981',
          order: 60,
          isDefault: false,
          isSystem: true,
        },
      ];
      await TaskStatus.insertMany(defaultStatuses.map((s) => ({ ...s, companyId })));
      statuses = await TaskStatus.find({ companyId }).sort({ order: 1 });
    }

    const backlogId = statuses.find((s) => s.key === 'backlog')?._id || statuses[0]._id;
    const todoId = statuses.find((s) => s.key === 'todo')?._id || statuses[0]._id;
    const inProgressId = statuses.find((s) => s.key === 'in-progress')?._id || statuses[0]._id;
    const reviewId = statuses.find((s) => s.key === 'review')?._id || statuses[0]._id;
    const testingId = statuses.find((s) => s.key === 'testing')?._id || statuses[0]._id;
    const completedId = statuses.find((s) => s.key === 'completed')?._id || statuses[0]._id;

    // 4. Ensure TaskLabel exist
    let labels = await TaskLabel.find({ companyId });
    if (labels.length === 0) {
      const defaultLabels = [
        { name: 'Feature', color: '#10b981', description: 'New capability' },
        { name: 'Bug', color: '#ef4444', description: 'Defect' },
        { name: 'Chore', color: '#6b7280', description: 'Operational' },
      ];
      await TaskLabel.insertMany(defaultLabels.map((l) => ({ ...l, companyId })));
      labels = await TaskLabel.find({ companyId });
    }

    // 5. Ensure Automation rules exist
    const rulesCount = await TaskAutomationRule.countDocuments({ companyId });
    if (rulesCount === 0) {
      const defaultRule = new TaskAutomationRule({
        companyId,
        name: 'Auto-Assign On Development',
        trigger: {
          type: 'on_status_change',
          statusId: inProgressId,
        },
        actions: [
          {
            type: 'assign_user',
            assigneeId: userId,
          },
        ],
        active: true,
      });
      await defaultRule.save();
    }

    // 6. Delete existing tasks for clean seeding
    await Task.deleteMany({ companyId });
    await TaskTimeLog.deleteMany({ companyId });
    await TaskComment.deleteMany({ companyId });

    // 7. Seed Tasks
    // Task 1: Main Feature (Parent)
    const task1 = new Task({
      companyId,
      title: 'Architect Real-time Socket sync core',
      description:
        'Design the websocket rooms, presence, and granular mutation broadcast gateways.',
      projectId: project._id,
      statusId: inProgressId,
      priority: 'high',
      severity: 'high',
      storyPoints: 8,
      estimatedHours: 24,
      actualHours: 12,
      assignees: [teamUserIds[0]],
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
      checklistItems: [
        {
          title: 'Establish cluster-ready socket server config',
          isCompleted: true,
          completedAt: new Date(),
        },
        {
          title: 'Write standard pub-sub room listeners',
          isCompleted: true,
          completedAt: new Date(),
        },
        { title: 'Design client re-connection reconciliation engine', isCompleted: false },
      ],
    });
    await task1.save();

    // Task 2: Subtask of Task 1
    const task2 = new Task({
      companyId,
      title: 'Verify edge connection heartbeats',
      description: 'Implement keep-alive handshakes for client connections.',
      projectId: project._id,
      parentId: task1._id,
      statusId: todoId,
      priority: 'medium',
      severity: 'medium',
      storyPoints: 2,
      estimatedHours: 8,
      actualHours: 0,
      assignees: [teamUserIds[0]],
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
    });
    await task2.save();

    // Task 3: Another Task (Blocked by Task 1)
    const task3 = new Task({
      companyId,
      title: 'Deploy WebSocket Gateway to Staging environment',
      description: 'Establish secure wss handshakes with ingress controllers on AWS.',
      projectId: project._id,
      statusId: backlogId,
      priority: 'urgent',
      severity: 'critical',
      storyPoints: 5,
      estimatedHours: 12,
      actualHours: 0,
      assignees: teamUserIds[1] ? [teamUserIds[1]] : [teamUserIds[0]],
      dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // Overdue!
      dependencies: [{ type: 'blocked_by', targetTaskId: task1._id }],
    });
    await task3.save();

    // Add backlink on task 1
    task1.dependencies.push({ type: 'blocks', targetTaskId: task3._id });
    await task1.save();

    // Task 4: Completed task
    const task4 = new Task({
      companyId,
      title: 'Zod schemas validation setup',
      description: 'Draft the data validators for the SaaS multi-tenant entities.',
      projectId: project._id,
      statusId: completedId,
      priority: 'low',
      severity: 'low',
      storyPoints: 3,
      estimatedHours: 6,
      actualHours: 8,
      completedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
      assignees: teamUserIds[2] ? [teamUserIds[2]] : [teamUserIds[0]],
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
      dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    });
    await task4.save();

    // Task 5: Development task
    const task5 = new Task({
      companyId,
      title: 'Design TanStack task table system',
      description: 'Implement grouping, column pinning, saved filters, and excel outputs.',
      projectId: project._id,
      statusId: reviewId,
      priority: 'medium',
      severity: 'medium',
      storyPoints: 5,
      estimatedHours: 16,
      actualHours: 15,
      assignees: [teamUserIds[0]],
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
    });
    await task5.save();

    // Task 6: Overloaded Workload check task
    const task6 = new Task({
      companyId,
      title: 'Audit compliance report',
      description: 'Gather audit events to verify tenant boundaries.',
      projectId: project._id,
      statusId: inProgressId,
      priority: 'high',
      severity: 'high',
      storyPoints: 8,
      estimatedHours: 35, // Overloading user 0 since 24 + 35 = 59 hours!
      actualHours: 20,
      assignees: [teamUserIds[0]],
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1),
    });
    await task6.save();

    // 8. Seed Time Logs for User 0 on Task 1 and Task 6
    const log1 = new TaskTimeLog({
      companyId,
      taskId: task1._id,
      userId: teamUserIds[0],
      description: 'Architect socket infrastructure design patterns',
      durationMinutes: 720, // 12 hours
      billable: true,
      startTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      endTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 60 * 12),
    });
    await log1.save();

    const log2 = new TaskTimeLog({
      companyId,
      taskId: task6._id,
      userId: teamUserIds[0],
      description: 'Fetch Mongo audit records',
      durationMinutes: 1200, // 20 hours
      billable: true,
      startTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
      endTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1 + 1000 * 60 * 60 * 20),
    });
    await log2.save();

    // 9. Seed Comment on Task 1
    const comment1 = new TaskComment({
      companyId,
      taskId: task1._id,
      userId: teamUserIds[0],
      content: 'WS rooms are active. @[SyncGrid Support] please note.',
    });
    await comment1.save();

    return NextResponse.json({
      success: true,
      message:
        'Agile execution workspace successfully seeded with highly realistic multi-tenant tasks and workload data.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
