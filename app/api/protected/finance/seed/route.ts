import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import {
  Invoice,
  Transaction,
  Expense,
  Budget,
  Vendor,
  ClientBillingProfile,
  FinancialActivity,
  Client,
  Project,
  Department,
  Employee,
} from '@/models';
import { hasRole } from '@/lib/auth/permission-checks';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const userName = session.user.name;
    const roles = session.user.roles || [];

    const isAuthorized = hasRole(roles, ['super-admin', 'admin', 'finance']);
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'FORBIDDEN', message: 'Unauthorized' }, { status: 403 });
    }

    // 1. Wipe out previous finance collections for this tenant company only
    await Invoice.deleteMany({ companyId });
    await Transaction.deleteMany({ companyId });
    await Expense.deleteMany({ companyId });
    await Budget.deleteMany({ companyId });
    await Vendor.deleteMany({ companyId });
    await ClientBillingProfile.deleteMany({ companyId });
    await FinancialActivity.deleteMany({ companyId });

    // 2. Fetch or create fallback mock Clients & Projects
    let clients = await Client.find({ companyId });
    if (clients.length === 0) {
      const fallbackClient = new Client({
        companyId,
        name: 'Acme Digital Global',
        email: 'billing@acme.com',
        company: 'Acme Inc.',
        status: 'active',
      });
      await fallbackClient.save();
      clients = [fallbackClient];
    }

    let projects = await Project.find({ companyId });
    if (projects.length === 0) {
      const fallbackProject = new Project({
        companyId,
        name: 'Enterprise Cloud Portal',
        clientId: clients[0]._id,
        status: 'in_progress',
        budget: 75000,
        billingType: 'fixed_price',
      });
      await fallbackProject.save();
      projects = [fallbackProject];
    }

    let department = await Department.findOne({ companyId });
    if (!department) {
      department = new Department({
        companyId,
        name: 'Engineering',
        code: 'ENG',
        description: 'Software and Cloud engineering resources',
      });
      await department.save();
    }

    let employees = await Employee.find({ companyId });
    if (employees.length === 0) {
      const fallbackEmployee = new Employee({
        companyId,
        userId,
        firstName: session.user.name?.split(' ')[0] || 'John',
        lastName: session.user.name?.split(' ')[1] || 'Doe',
        email: session.user.email,
        departmentId: department._id,
        title: 'Principal SaaS Engineer',
        salary: 135000,
        status: 'active',
        onboardingChecklist: {
          'Signed Contract': true,
          'Issued Laptop': true,
          'Configured Credentials': true,
          'Introduction Call': true,
        },
      });
      await fallbackEmployee.save();
      employees = [fallbackEmployee];
    }

    // 3. Seed dynamic third-party Vendors
    const vendorsList = [
      {
        name: 'Vercel hosting solutions',
        email: 'billing@vercel.com',
        phone: '+1 (555) 456-7890',
        category: 'software',
        taxId: 'US-87654321',
        paymentTerms: 'net_15',
        notes: 'Enterprise platform cloud frontend deployments',
      },
      {
        name: 'Amazon Web Services AWS',
        email: 'aws-charges@amazon.com',
        phone: '+1 (555) 123-4567',
        category: 'software',
        taxId: 'US-12345678',
        paymentTerms: 'net_30',
        notes: 'Production servers databases backup cloud storage logs',
      },
      {
        name: 'KPMG Consulting Services',
        email: 'advisory@kpmg.com',
        category: 'consulting',
        paymentTerms: 'net_60',
        notes: 'ERP architecture annual financial auditing advisor',
      },
      {
        name: 'Office Depot Suppliers',
        email: 'support@officedepot.com',
        category: 'office_supplies',
        paymentTerms: 'due_on_receipt',
      },
    ];

    const seededVendors = await Vendor.insertMany(
      vendorsList.map((v) => ({ ...v, companyId, status: 'active' }))
    );

    // 4. Seed Client Billing Profiles
    const seededBillingProfiles = await ClientBillingProfile.insertMany(
      clients.map((c, idx) => ({
        companyId,
        clientId: c._id,
        billingEmail: c.email || 'billing@customer.com',
        preferredCurrency: idx % 2 === 0 ? 'USD' : 'EUR',
        paymentTerms: idx % 2 === 0 ? 'net_30' : 'net_15',
        taxExempt: false,
        taxRegistrationNumber: `VAT-${Math.floor(100000 + Math.random() * 900000)}`,
        automaticInvoicing: true,
        creditLimit: 50000,
        w9Attached: true,
      }))
    );

    // 5. Seed Active Budgets
    const budgetsList = [
      {
        name: 'Q2 Corporate Marketing Campaign',
        type: 'operational',
        amount: 25000,
        currency: 'USD',
        spentAmount: 8500,
        remainingAmount: 16500,
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60),
        alertThreshold: 80,
      },
      {
        name: 'DevOps Cloud Server Infrastructure',
        type: 'department',
        departmentId: department._id,
        amount: 15000,
        currency: 'USD',
        spentAmount: 12800, // spent > 80% to fire budget alarm threshold!
        remainingAmount: 2200,
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45),
        alertThreshold: 80,
        alertFired: true,
        notes: 'AWS/Vercel enterprise cluster cloud server nodes scaling budget',
      },
      {
        name: `${projects[0].name} Delivery Budget`,
        type: 'project',
        projectId: projects[0]._id,
        amount: 50000,
        currency: 'USD',
        spentAmount: 15000,
        remainingAmount: 35000,
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 70),
        alertThreshold: 75,
      },
    ];

    const seededBudgets = await Budget.insertMany(
      budgetsList.map((b) => ({ ...b, companyId, status: 'active' }))
    );

    // 6. Seed Invoices & Linked Clearing Transactions (over 4 months)
    const now = Date.now();
    const day = 1000 * 60 * 60 * 24;

    const invoicesToSeed = [
      {
        invoiceNumber: 'INV-1001',
        clientId: clients[0]._id,
        projectId: projects[0]._id,
        issueDate: new Date(now - 90 * day),
        dueDate: new Date(now - 60 * day),
        currency: 'USD',
        subtotal: 12500,
        discountTotal: 500,
        taxTotal: 2250, // 18% tax
        totalAmount: 14250,
        paidAmount: 14250,
        outstandingAmount: 0,
        status: 'paid',
        lineItems: [
          {
            description: 'Phase 1 Milestone: API architecture setup & design framework integration',
            quantity: 1,
            unitPrice: 12500,
            amount: 12500,
            taxRate: 18,
            taxAmount: 2250,
            discountAmount: 500,
            total: 14250,
          },
        ],
        notes: 'First milestone delivery payment invoice.',
      },
      {
        invoiceNumber: 'INV-1002',
        clientId: clients[0]._id,
        projectId: projects[0]._id,
        issueDate: new Date(now - 45 * day),
        dueDate: new Date(now - 15 * day),
        currency: 'USD',
        subtotal: 18000,
        discountTotal: 0,
        taxTotal: 3240,
        totalAmount: 21240,
        paidAmount: 21240,
        status: 'paid',
        outstandingAmount: 0,
        lineItems: [
          {
            description: 'Phase 2: Authentication modules & Real-time socket broadcast engines integration',
            quantity: 1,
            unitPrice: 18000,
            amount: 18000,
            taxRate: 18,
            taxAmount: 3240,
            discountAmount: 0,
            total: 21240,
          },
        ],
      },
      {
        invoiceNumber: 'INV-1003',
        clientId: clients[0]._id,
        projectId: projects[0]._id,
        issueDate: new Date(now - 10 * day),
        dueDate: new Date(now + 20 * day),
        currency: 'USD',
        subtotal: 15000,
        discountTotal: 0,
        taxTotal: 2700,
        totalAmount: 17700,
        paidAmount: 0,
        outstandingAmount: 17700,
        status: 'sent',
        lineItems: [
          {
            description: 'Phase 3: Sprint delivery and payroll audit features dashboard UI cockpit',
            quantity: 1,
            unitPrice: 15000,
            amount: 15000,
            taxRate: 18,
            taxAmount: 2700,
            discountAmount: 0,
            total: 17700,
          },
        ],
        notes: 'Pending customer corporate clearing ledger review.',
      },
      {
        invoiceNumber: 'INV-1004',
        clientId: clients[0]._id,
        projectId: projects[0]._id,
        issueDate: new Date(now - 40 * day),
        dueDate: new Date(now - 10 * day), // Overdue! Due date set in the past!
        currency: 'USD',
        subtotal: 9000,
        discountTotal: 200,
        taxTotal: 1620,
        totalAmount: 10420,
        paidAmount: 2000, // partially paid!
        outstandingAmount: 8420,
        status: 'overdue',
        lineItems: [
          {
            description: 'Retainer Support fee - corporate consulting & agile systems integration hours',
            quantity: 45,
            unitPrice: 200,
            amount: 9000,
            taxRate: 18,
            taxAmount: 1620,
            discountAmount: 200,
            total: 10420,
          },
        ],
      },
      {
        invoiceNumber: 'INV-1005',
        clientId: clients[0]._id,
        projectId: projects[0]._id,
        issueDate: new Date(now - 2 * day),
        dueDate: new Date(now + 28 * day),
        currency: 'USD',
        subtotal: 5000,
        discountTotal: 0,
        taxTotal: 900,
        totalAmount: 5900,
        paidAmount: 0,
        outstandingAmount: 5900,
        status: 'draft',
        lineItems: [
          {
            description: 'UX Design Wireframes & Client Branding Kit assets',
            quantity: 1,
            unitPrice: 5000,
            amount: 5000,
            taxRate: 18,
            taxAmount: 900,
            discountAmount: 0,
            total: 5900,
          },
        ],
      },
    ];

    const seededInvoices = await Invoice.insertMany(
      invoicesToSeed.map((inv) => ({ ...inv, companyId, createdById: userId }))
    );

    // 7. Seed Transaction clearing records linked to paid invoices
    const txnsList = [
      {
        transactionNumber: 'TXN-10001',
        invoiceId: seededInvoices[0]._id,
        clientId: clients[0]._id,
        paymentMethod: 'bank_transfer',
        type: 'income',
        currency: 'USD',
        exchangeRate: 1.0,
        amount: 14250,
        status: 'cleared',
        referenceNumber: 'REF-BANK-987654321',
        paymentDate: new Date(now - 60 * day),
        description: 'Wire payout for Phase 1 delivery ledger clearing',
        createdById: userId,
      },
      {
        transactionNumber: 'TXN-10002',
        invoiceId: seededInvoices[1]._id,
        clientId: clients[0]._id,
        paymentMethod: 'stripe',
        type: 'income',
        currency: 'USD',
        exchangeRate: 1.0,
        amount: 21240,
        status: 'cleared',
        referenceNumber: 'ch_stripe_238478237',
        paymentDate: new Date(now - 14 * day),
        description: 'Stripe transaction payout for Phase 2 integration milestone',
        createdById: userId,
      },
      {
        transactionNumber: 'TXN-10003',
        invoiceId: seededInvoices[3]._id,
        clientId: clients[0]._id,
        paymentMethod: 'upi',
        type: 'income',
        currency: 'USD',
        exchangeRate: 1.0,
        amount: 2000,
        status: 'cleared',
        referenceNumber: 'upi_ref_384792374982',
        paymentDate: new Date(now - 12 * day),
        description: 'Partial advance clearing payment retainer support hours',
        createdById: userId,
      },
      // Direct corporate operational expense logs
      {
        transactionNumber: 'TXN-10004',
        paymentMethod: 'manual',
        type: 'expense',
        currency: 'USD',
        exchangeRate: 1.0,
        amount: 1200,
        status: 'cleared',
        paymentDate: new Date(now - 25 * day),
        description: 'AWS Enterprise Cloud clusters fee billing (Operational spent)',
        createdById: userId,
      },
      {
        transactionNumber: 'TXN-10005',
        paymentMethod: 'stripe',
        type: 'expense',
        currency: 'USD',
        exchangeRate: 1.0,
        amount: 300,
        status: 'cleared',
        paymentDate: new Date(now - 24 * day),
        description: 'Vercel Enterprise frontend hosting team subscription',
        createdById: userId,
      },
      {
        transactionNumber: 'TXN-10006',
        paymentMethod: 'bank_transfer',
        type: 'expense',
        currency: 'USD',
        exchangeRate: 1.0,
        amount: 7000,
        status: 'cleared',
        paymentDate: new Date(now - 22 * day),
        description: 'Professional Auditing Consultant retainers advisory',
        createdById: userId,
      },
    ];

    await Transaction.insertMany(txnsList.map((t) => ({ ...t, companyId })));

    // 8. Seed Expense Claims & Corporate Expenses
    const expensesList = [
      {
        expenseNumber: 'EXP-1001',
        category: 'software',
        merchant: 'Amazon Web Services AWS',
        amount: 1200,
        currency: 'USD',
        taxAmount: 0,
        expenseDate: new Date(now - 25 * day),
        reimbursementStatus: 'none',
        approvalWorkflow: { currentStep: 'done', status: 'approved', approverId: userId },
        paymentStatus: 'paid',
        paymentDate: new Date(now - 25 * day),
        notes: 'Monthly enterprise cluster cloud instances',
        createdById: userId,
      },
      {
        expenseNumber: 'EXP-1002',
        category: 'software',
        merchant: 'Vercel hosting solutions',
        amount: 300,
        currency: 'USD',
        taxAmount: 0,
        expenseDate: new Date(now - 24 * day),
        reimbursementStatus: 'none',
        approvalWorkflow: { currentStep: 'done', status: 'approved', approverId: userId },
        paymentStatus: 'paid',
        paymentDate: new Date(now - 24 * day),
        notes: 'Vercel frontend hosting enterprise fee',
        createdById: userId,
      },
      {
        expenseNumber: 'EXP-1003',
        category: 'consulting',
        merchant: 'KPMG Advisors',
        amount: 7000,
        currency: 'USD',
        expenseDate: new Date(now - 22 * day),
        reimbursementStatus: 'none',
        approvalWorkflow: { currentStep: 'done', status: 'approved', approverId: userId },
        paymentStatus: 'paid',
        paymentDate: new Date(now - 22 * day),
        notes: 'Financial auditing consult retainer',
        createdById: userId,
      },
      // Employee personal claims pending review!
      {
        expenseNumber: 'EXP-1004',
        category: 'travel',
        merchant: 'Delta Airlines Flights',
        employeeId: employees[0]._id,
        projectId: projects[0]._id,
        amount: 650,
        currency: 'USD',
        taxAmount: 45,
        expenseDate: new Date(now - 5 * day),
        reimbursementStatus: 'pending',
        approvalWorkflow: {
          currentStep: 'manager',
          status: 'pending',
          history: [],
        },
        paymentStatus: 'unpaid',
        notes: 'Client onsite presentation meeting travel expenses flight tickets',
        createdById: employees[0].userId || userId,
      },
      {
        expenseNumber: 'EXP-1005',
        category: 'meals',
        merchant: 'Ruths Chris Steak House',
        employeeId: employees[0]._id,
        projectId: projects[0]._id,
        amount: 180,
        currency: 'USD',
        expenseDate: new Date(now - 4 * day),
        reimbursementStatus: 'pending',
        approvalWorkflow: {
          currentStep: 'manager',
          status: 'pending',
          history: [],
        },
        paymentStatus: 'unpaid',
        notes: 'Client dinner discussion onsite sprint planning session',
        createdById: employees[0].userId || userId,
      },
      {
        expenseNumber: 'EXP-1006',
        category: 'hardware',
        merchant: 'Apple Store Retail',
        employeeId: employees[0]._id,
        amount: 1499,
        currency: 'USD',
        taxAmount: 110,
        expenseDate: new Date(now - 12 * day),
        reimbursementStatus: 'approved', // already approved reimbursement
        approvalWorkflow: {
          currentStep: 'done',
          status: 'approved',
          approverId: userId,
          comments: 'Approved new MacBook device screen replacement',
          history: [
            {
              approverId: userId,
              action: 'approved',
              comments: 'Laptop repair approved',
              timestamp: new Date(now - 11 * day),
            },
          ],
        },
        paymentStatus: 'paid',
        paymentDate: new Date(now - 11 * day),
        notes: 'Emergency monitor repair for developers work station',
        createdById: employees[0].userId || userId,
      },
    ];

    await Expense.insertMany(expensesList.map((e) => ({ ...e, companyId })));

    // 9. Seed Financial Activities to populate notification logs
    const activitiesList = [
      {
        type: 'invoice_created',
        title: 'Invoice Draft Generated',
        description: 'New invoice draft INV-1005 built for UX wireframes delivery.',
        metadata: { invoiceNumber: 'INV-1005' },
        severity: 'info',
      },
      {
        type: 'payment_received',
        title: 'Corporate Payment Received',
        description: 'Cleared transaction TXN-10002. Received USD 21,240.00 for Phase 2 milestone.',
        metadata: { transactionNumber: 'TXN-10002', amount: 21240 },
        severity: 'info',
      },
      {
        type: 'budget_threshold_crossed',
        title: 'Budget Alert Threshold Fired!',
        description: 'DevOps server infrastructure budget spent ratio crossed 80% warning limit (Spent: $12,800 / $15,000).',
        metadata: { spentRatio: 85.3 },
        severity: 'critical',
      },
    ];

    await FinancialActivity.insertMany(
      activitiesList.map((a) => ({
        ...a,
        companyId,
        userId,
        userName,
      }))
    );

    return NextResponse.json({ success: true, message: 'Finance seeded cleanly!' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ACTION_FAILED', message: error.message },
      { status: 500 }
    );
  }
});
