import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Project } from '@/models/Project';
import { ProjectActivity } from '@/models/ProjectActivity';
import { BulkActionSchema } from '@/lib/validators/project';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userName = session.user.name;
    const body = await request.json();

    const parseResult = BulkActionSchema.safeParse(body);
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

    const { projectIds, action, value } = parseResult.data;

    // Load matching projects
    const projects = await Project.find({ _id: { $in: projectIds }, companyId });

    if (projects.length === 0) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'No matching projects found.' },
        { status: 404 }
      );
    }

    const updatedProjects = [];
    const activitiesToSave = [];

    for (const project of projects) {
      let desc = '';

      if (action === 'status') {
        const oldStatus = project.status;
        project.status = value;
        desc = `Status bulk updated from "${oldStatus}" to "${value}".`;
      } else if (action === 'priority') {
        const oldPriority = project.priority;
        project.priority = value;
        desc = `Priority bulk updated from "${oldPriority}" to "${value}".`;
      } else if (action === 'archive') {
        project.isArchived = true;
        desc = `Project bulk archived.`;
      } else if (action === 'unarchive') {
        project.isArchived = false;
        desc = `Project bulk unarchived.`;
      } else if (action === 'tag_add') {
        if (!project.tags.includes(value)) {
          project.tags.push(value);
        }
        desc = `Tag "${value}" bulk assigned.`;
      } else if (action === 'manager') {
        const oldPM = project.projectManager;
        project.projectManager = value;
        desc = `Project Manager bulk reassigned from "${oldPM}" to "${value}".`;
      }

      // Save each to trigger pre-save health engines
      await project.save();
      updatedProjects.push(project);

      // Audit activity log
      const activity = new ProjectActivity({
        companyId,
        projectId: project._id,
        type: `bulk_action_${action}`,
        title: `Bulk Action Applied`,
        description: `Bulk operation applied by ${userName}: ${desc}`,
        userName,
      });
      activitiesToSave.push(activity);
    }

    // Save activities
    if (activitiesToSave.length > 0) {
      await ProjectActivity.insertMany(activitiesToSave);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${updatedProjects.length} projects.`,
      count: updatedProjects.length,
    });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
