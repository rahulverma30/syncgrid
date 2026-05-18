import { NextResponse } from 'next/server';
import { requirePortalAuth } from '@/lib/auth/portal';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Project } from '@/models/Project';
import { ClientProjectAccess } from '@/models/ClientProjectAccess';

export async function GET() {
  try {
    await connectToDatabase();

    // Verify portal user authentication
    const session = await requirePortalAuth();
    const { clientId, companyId } = session.user;

    // Fetch granular project access rules configured by agency PMs
    const accessRules = await ClientProjectAccess.find({ clientId });

    const allowedProjectIds = accessRules
      .filter((rule) => rule.isAccessAllowed)
      .map((rule) => rule.projectId.toString());

    // Scopes query strictly to client's projects and allowed boundaries
    const projects = await Project.find({
      companyId,
      clientId,
      _id: { $in: allowedProjectIds },
      isArchived: false,
    }).sort({ createdAt: -1 });

    // Protect raw data: filter out shielded fields dynamically per project configuration rules
    const clientSafeProjects = projects.map((project) => {
      const rule = accessRules.find((r) => r.projectId.toString() === project._id.toString());

      const projectObj = project.toObject();

      // Data shielding engine
      if (!rule?.showBudgets) {
        delete projectObj.budget;
        delete projectObj.billingRate;
        delete projectObj.billingType;
      }

      if (!rule?.showTimeLogs) {
        delete projectObj.estimatedHours;
        delete projectObj.actualHours;
        delete projectObj.timeLogs;
      }

      if (!rule?.showTasks) {
        delete projectObj.teamMembers;
      }

      return projectObj;
    });

    return NextResponse.json({ success: true, data: clientSafeProjects });
  } catch (error: any) {
    console.error('Portal Projects GET Error:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: 'QUERY_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
