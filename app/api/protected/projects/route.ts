import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Project } from '@/models/Project';
import { ProjectActivity } from '@/models/ProjectActivity';
import { hasRole } from '@/lib/auth/permission-checks';
import { ProjectIngestSchema } from '@/lib/validators/project';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userName = session.user.name;
    const roles = session.user.roles || [];

    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const priority = url.searchParams.get('priority') || '';
    const projectManager = url.searchParams.get('projectManager') || '';
    const riskLevel = url.searchParams.get('riskLevel') || '';
    const billingType = url.searchParams.get('billingType') || '';
    const isArchivedParam = url.searchParams.get('isArchived');
    const isArchived = isArchivedParam === 'true';

    const query: Record<string, any> = { companyId, isArchived };

    // RBAC: restrict to assigned projects for non-elevated users
    const hasElevatedAccess = hasRole(roles, [
      'super-admin',
      'admin',
      'manager',
      'project-manager',
    ]);
    if (!hasElevatedAccess) {
      query.$or = [{ projectManager: userName }, { 'teamMembers.userName': userName }];
    } else if (projectManager) {
      query.projectManager = projectManager;
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (riskLevel) query.riskLevel = riskLevel;
    if (billingType) query.billingType = billingType;

    if (search) {
      const searchConditions = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { projectManager: { $regex: search, $options: 'i' } },
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    const projects = await Project.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: projects });
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
    const companyId = session.user.companyId;
    const userName = session.user.name;
    const body = await request.json();

    const parseResult = ProjectIngestSchema.safeParse(body);
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

    const validated = parseResult.data;

    const newProject = new Project({
      companyId,
      ...validated,
    });

    await newProject.save();

    // Audit log
    const activity = new ProjectActivity({
      companyId,
      projectId: newProject._id,
      type: 'project_created',
      title: 'Project Created',
      description: `Project "${validated.name}" created by ${userName}.`,
      userName,
    });
    await activity.save();

    return NextResponse.json({ success: true, data: newProject }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
