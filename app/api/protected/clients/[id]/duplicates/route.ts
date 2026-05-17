import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Client } from '@/models/Client';
import { scoreClientDuplicate } from '@/lib/services/duplicateService';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const { id } = context.params;

    const currentClient = await Client.findOne({ _id: id, companyId });
    if (!currentClient) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Client profile not found.' },
        { status: 404 }
      );
    }

    // Find all other active accounts to compare against
    const otherClients = await Client.find({
      _id: { $ne: id },
      companyId,
      isArchived: false,
    });

    const duplicates = otherClients
      .map((other) => scoreClientDuplicate(currentClient, other))
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      data: duplicates,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'SCAN_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
