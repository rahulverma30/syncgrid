import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Lead } from '@/models/Lead';
import { Account } from '@/models/Account';
import { Contact } from '@/models/Contact';
import { Deal } from '@/models/Deal';
import { CRMActivity } from '@/models/CRMActivity';
import { hasRole } from '@/lib/auth/permission-checks';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const userName = session.user.name;
    const roles = session.user.roles || [];
    const leadId = await context.params.id;
    const body = await request.json().catch(() => ({}));

    const lead = await Lead.findOne({ _id: leadId, companyId });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Lead not found.' },
        { status: 404 }
      );
    }

    const hasElevatedAccess = hasRole(roles, ['super-admin', 'admin', 'sales-manager', 'manager']);
    if (!hasElevatedAccess && lead.assignedTo?.toString() !== userId) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Access denied.' },
        { status: 403 }
      );
    }

    if (lead.status === 'won' || lead.status === 'qualified') {
      // Allow conversion even if qualified, but typically "won" in old system meant client
    }

    // 1. Create Account
    const account = new Account({
      companyId,
      name: body.accountName || lead.name,
      industry: lead.workType || 'General',
      ownerId: lead.assignedTo || userId,
      revenue: lead.budget || 0,
    });
    await account.save();

    // 2. Create Contact
    const nameParts = (lead.contactPerson || 'Unknown Contact').split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Unknown';

    const contact = new Contact({
      companyId,
      accountId: account._id,
      firstName,
      lastName,
      email: lead.email,
      phone: lead.phone,
      isPrimary: true,
      ownerId: lead.assignedTo || userId,
    });
    await contact.save();

    // 3. Create Deal
    let deal = null;
    if (body.createDeal !== false) {
      deal = new Deal({
        companyId,
        accountId: account._id,
        contactId: contact._id,
        name: body.dealName || `${account.name} - Opportunity`,
        value: lead.budget || body.dealValue || 0,
        expectedCloseDate:
          lead.expectedCloseDate ||
          body.expectedCloseDate ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        stage: 'qualified',
        ownerId: lead.assignedTo || userId,
      });
      await deal.save();
    }

    // 4. Update Lead Status
    lead.status = 'qualified';
    lead.timeline.push({
      type: 'stage_change',
      title: 'Lead Converted',
      description: `Lead converted to Account/Contact/Deal by ${userName}`,
      userId,
      userName,
    });
    await lead.save();

    // 5. Activity Log
    const activity = new CRMActivity({
      companyId,
      type: 'converted',
      title: 'Lead Converted',
      description: `Lead was converted to Account: ${account.name}`,
      leadId: lead._id,
      accountId: account._id,
      contactId: contact._id,
      dealId: deal ? deal._id : undefined,
      userId,
      userName,
    });
    await activity.save();

    return NextResponse.json({
      success: true,
      data: {
        account,
        contact,
        deal,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'CONVERT_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
