import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Client } from '@/models/Client';
import { ClientActivity } from '@/models/ClientActivity';
import { hasRole } from '@/lib/auth/permission-checks';
import { ClientIngestSchema } from '@/lib/validators/client';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userName = session.user.name;
    const roles = session.user.roles || [];

    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const clientType = url.searchParams.get('clientType') || '';
    const onboardingStatus = url.searchParams.get('onboardingStatus') || '';
    const retentionStatus = url.searchParams.get('retentionStatus') || '';
    const accountManager = url.searchParams.get('accountManager') || '';
    const tagsParam = url.searchParams.get('tags') || '';
    const isArchivedParam = url.searchParams.get('isArchived');
    const isArchived = isArchivedParam === 'true';

    // Construct baseline query
    const query: Record<string, any> = { companyId, isArchived };

    // RBAC: If only a standard Sales Executive or Developer, restrict to accounts managed by them
    const hasElevatedAccess = hasRole(roles, [
      'super-admin',
      'admin',
      'account-manager',
      'manager',
    ]);
    if (!hasElevatedAccess) {
      query.accountManager = userName;
    } else if (accountManager) {
      query.accountManager = accountManager;
    }

    // Apply filters
    if (clientType) query.clientType = clientType;
    if (onboardingStatus) query.onboardingStatus = onboardingStatus;
    if (retentionStatus) query.retentionStatus = retentionStatus;
    if (tagsParam) {
      query.tags = { $all: tagsParam.split(',') };
    }

    // Fuzzy search company name or industry
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } },
        { accountManager: { $regex: search, $options: 'i' } },
      ];
    }

    const clients = await Client.find(query)
      .select('-contacts -notes -documents -contracts -meetings -communicationLogs -timeline')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: clients,
    });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userName = session.user.name;
    const body = await request.json();

    const parseResult = ClientIngestSchema.safeParse(body);
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

    const newClient = new Client({
      companyId,
      name: validated.name,
      clientType: validated.clientType,
      industry: validated.industry,
      emails: validated.emails,
      phones: validated.phones,
      address: validated.address,
      timezone: validated.timezone,
      website: validated.website,
      socialLinks: validated.socialLinks,
      companySize: validated.companySize,
      revenueContribution: validated.revenueContribution,
      accountManager: validated.accountManager,
      onboardingStatus: 'pending',
      retentionStatus: 'retained',
      healthScore: 80,
      customFields: validated.customFields,
      tags: validated.tags,
      isArchived: false,
      contacts: [],
      notes: [],
      documents: [],
      contracts: [],
      meetings: [],
      communicationLogs: [],
      timeline: [],
    });

    await newClient.save();

    // Decatur timeline logs - log directly to decoupled ClientActivity collection
    const activity = new ClientActivity({
      companyId,
      clientId: newClient._id,
      type: 'created',
      title: 'Client Account Onboarded',
      description: `Client organization "${validated.name}" recorded in core ERP ledger by ${userName}.`,
      userName,
    });
    await activity.save();

    return NextResponse.json({
      success: true,
      data: newClient,
    });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});

export const PUT = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userName = session.user.name;
    const body = await request.json();

    const { ids, accountManager } = body;

    if (!ids || !Array.isArray(ids) || !accountManager) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Missing client IDs or Account Manager',
        },
        { status: 400 }
      );
    }

    // 1. Perform bulk update in a single query
    const result = await Client.updateMany(
      { _id: { $in: ids }, companyId },
      { $set: { accountManager } }
    );

    // 2. Perform bulk activity logging in a single query
    if (ids.length > 0) {
      const dbActivities = ids.map((id) => ({
        companyId,
        clientId: id,
        type: 'update',
        title: 'Field "accountManager" updated',
        description: `Account Owner bulk reassigned to ${accountManager} by ${userName}.`,
        userName,
        createdAt: new Date(),
      }));
      await ClientActivity.insertMany(dbActivities);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully batch reassigned ${result.modifiedCount} accounts.`,
    });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
