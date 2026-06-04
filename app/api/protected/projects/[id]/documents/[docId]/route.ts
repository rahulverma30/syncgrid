import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Project } from '@/models/Project';
import { ProjectActivity } from '@/models/ProjectActivity';

export const DELETE = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const { id, docId } = await context.params;
    const companyId = session.user.companyId;
    const userName = session.user.name;

    const project = await Project.findOne({ _id: id, companyId });
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Project not found.' },
        { status: 404 }
      );
    }

    const docIndex = project.documents.findIndex((d: any) => d._id.toString() === docId);
    if (docIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Document not found.' },
        { status: 404 }
      );
    }

    const docName = project.documents[docIndex].name;
    project.documents.splice(docIndex, 1);

    const activity = new ProjectActivity({
      companyId,
      projectId: id,
      type: 'document_deleted',
      title: 'Document Deleted',
      description: `Document "${docName}" was removed by ${userName}.`,
      userName,
    });

    await activity.save();
    await project.save();

    return NextResponse.json({ success: true, data: project });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
