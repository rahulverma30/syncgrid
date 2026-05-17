import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Lead } from '@/models/Lead';
import { hasRole } from '@/lib/auth/permission-checks';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const roles = session.user.roles || [];

    // Parse Search / Filters
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const source = url.searchParams.get('source') || '';
    const priority = url.searchParams.get('priority') || '';
    const assignedTo = url.searchParams.get('assignedTo') || '';
    const isArchivedParam = url.searchParams.get('isArchived');
    const isArchived = isArchivedParam === 'true';

    // Construct baseline query
    const query: Record<string, any> = { companyId, isArchived };

    // RBAC: If user is only a Sales Executive (not Super Admin or Sales Manager), restrict to assigned leads
    const hasElevatedAccess = hasRole(roles, ['super-admin', 'admin', 'sales-manager', 'manager']);
    if (!hasElevatedAccess) {
      query.assignedTo = userId;
    } else if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    // Apply filters
    if (status) query.status = status;
    if (source) query.source = source;
    if (priority) query.priority = priority;

    // Fuzzy search company name or contact person or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const leads = await Lead.find(query).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: leads,
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
    const userId = session.user.id;
    const userName = session.user.name;
    const body = await request.json();

    const {
      name,
      contactPerson,
      email,
      phone,
      alternateContacts,
      status,
      source,
      priority,
      budget,
      currency,
      workType,
      techStack,
      expectedCloseDate,
      assignedTo,
      socialLinks,
      customFields,
    } = body;

    if (!name || !contactPerson) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Company Name and Contact Person are required.',
        },
        { status: 400 }
      );
    }

    const newLead = new Lead({
      companyId,
      name,
      contactPerson,
      email,
      phone,
      alternateContacts: alternateContacts || [],
      status: status || 'new',
      source: source || 'website',
      priority: priority || 'medium',
      budget: budget || 0,
      currency: currency || 'USD',
      workType,
      techStack: techStack || [],
      expectedCloseDate,
      assignedTo: assignedTo || null,
      socialLinks: socialLinks || {},
      customFields: customFields || {},
      isArchived: false,
      notes: [],
      reminders: [],
      attachments: [],
      timeline: [
        {
          type: 'created',
          title: 'Lead Created',
          description: `Lead created by ${userName}`,
          userId,
          userName,
        },
      ],
    });

    await newLead.save();

    return NextResponse.json({
      success: true,
      data: newLead,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'CREATE_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
