import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { SharedNote } from '@/models';
import { broadcastEvent } from '@/lib/realtime';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;

    const url = new URL(request.url);
    const workspaceId = url.searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const list = await SharedNote.find({ companyId, workspaceId })
      .populate('updatedBy', '_id name')
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: list });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const body = await request.json();

    const { workspaceId, title, content, isPinned, noteId } = body;
    if (!workspaceId || !title) {
      return NextResponse.json(
        { success: false, error: 'API_ERROR', message: 'workspaceId and title are required' },
        { status: 400 }
      );
    }

    let note;
    if (noteId) {
      note = await SharedNote.findOne({ _id: noteId, companyId });
      if (!note) {
        return NextResponse.json(
          { success: false, error: 'API_ERROR', message: 'Note not found' },
          { status: 404 }
        );
      }
      note.title = title;
      note.content = content || '';
      note.isPinned = isPinned !== undefined ? isPinned : note.isPinned;
      note.updatedBy = userId;
      await note.save();
    } else {
      note = new SharedNote({
        companyId,
        workspaceId,
        title,
        content: content || '',
        updatedBy: userId,
        isPinned: isPinned || false,
      });
      await note.save();
    }

    const populated = await SharedNote.findById(note._id).populate('updatedBy', '_id name').lean();

    // Broadcast update
    broadcastEvent({
      companyId,
      event: 'note_updated',
      payload: populated,
    });

    return NextResponse.json({ success: true, data: populated });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
