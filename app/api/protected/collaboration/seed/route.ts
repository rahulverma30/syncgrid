import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Workspace } from '@/models/Workspace';
import { Channel } from '@/models/Channel';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId || !session?.user?.id) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    await connectToDatabase();

    // Check if workspace already exists
    const existing = await Workspace.findOne({ companyId: session.user.companyId });
    if (existing) {
      return NextResponse.json({ success: true, message: 'Already initialized' });
    }

    // Create default workspace
    const workspace = await Workspace.create({
      companyId: session.user.companyId,
      name: 'Agency HQ',
      description: 'Primary workspace for agency collaboration',
      members: [{ userId: session.user.id, role: 'admin' }],
      isActive: true,
    });

    // Create default general channel
    await Channel.create({
      companyId: session.user.companyId,
      workspaceId: workspace._id,
      name: 'general',
      type: 'public',
      description: 'General discussion for all agency members',
      members: [session.user.id],
      isArchived: false,
    });

    return NextResponse.json({ success: true, data: workspace });
  } catch (error: any) {
    console.error('Collaboration seed error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
