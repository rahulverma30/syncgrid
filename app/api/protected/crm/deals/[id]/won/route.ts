import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Deal } from '@/models/Deal';
import { Client } from '@/models/Client';
import { Account } from '@/models/Account';
import { Contact } from '@/models/Contact';
import { CRMActivity } from '@/models/CRMActivity';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const userName = session.user.name;
    const { id } = await context.params;

    const deal = await Deal.findOne({ _id: id, companyId });
    if (!deal) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Deal not found' },
        { status: 404 }
      );
    }

    if (deal.stage === 'won') {
      return NextResponse.json(
        { success: false, error: 'ALREADY_WON', message: 'Deal is already won' },
        { status: 400 }
      );
    }

    // 1. Update Deal Stage
    deal.stage = 'won';
    await deal.save();

    // 2. Fetch associated Account and Contact
    const account = await Account.findOne({ _id: deal.accountId });
    const contact = await Contact.findOne({ _id: deal.contactId });

    // 3. Create or find Client
    let client = null;
    if (account) {
      client = await Client.findOne({ companyId, name: account.name });
      if (!client) {
        // Create Client
        const contacts = [];
        if (contact) {
          contacts.push({
            name: `${contact.firstName} ${contact.lastName}`,
            email: contact.email,
            phone: contact.phone,
            role: contact.role,
            isPrimary: true,
          });
        }

        client = new Client({
          companyId,
          name: account.name,
          clientType: 'Startup', // default
          industry: account.industry || 'General',
          website: account.website,
          revenueContribution: deal.value,
          accountManager: userName,
          contacts,
          timeline: [
            {
              type: 'created',
              title: 'Client Auto-Provisioned',
              description: `Client generated automatically from Won Deal (${deal.name}) by ${userName}`,
              userName,
            },
          ],
        });
        await client.save();
      } else {
        // Update existing client revenue
        client.revenueContribution += deal.value;
        await client.save();
      }
    }

    // 4. Activity Log
    const activity = new CRMActivity({
      companyId,
      type: 'won',
      title: 'Deal Won',
      description: `Deal ${deal.name} was marked as WON. Client provisioned.`,
      dealId: deal._id,
      accountId: deal.accountId,
      userId,
      userName,
    });
    await activity.save();

    return NextResponse.json({
      success: true,
      message: 'Deal Won and Client Provisioned',
      data: {
        deal,
        client,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'WON_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
