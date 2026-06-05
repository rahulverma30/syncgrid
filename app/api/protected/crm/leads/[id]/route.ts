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
    const params = await context.params;
    const leadId = params.id;

    const lead = await Lead.findOne({ _id: leadId, companyId });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Lead not found or unauthorized.' },
        { status: 404 }
      );
    }

    // RBAC check: Sales Executive can only access assigned leads
    const hasElevatedAccess = hasRole(roles, ['super-admin', 'admin', 'sales-manager', 'manager']);
    if (!hasElevatedAccess && lead.assignedTo?.toString() !== userId) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Access denied to this lead.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: lead,
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
    const userId = session.user.id;
    const userName = session.user.name;
    const roles = session.user.roles || [];
    const params = await context.params;
    const leadId = params.id;
    const body = await request.json();

    const lead = await Lead.findOne({ _id: leadId, companyId });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Lead not found or unauthorized.' },
        { status: 404 }
      );
    }

    // RBAC: Sales Executive can only update assigned leads
    const hasElevatedAccess = hasRole(roles, ['super-admin', 'admin', 'sales-manager', 'manager']);
    if (!hasElevatedAccess && lead.assignedTo?.toString() !== userId) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Access denied to edit this lead.' },
        { status: 403 }
      );
    }

    const oldStatus = lead.status;
    const oldAssignedTo = lead.assignedTo?.toString();

    // Update fields
    const fieldsToUpdate = [
      'name',
      'contactPerson',
      'email',
      'phone',
      'alternateContacts',
      'status',
      'source',
      'priority',
      'budget',
      'currency',
      'workType',
      'techStack',
      'expectedCloseDate',
      'assignedTo',
      'socialLinks',
      'customFields',
      'isArchived',
    ];

    fieldsToUpdate.forEach((field) => {
      if (body[field] !== undefined) {
        lead[field] = body[field];
      }
    });

    // If status changed, log stage transition
    if (body.status && body.status !== oldStatus) {
      lead.timeline.push({
        type: 'stage_change',
        title: 'Lead Stage Changed',
        description: `Stage updated from "${oldStatus}" to "${body.status}" by ${userName}`,
        userId,
        userName,
      });
    }

    // If assignment changed, log assignment transition
    if (body.assignedTo !== undefined && body.assignedTo !== oldAssignedTo) {
      lead.timeline.push({
        type: 'assignment',
        title: 'Lead Reassigned',
        description: body.assignedTo
          ? `Lead reassigned to user by ${userName}`
          : `Lead assignment cleared by ${userName}`,
        userId,
        userName,
      });
    }

    await lead.save();

    return NextResponse.json({
      success: true,
      data: lead,
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
    const userId = session.user.id;
    const roles = session.user.roles || [];
    const params = await context.params;
    const leadId = params.id;

    // RBAC: Only Super Admin, Sales Manager can permanently delete leads
    const hasElevatedAccess = hasRole(roles, ['super-admin', 'admin', 'sales-manager', 'manager']);
    if (!hasElevatedAccess) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Only administrators or sales managers can delete records.',
        },
        { status: 403 }
      );
    }

    const lead = await Lead.findOneAndDelete({ _id: leadId, companyId });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Lead not found or unauthorized.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Lead permanently deleted successfully.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'DELETE_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
