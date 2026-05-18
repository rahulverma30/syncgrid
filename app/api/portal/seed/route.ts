import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Company } from '@/models/Company';
import { Client } from '@/models/Client';
import { Project } from '@/models/Project';
import { ClientPortalUser } from '@/models/ClientPortalUser';
import { ClientProjectAccess } from '@/models/ClientProjectAccess';
import { ClientApprovalRequest } from '@/models/ClientApprovalRequest';
import { SharedDeliverable } from '@/models/SharedDeliverable';
import { SharedDocument } from '@/models/SharedDocument';
import { SharedInvoice } from '@/models/SharedInvoice';
import { SupportTicket } from '@/models/SupportTicket';
import { ClientAnnouncement } from '@/models/ClientAnnouncement';
import { Document } from '@/models/Document';
import { Invoice } from '@/models/Invoice';
import { hashPassword } from '@/lib/security/password';

export async function GET() {
  try {
    await connectToDatabase();

    // 1. Ensure Demo Company exists
    let company = await Company.findOne({ name: 'Stark Industries' });
    if (!company) {
      company = new Company({
        name: 'Stark Industries',
        subdomain: 'stark',
        status: 'active',
      });
      await company.save();
    }

    const companyId = company._id;

    // 2. Ensure Demo Client exists
    let client = await Client.findOne({ name: 'Stark Enterprises', companyId });
    if (!client) {
      client = new Client({
        companyId,
        name: 'Stark Enterprises',
        status: 'active',
        primaryContact: {
          name: 'Pepper Potts',
          email: 'pepper@stark.com',
        },
      });
      await client.save();
    }

    const clientId = client._id;

    // 3. Hash password and build Portal Owners
    const passwordHash = await hashPassword('password123');

    let pepper = await ClientPortalUser.findOne({ email: 'pepper@stark.com' });
    if (!pepper) {
      pepper = new ClientPortalUser({
        companyId,
        clientId,
        name: 'Pepper Potts',
        email: 'pepper@stark.com',
        passwordHash,
        portalRole: 'Client Owner',
        status: 'active',
      });
      await pepper.save();
    }

    let happy = await ClientPortalUser.findOne({ email: 'happy@stark.com' });
    if (!happy) {
      happy = new ClientPortalUser({
        companyId,
        clientId,
        name: 'Happy Hogan',
        email: 'happy@stark.com',
        passwordHash,
        portalRole: 'Client Reviewer',
        status: 'active',
      });
      await happy.save();
    }

    // 4. Ensure Demo Project exists
    let project = await Project.findOne({ name: 'Arc Reactor MK-V', clientId });
    if (!project) {
      project = new Project({
        companyId,
        clientId,
        name: 'Arc Reactor MK-V',
        code: 'ARC-V',
        status: 'development',
        progressPercentage: 65,
        healthScore: 92,
        budget: 500000,
        startDate: new Date(),
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        milestones: [
          {
            title: 'Palladium Core Blueprint Calibration',
            description: 'Thermal balancing and structural design files calibration',
            status: 'completed',
            dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'Vibranium Shell Molding & Stress Testing',
            description: 'Shell assembly line pressure checks',
            status: 'pending',
            dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          },
        ],
      });
      await project.save();
    }

    const projectId = project._id;

    // 5. Build visibility rules
    let rule = await ClientProjectAccess.findOne({ projectId });
    if (!rule) {
      rule = new ClientProjectAccess({
        clientId,
        projectId,
        isAccessAllowed: true,
        showMilestones: true,
        showTasks: false,
        showBudgets: false, // Shield the $500K budget!
        showTimeLogs: false,
      });
      await rule.save();
    }

    // 6. Build a shared deliverable to approve
    let deliv = await SharedDeliverable.findOne({ projectId });
    if (!deliv) {
      deliv = new SharedDeliverable({
        companyId,
        projectId,
        title: 'Arc Core blueprints version 5.0.2',
        description: 'Vibranium outer core shell schematic diagrams ready for calibration review.',
        url: 'https://syncgrid-assets.com/blueprints-v5.pdf',
        stagingUrl: 'https://reactor-calibration-staging.stark.com',
        version: '5.0.2',
        status: 'pending_review',
        uploadedBy: 'Tony Stark (Super Admin)',
      });
      await deliv.save();
    }

    // 7. Connect dynamic ClientApprovalRequest for quick action
    let approval = await ClientApprovalRequest.findOne({ referenceId: deliv._id });
    if (!approval) {
      approval = new ClientApprovalRequest({
        companyId,
        clientId,
        projectId,
        title: 'Calibrate Arc blueprints v5.0.2',
        description:
          'Check vibrational coefficient values against the shell layout sheet before production assembly.',
        type: 'deliverable',
        referenceId: deliv._id,
        status: 'pending',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        history: [],
      });
      await approval.save();
    }

    // 8. Create dynamic shared documents in vault
    let dummyDoc = await Document.findOne({ name: 'Stark-Enterprises-NDA.pdf' });
    if (!dummyDoc) {
      dummyDoc = new Document({
        companyId,
        name: 'Stark-Enterprises-NDA.pdf',
        category: 'legal',
        url: 'https://syncgrid-vault.com/Stark-NDA.pdf',
        size: 204800,
      });
      await dummyDoc.save();
    }

    let sharedDoc = await SharedDocument.findOne({ documentId: dummyDoc._id });
    if (!sharedDoc) {
      sharedDoc = new SharedDocument({
        companyId,
        clientId,
        documentId: dummyDoc._id,
        isDownloadable: true,
        isWatermarked: true,
        watermarkText: 'CONFIDENTIAL BLUEPRINT',
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        sharedBy: 'Tony Stark (Super Admin)',
      });
      await sharedDoc.save();
    }

    // 9. Build a shared invoice
    let dummyInvoice = await Invoice.findOne({ invoiceNumber: 'INV-2026-001' });
    if (!dummyInvoice) {
      dummyInvoice = new Invoice({
        companyId,
        clientId,
        invoiceNumber: 'INV-2026-001',
        total: 125000,
        status: 'unpaid',
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      });
      await dummyInvoice.save();
    }

    let sharedInv = await SharedInvoice.findOne({ invoiceId: dummyInvoice._id });
    if (!sharedInv) {
      sharedInv = new SharedInvoice({
        companyId,
        clientId,
        invoiceId: dummyInvoice._id,
        isShared: true,
        paymentUrl: 'https://syncgrid-stripe.com/pay/inv_001',
        customNotes: 'Calibration retainer invoice',
      });
      await sharedInv.save();
    }

    // 10. Make announcements
    let ann = await ClientAnnouncement.findOne({ title: 'Welcome to Stark Collaboration Space' });
    if (!ann) {
      ann = new ClientAnnouncement({
        companyId,
        title: 'Welcome to Stark Collaboration Space',
        content:
          'We activated the dynamic project calibration environment. Tony and Pepper Potts are online to address blueprints reviews directly on the discussion thread.',
        publishedBy: 'Tony Stark',
        isPinned: true,
      });
      await ann.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Demo Stark Enterprises client portal data seeded successfully!',
      seededUser: 'pepper@stark.com',
      password: 'password123',
    });
  } catch (error: any) {
    console.error('Seed API Error:', error);
    return NextResponse.json(
      { success: false, error: 'SEED_FAILED', message: error.message },
      { status: 500 }
    );
  }
}

// POST endpoint to handle dynamic invite requests from portal manager
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { action, clientId, name, email, portalRole } = body;

    if (action === 'invite') {
      const passwordHash = await hashPassword('password123'); // Default password for new invites
      const client = await Client.findById(clientId);
      if (!client) {
        return NextResponse.json({ success: false, message: 'Client not found.' }, { status: 404 });
      }

      let existing = await ClientPortalUser.findOne({ email: email.toLowerCase() });
      if (existing) {
        return NextResponse.json(
          { success: false, message: 'User already exists.' },
          { status: 400 }
        );
      }

      const newUser = new ClientPortalUser({
        companyId: client.companyId,
        clientId,
        name,
        email: email.toLowerCase(),
        passwordHash,
        portalRole: portalRole || 'Client Reviewer',
        status: 'invited',
      });

      await newUser.save();

      return NextResponse.json({
        success: true,
        message: 'Portal user invited successfully.',
        data: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          portalRole: newUser.portalRole,
        },
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action.' }, { status: 400 });
  } catch (error: any) {
    console.error('Invite Action Error:', error);
    return NextResponse.json(
      { success: false, error: 'ACTION_FAILED', message: error.message },
      { status: 500 }
    );
  }
}
