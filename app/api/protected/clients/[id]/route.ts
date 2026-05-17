import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Client } from '@/models/Client';
import { ClientActivity } from '@/models/ClientActivity';
import { hasRole } from '@/lib/auth/permission-checks';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const { id } = context.params;

    const client = await Client.findOne({ _id: id, companyId });

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Client account not found.' },
        { status: 404 }
      );
    }

    // Merge activities dynamically from decoupled ClientActivity collection
    const activities = await ClientActivity.find({ clientId: id, companyId })
      .sort({ createdAt: -1 })
      .limit(100);

    const clientObj = client.toObject();
    clientObj.timeline = activities;

    return NextResponse.json({
      success: true,
      data: clientObj,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'QUERY_ERROR', message: error.message },
      { status: 500 }
    );
  }
});

export const PUT = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userName = session.user.name;
    const { id } = context.params;
    const body = await request.json();

    const client = await Client.findOne({ _id: id, companyId });

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Client account not found.' },
        { status: 404 }
      );
    }

    // Capture changes to log inside history timeline
    const timelineUpdates: any[] = [];
    const fields = [
      'name',
      'clientType',
      'industry',
      'address',
      'timezone',
      'website',
      'companySize',
      'revenueContribution',
      'accountManager',
      'onboardingStatus',
      'retentionStatus',
      'healthScore',
      'isArchived',
    ];

    fields.forEach((field) => {
      if (body[field] !== undefined && body[field] !== client[field]) {
        timelineUpdates.push({
          type: 'update',
          title: `Field "${field}" updated`,
          description: `Changed from "${client[field]}" to "${body[field]}" by ${userName}.`,
          userName,
          createdAt: new Date(),
        });
        client[field] = body[field];
      }
    });

    // Apply alternate arrays if supplied
    if (body.emails) client.emails = body.emails;
    if (body.phones) client.phones = body.phones;
    if (body.socialLinks) client.socialLinks = body.socialLinks;
    if (body.customFields) client.customFields = body.customFields;
    if (body.tags) client.tags = body.tags;

    // Decatur timeline logs - save to decoupled ClientActivity collection
    if (timelineUpdates.length > 0) {
      const dbActivities = timelineUpdates.map((t) => ({
        companyId,
        clientId: id,
        type: t.type,
        title: t.title,
        description: t.description,
        userName: t.userName,
        createdAt: t.createdAt,
      }));
      await ClientActivity.insertMany(dbActivities);
    }

    await client.save();

    // Re-fetch timeline events to merge into returned client
    const activities = await ClientActivity.find({ clientId: id, companyId })
      .sort({ createdAt: -1 })
      .limit(100);

    const clientObj = client.toObject();
    clientObj.timeline = activities;

    return NextResponse.json({
      success: true,
      data: clientObj,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'UPDATE_ERROR', message: error.message },
      { status: 500 }
    );
  }
});

export const DELETE = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const roles = session.user.roles || [];
    const { id } = context.params;

    // Strict access control: Permanent deletion of core Client accounts is locked to admins/managers
    const hasElevatedAccess = hasRole(roles, [
      'super-admin',
      'admin',
      'manager',
      'account-manager',
    ]);
    if (!hasElevatedAccess) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Only account administrators can delete client records.',
        },
        { status: 403 }
      );
    }

    const client = await Client.findOneAndDelete({ _id: id, companyId });

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Client account not found.' },
        { status: 404 }
      );
    }

    // Clean up corresponding activities
    await ClientActivity.deleteMany({ clientId: id, companyId });

    return NextResponse.json({
      success: true,
      message: `Client "${client.name}" has been permanently purged from the system.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'DELETE_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
