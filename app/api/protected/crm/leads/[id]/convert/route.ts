import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Lead } from '@/models/Lead';
import { Client } from '@/models/Client';
import { Project } from '@/models/Project';
import { hasRole } from '@/lib/auth/permission-checks';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const userName = session.user.name;
    const roles = session.user.roles || [];
    const leadId = context.params.id;

    const lead = await Lead.findOne({ _id: leadId, companyId });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Lead not found or unauthorized.' },
        { status: 404 }
      );
    }

    // RBAC: Sales Executive can only convert assigned leads
    const hasElevatedAccess = hasRole(roles, ['super-admin', 'admin', 'sales-manager', 'manager']);
    if (!hasElevatedAccess && lead.assignedTo?.toString() !== userId) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Access denied to convert this lead.' },
        { status: 403 }
      );
    }

    if (lead.status === 'won') {
      return NextResponse.json(
        { success: false, error: 'ALREADY_CONVERTED', message: 'Lead is already converted.' },
        { status: 400 }
      );
    }

    // Update lead status to won
    lead.status = 'won';
    lead.timeline.push({
      type: 'stage_change',
      title: 'Lead Converted to Client',
      description: `Lead converted to Client by ${userName}`,
      userId,
      userName,
    });
    await lead.save();

    // Create the Client record
    const emails = lead.email ? [lead.email] : [];
    const phones = lead.phone ? [lead.phone] : [];

    // Convert alternate contacts to client contacts
    const contacts = [
      {
        name: lead.contactPerson,
        email: lead.email,
        phone: lead.phone,
        isPrimary: true,
      },
    ];

    if (lead.alternateContacts && lead.alternateContacts.length > 0) {
      lead.alternateContacts.forEach((ac: any) => {
        contacts.push({
          name: ac.name,
          email: ac.email,
          phone: ac.phone,
          isPrimary: false,
        });
      });
    }

    const newClient = new Client({
      companyId,
      name: lead.name,
      clientType: 'Startup',
      industry: lead.workType || 'General',
      emails,
      phones,
      website: '', // Assuming not in Lead directly, could be mapped if it existed
      accountManager: userName, // Or keep assignedTo ID based on what string represents
      contacts,
      revenueContribution: lead.budget || 0,
      tags: lead.techStack || [],
      timeline: [
        {
          type: 'created',
          title: 'Client Imported',
          description: `Client generated automatically from Lead conversion by ${userName}`,
          userName,
        },
      ],
    });

    await newClient.save();

    // Also scaffold a planning Project to represent the Deal, if applicable
    const newProject = new Project({
      companyId,
      name: `Project for ${newClient.name}`,
      code: `PRJ-${Math.floor(Math.random() * 9000) + 1000}`,
      description: `Auto-generated project for converted lead ${lead.name}`,
      clientId: newClient._id,
      leadId: lead._id,
      status: 'planning',
      priority: lead.priority,
      projectManager: userName,
      budget: lead.budget || 0,
      billingType: 'fixed',
      technologies: lead.techStack || [],
      timeline: [
        {
          type: 'created',
          title: 'Project Initialized',
          description: `Project auto-generated from Lead conversion by ${userName}`,
          userName,
        },
      ],
    });

    await newProject.save();

    return NextResponse.json({
      success: true,
      message: 'Lead successfully converted to Client and Project.',
      data: {
        lead,
        client: newClient,
        project: newProject,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'CONVERT_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
