import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Project } from '@/models/Project';
import { ProjectActivity } from '@/models/ProjectActivity';
import { MilestoneIngestSchema } from '@/lib/validators/project';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    const companyId = session.user.companyId;
    const userName = session.user.name;
    const body = await request.json();

    const parseResult = MilestoneIngestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const project = await Project.findOne({ _id: id, companyId });
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Project not found.' },
        { status: 404 }
      );
    }

    project.milestones.push(parseResult.data);

    const activity = new ProjectActivity({
      companyId,
      projectId: id,
      type: 'milestone_added',
      title: 'Milestone Added',
      description: `Milestone "${parseResult.data.title}" added by ${userName}.`,
      userName,
    });
    await activity.save();
    await project.save();

    return NextResponse.json({ success: true, data: project });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
