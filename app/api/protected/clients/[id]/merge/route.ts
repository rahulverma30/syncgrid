import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Client } from '@/models/Client';
import { ClientActivity } from '@/models/ClientActivity';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userName = session.user.name;
    const { id } = context.params; // Primary client ID
    const body = await request.json();

    const { targetId, overrideFields } = body;

    if (!targetId) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Target duplicate client ID is required.',
        },
        { status: 400 }
      );
    }

    const primaryClient = await Client.findOne({ _id: id, companyId });
    const targetClient = await Client.findOne({ _id: targetId, companyId });

    if (!primaryClient || !targetClient) {
      return NextResponse.json(
        {
          success: false,
          error: 'NOT_FOUND',
          message: 'Primary or Target client account not found.',
        },
        { status: 404 }
      );
    }

    // 1. Merge Flat arrays uniquely
    const mergedEmails = Array.from(
      new Set([...(primaryClient.emails || []), ...(targetClient.emails || [])])
    );
    const mergedPhones = Array.from(
      new Set([...(primaryClient.phones || []), ...(targetClient.phones || [])])
    );
    const mergedTags = Array.from(
      new Set([...(primaryClient.tags || []), ...(targetClient.tags || [])])
    );

    primaryClient.emails = mergedEmails;
    primaryClient.phones = mergedPhones;
    primaryClient.tags = mergedTags;

    // 2. Resolve flat overrides
    if (overrideFields) {
      const allowedOverrides = [
        'website',
        'accountManager',
        'industry',
        'timezone',
        'companySize',
        'clientType',
        'healthScore',
      ];
      allowedOverrides.forEach((field) => {
        if (overrideFields[field] !== undefined) {
          primaryClient[field] = overrideFields[field];
        }
      });
    }

    // 3. Merge Contacts uniquely (avoiding exact same names)
    const existingContactNames = new Set(
      (primaryClient.contacts || []).map((c: any) => c.name.toLowerCase().trim())
    );
    (targetClient.contacts || []).forEach((c: any) => {
      if (!existingContactNames.has(c.name.toLowerCase().trim())) {
        primaryClient.contacts.push(c);
      }
    });

    // 4. Merge Subdocument arrays
    (targetClient.contracts || []).forEach((con: any) => {
      primaryClient.contracts.push(con);
    });

    (targetClient.notes || []).forEach((n: any) => {
      primaryClient.notes.push({
        content: `${n.content} (Absorbed during account merge from "${targetClient.name}")`,
        createdByName: n.createdByName || 'System',
        isPinned: n.isPinned || false,
        isPrivate: n.isPrivate || false,
        createdAt: n.createdAt,
      });
    });

    (targetClient.documents || []).forEach((doc: any) => {
      primaryClient.documents.push(doc);
    });

    (targetClient.meetings || []).forEach((m: any) => {
      primaryClient.meetings.push(m);
    });

    (targetClient.communicationLogs || []).forEach((log: any) => {
      primaryClient.communicationLogs.push(log);
    });

    // 5. Dynamic Aggregations recalculations
    const totalActiveContractValue = primaryClient.contracts.reduce((sum: number, c: any) => {
      if (c.status === 'active') return sum + (c.value || 0);
      return sum;
    }, 0);
    primaryClient.revenueContribution = totalActiveContractValue;

    // 6. Decoupled Activities redirect
    // Update all historical client activity records belonging to duplicate target client to point to primary client!
    await ClientActivity.updateMany(
      { clientId: targetClient._id, companyId },
      { $set: { clientId: primaryClient._id } }
    );

    // 7. Delete the absorbed target client (or soft-delete it)
    await Client.deleteOne({ _id: targetClient._id, companyId });

    // 8. Create a merge confirmation timeline log
    const activity = new ClientActivity({
      companyId,
      clientId: primaryClient._id,
      type: 'merge',
      title: 'Accounts Merged',
      description: `Absorbed duplicate account "${targetClient.name}" into primary profile. Merged contacts, contracts, vault documents, and activity history.`,
      userName,
    });
    await activity.save();

    await primaryClient.save();

    return NextResponse.json({
      success: true,
      data: primaryClient,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'MERGE_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
