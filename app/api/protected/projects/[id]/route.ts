import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Project } from '@/models/Project';
import { ProjectActivity } from '@/models/ProjectActivity';
import { ProjectUpdateSchema } from '@/lib/validators/project';

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

    return NextResponse.json({ success: true, data: project });
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
