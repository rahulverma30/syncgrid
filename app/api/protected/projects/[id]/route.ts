import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Project } from '@/models/Project';
import { ProjectActivity } from '@/models/ProjectActivity';
import { Task } from '@/models/Task';
import { Invoice } from '@/models/Invoice';
import { ProjectUpdateSchema } from '@/lib/validators/project';
import { executeEvent } from '@/lib/services/automationService';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    const companyId = session.user.companyId;

    const project = await Project.findOne({ _id: id, companyId });
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Project not found.' },
        { status: 404 }
      );
    }

    // Compute metrics
    const allTasks = await Task.find({ projectId: id, companyId, isSoftDeleted: false })
      .populate('statusId', 'category')
      .lean();

    let completedTasks = 0;
    let remainingTasks = 0;
    let overdueTasks = 0;
    const now = new Date();

    allTasks.forEach((t: any) => {
      const isDone = t.statusId?.category === 'done';
      if (isDone) completedTasks++;
      else remainingTasks++;

      if (!isDone && t.dueDate && new Date(t.dueDate) < now) {
        overdueTasks++;
      }
    });

    const totalTasks = allTasks.length;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Financial Metrics
    const projectInvoices = await Invoice.find({
      companyId,
      projectId: id,
      isSoftDeleted: false,
    }).lean();

    let billedAmount = 0;
    let outstandingAmount = 0;
    let paymentsReceived = 0;

    projectInvoices.forEach((inv: any) => {
      billedAmount += inv.totalAmount || 0;
      outstandingAmount += inv.outstandingAmount || 0;
      paymentsReceived += inv.paidAmount || 0;
    });

    const data = {
      ...project.toObject(),
      metrics: {
        totalTasks,
        completedTasks,
        remainingTasks,
        overdueTasks,
        progressPercentage,
      },
      financials: {
        budget: project.budget || 0,
        billedAmount,
        outstandingAmount,
        paymentsReceived,
      },
    };

    return NextResponse.json({ success: true, data });
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
    const userName = session.user.name;
    const body = await request.json();

    const parseResult = ProjectUpdateSchema.safeParse(body);
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

    const originalProject = await Project.findOne({ _id: id, companyId });

    const project = await Project.findOneAndUpdate(
      { _id: id, companyId },
      { $set: parseResult.data },
      { new: true }
    );

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Project not found.' },
        { status: 404 }
      );
    }

    // Audit log
    const changedFields = Object.keys(parseResult.data).join(', ');
    const activity = new ProjectActivity({
      companyId,
      projectId: id,
      type: 'project_updated',
      title: 'Project Updated',
      description: `Fields updated: ${changedFields} by ${userName}.`,
      userName,
    });
    await activity.save();

    // Trigger workflow automation if completed
    if (parseResult.data.status === 'completed' && originalProject?.status !== 'completed') {
      await executeEvent('project_completed', companyId.toString(), project.toObject());
    }

    return NextResponse.json({ success: true, data: project });
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

    await Project.findOneAndDelete({ _id: id, companyId });

    return NextResponse.json({ success: true, message: 'Project deleted.' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
