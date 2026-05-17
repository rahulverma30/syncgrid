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

    const clients = await Client.find(query).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: clients,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'QUERY_ERROR', message: error.message },
      { status: 500 }
    );
  }
});

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userName = session.user.name;
    const body = await request.json();

    const {
      name,
      clientType,
      industry,
      emails,
      phones,
      address,
      timezone,
      website,
      socialLinks,
      companySize,
      revenueContribution,
      accountManager,
      onboardingStatus,
      retentionStatus,
      healthScore,
      customFields,
      tags,
    } = body;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Client Company Name is required.',
        },
        { status: 400 }
      );
    }

    const newClient = new Client({
      companyId,
      name,
      clientType: clientType || 'Startup',
      industry: industry || 'Tech Services',
      emails: emails || [],
      phones: phones || [],
      address: address || '',
      timezone: timezone || 'UTC',
      website: website || '',
      socialLinks: socialLinks || {},
      companySize: companySize || '1-10',
      revenueContribution: revenueContribution || 0,
      accountManager: accountManager || userName,
      onboardingStatus: onboardingStatus || 'pending',
      retentionStatus: retentionStatus || 'retained',
      healthScore: healthScore !== undefined ? healthScore : 80,
      customFields: customFields || {},
      tags: tags || [],
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
      description: `Client organization "${name}" recorded in core ERP ledger by ${userName}.`,
      userName,
    });
    await activity.save();

    return NextResponse.json({
      success: true,
      data: newClient,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'CREATE_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
