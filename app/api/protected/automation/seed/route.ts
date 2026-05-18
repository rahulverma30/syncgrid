import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import {
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowLog,
  AutomationTemplate,
  ApprovalChain,
  EventSubscription,
  FinancialActivity,
} from '@/models';
import { hasRole } from '@/lib/auth/permission-checks';
import mongoose from 'mongoose';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const userName = session.user.name;
    const roles = session.user.roles || [];

    const isAuthorized = hasRole(roles, ['super-admin', 'admin', 'finance']);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Unauthorized.' },
        { status: 403 }
      );
    }

    // 1. Clean existing records for this tenant
    await WorkflowDefinition.deleteMany({ companyId });
    await WorkflowExecution.deleteMany({ companyId });
    await WorkflowLog.deleteMany({ companyId });
    await ApprovalChain.deleteMany({ companyId });
    await EventSubscription.deleteMany({ companyId });
    await AutomationTemplate.deleteMany({ companyId });

    // 2. Seed Default Templates (system templates and localized copies)
    const defaultTemplates = [
      {
        name: 'New Employee HR Onboarding Checklist',
        description:
          'Triggers when a new employee is onboarded. Assigns administrative checklist tasks, posts general channel welcome cards, and logs activities.',
        category: 'hr',
        triggerConfig: {
          type: 'employee_onboarded',
          options: {},
        },
        actionChain: [
          {
            actionId: 'notify_welcome',
            type: 'send_notification',
            options: {
              title: 'Welcome to the Team! 🎉',
              message: 'Let us celebrate onboarding {{employee_name}} to our division!',
              type: 'info',
            },
          },
          {
            actionId: 'create_onboard_task',
            type: 'create_task',
            options: {
              title: 'Provision secure credentials and hardware logs',
              description:
                'Set up company corporate email, VPN connections, Slack channel logs, and dev repositories for {{employee_name}}.',
              status: 'todo',
              priority: 'high',
            },
          },
          {
            actionId: 'notify_setup_complete',
            type: 'send_notification',
            options: {
              title: 'HR setup complete',
              message: 'Onboarding configurations completed successfully.',
              type: 'success',
            },
          },
        ],
        conditions: {
          logicalOperator: 'and',
          rules: [],
        },
        isSystem: true,
        companyId,
      },
      {
        name: 'High-Value Invoice Payment Reconciliation Escalator',
        description:
          'Triggers upon overdue invoices. For invoices exceeding $10,000, alerts high-level supervisors, sends billing emails, and flags accounts.',
        category: 'finance',
        triggerConfig: {
          type: 'invoice_overdue',
          options: {},
        },
        actionChain: [
          {
            actionId: 'notify_finance_team',
            type: 'send_notification',
            options: {
              title: 'OVERDUE INVOICE ALERT ⚠️',
              message: 'Invoice {{invoice_number}} has exceeded payment periods limit.',
              type: 'warning',
            },
          },
          {
            actionId: 'finance_escalation',
            type: 'escalate',
            options: {
              title: 'Overdue receivables exceeding limits',
              message: 'Invoice {{invoice_number}} totaling {{invoice_amount}} remains unpaid.',
            },
          },
          {
            actionId: 'send_followup_email',
            type: 'send_email',
            options: {
              to: 'billing-reminders@syncgrid.com',
              subject: 'URGENT: Outstanding payment balance action requested',
            },
          },
        ],
        conditions: {
          logicalOperator: 'and',
          rules: [
            {
              field: 'invoice_amount',
              operator: 'greater_than',
              value: 10000,
            },
          ],
        },
        isSystem: true,
        companyId,
      },
      {
        name: 'Multi-Step Expense Reimbursement Approval Chain',
        description:
          'Triggers on expense submissions. Suspends execution, dispatches sequential approval requests to managers, and writes entries upon approval.',
        category: 'finance',
        triggerConfig: {
          type: 'expense_submitted',
          options: {},
        },
        actionChain: [
          {
            actionId: 'expense_approval',
            type: 'approval_request',
            options: {
              title: 'Expense Reimbursement: {{expense_title}}',
              description:
                'Reimbursement request submitted by {{employee_name}} for {{expense_amount}}.',
              requestType: 'expense',
              approvers: [
                { id: userId, name: userName },
                { id: 'admin_user_placeholder_id', name: 'VP Operations' },
              ],
            },
          },
          {
            actionId: 'ledger_entry',
            type: 'create_finance_entry',
            options: {
              title: 'Log reimbursed expense: {{expense_title}}',
              amount: '{{expense_amount}}',
              description: 'Transaction generated by automated approval workflows.',
            },
          },
        ],
        isSystem: true,
        companyId,
      },
    ];

    await AutomationTemplate.insertMany(defaultTemplates);

    // 3. Seed 2 Active Workflows definitions derived from templates
    const activeWfs = [
      {
        companyId,
        name: 'Corporate HR Welcome and Hardware Provisioning',
        description: 'Automates employee welcome alarms and assigns secure admin checklists.',
        category: 'hr',
        triggerConfig: { type: 'employee_onboarded', options: {} },
        actionChain: defaultTemplates[0].actionChain,
        conditions: { logicalOperator: 'and', rules: [] },
        version: 1,
        status: 'active',
        ownerId: userId,
        isArchived: false,
      },
      {
        companyId,
        name: 'Agency Receivable Overdue High-Value Alert Escalations',
        description: 'Checks financial overdue margins and schedules notifications.',
        category: 'finance',
        triggerConfig: { type: 'invoice_overdue', options: {} },
        actionChain: defaultTemplates[1].actionChain,
        conditions: defaultTemplates[1].conditions,
        version: 1,
        status: 'active',
        ownerId: userId,
        isArchived: false,
      },
    ];

    const seededWfs = await WorkflowDefinition.insertMany(activeWfs);

    // Register active triggers inside subscriptions
    await EventSubscription.insertMany(
      seededWfs.map((wf) => ({
        companyId,
        eventName: wf.triggerConfig.type,
        workflowId: wf._id,
        active: true,
      }))
    );

    // 4. Seed Mock Workflow Executions Histories
    const mockExecutions = [
      {
        companyId,
        workflowId: seededWfs[0]._id,
        workflowVersion: 1,
        triggerEvent: 'employee_onboarded',
        triggerPayload: { employee_name: 'Sophia Patel', role: 'Staff Designer' },
        variables: {
          employee_name: 'Sophia Patel',
          role: 'Staff Designer',
          trigger_event: 'employee_onboarded',
        },
        status: 'completed',
        stepHistory: [
          {
            actionId: 'notify_welcome',
            type: 'send_notification',
            status: 'success',
            executedAt: new Date(Date.now() - 1000 * 60 * 60),
            durationMs: 42,
          },
          {
            actionId: 'create_onboard_task',
            type: 'create_task',
            status: 'success',
            executedAt: new Date(Date.now() - 1000 * 60 * 58),
            durationMs: 120,
          },
          {
            actionId: 'notify_setup_complete',
            type: 'send_notification',
            status: 'success',
            executedAt: new Date(Date.now() - 1000 * 60 * 57),
            durationMs: 15,
          },
        ],
        startedAt: new Date(Date.now() - 1000 * 60 * 60),
        endedAt: new Date(Date.now() - 1000 * 60 * 57),
      },
      {
        companyId,
        workflowId: seededWfs[1]._id,
        workflowVersion: 1,
        triggerEvent: 'invoice_overdue',
        triggerPayload: { invoice_number: 'INV-2026-081', invoice_amount: 14500 },
        variables: {
          invoice_number: 'INV-2026-081',
          invoice_amount: '14500',
          trigger_event: 'invoice_overdue',
        },
        status: 'failed',
        currentNodeId: 'send_followup_email',
        stepHistory: [
          {
            actionId: 'notify_finance_team',
            type: 'send_notification',
            status: 'success',
            executedAt: new Date(Date.now() - 1000 * 60 * 10),
            durationMs: 38,
          },
          {
            actionId: 'finance_escalation',
            type: 'escalate',
            status: 'success',
            executedAt: new Date(Date.now() - 1000 * 60 * 9),
            durationMs: 50,
          },
          {
            actionId: 'send_followup_email',
            type: 'send_email',
            status: 'failed',
            error: 'SMTP Gateway connection timed out.',
            retryCount: 3,
            executedAt: new Date(Date.now() - 1000 * 60 * 5),
          },
        ],
        errorLog: {
          message: 'SMTP Gateway connection timed out.',
          nodeId: 'send_followup_email',
        },
        startedAt: new Date(Date.now() - 1000 * 60 * 10),
        endedAt: new Date(Date.now() - 1000 * 60 * 5),
      },
    ];

    const seededExecs = await WorkflowExecution.insertMany(mockExecutions);

    // 5. Seed associated steps trace Logs
    const seededLogs = [
      {
        companyId,
        executionId: seededExecs[0]._id,
        workflowId: seededWfs[0]._id,
        nodeId: 'notify_welcome',
        level: 'success',
        message: 'Step "send_notification" executed successfully.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
      },
      {
        companyId,
        executionId: seededExecs[0]._id,
        workflowId: seededWfs[0]._id,
        nodeId: 'create_onboard_task',
        level: 'success',
        message: 'Step "create_task" executed successfully. Task ID provisioned: 60a5e8c1.',
        timestamp: new Date(Date.now() - 1000 * 60 * 58),
      },
      {
        companyId,
        executionId: seededExecs[0]._id,
        workflowId: seededWfs[0]._id,
        level: 'success',
        message:
          'Workflow "Corporate HR Welcome and Hardware Provisioning" completed successfully in 180s.',
        timestamp: new Date(Date.now() - 1000 * 60 * 57),
      },
      {
        companyId,
        executionId: seededExecs[1]._id,
        workflowId: seededWfs[1]._id,
        nodeId: 'notify_finance_team',
        level: 'success',
        message: 'Step "send_notification" executed successfully.',
        timestamp: new Date(Date.now() - 1000 * 60 * 10),
      },
      {
        companyId,
        executionId: seededExecs[1]._id,
        workflowId: seededWfs[1]._id,
        nodeId: 'finance_escalation',
        level: 'success',
        message:
          'Step "escalate" executed successfully. High-priority escalation warning flags pushed.',
        timestamp: new Date(Date.now() - 1000 * 60 * 9),
      },
      {
        companyId,
        executionId: seededExecs[1]._id,
        workflowId: seededWfs[1]._id,
        nodeId: 'send_followup_email',
        level: 'error',
        message:
          'Step "send_email" failed permanently. Retries limit breached. Error: SMTP Gateway connection timed out.',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
      },
    ];

    await WorkflowLog.insertMany(seededLogs);

    // 6. Seed one halted sequential approval request
    const mockApprovalWorkflow = new WorkflowDefinition({
      companyId,
      name: 'Client Executive Dinner Budget approval',
      description: 'Halted reimbursement loop pending finance team sequential review.',
      category: 'finance',
      triggerConfig: { type: 'expense_submitted', options: {} },
      actionChain: defaultTemplates[2].actionChain,
      version: 1,
      status: 'active',
      ownerId: userId,
      isArchived: false,
    });
    await mockApprovalWorkflow.save();

    const mockApprovalExecution = new WorkflowExecution({
      companyId,
      workflowId: mockApprovalWorkflow._id,
      workflowVersion: 1,
      triggerEvent: 'expense_submitted',
      triggerPayload: { expense_title: 'Client Business Lunch Q2', expense_amount: 450 },
      variables: {
        expense_title: 'Client Business Lunch Q2',
        expense_amount: '450',
        employee_name: userName,
        trigger_event: 'expense_submitted',
      },
      status: 'pending_approval',
      currentNodeId: 'expense_approval',
      stepHistory: [
        {
          actionId: 'expense_approval',
          type: 'approval_request',
          status: 'pending',
        },
      ],
      startedAt: new Date(Date.now() - 1000 * 60 * 30),
    });
    await mockApprovalExecution.save();

    const mockApprovalChain = new ApprovalChain({
      companyId,
      executionId: mockApprovalExecution._id,
      title: 'Expense Reimbursement: Client Business Lunch Q2',
      description: `Reimbursement request submitted by ${userName} for $450.`,
      requestType: 'expense',
      targetResourceId: mockApprovalExecution._id.toString(),
      steps: [
        {
          sequenceOrder: 1,
          approverId: userId,
          approverName: userName,
          status: 'pending',
        },
        {
          sequenceOrder: 2,
          approverId: 'admin_user_placeholder_id',
          approverName: 'VP Operations',
          status: 'pending',
        },
      ],
      currentStepIndex: 0,
      metadata: { workflowId: mockApprovalWorkflow._id },
    });
    await mockApprovalChain.save();

    // 7. Log Seeding event in audit
    const seedAudit = new FinancialActivity({
      companyId,
      userId,
      userName,
      type: 'invoice_created',
      title: 'Automation Sandboxes Loaded',
      description:
        'Default HR onboarding, overdue invoicing, and expense approval templates seeded cleanly.',
      severity: 'info',
      metadata: { seededTemplatesCount: defaultTemplates.length },
    });
    await seedAudit.save();

    return NextResponse.json({
      success: true,
      message: 'Module 12 Automation schemas and workflows seeded cleanly!',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'SEEDING_FAILED', message: error.message },
      { status: 500 }
    );
  }
});
