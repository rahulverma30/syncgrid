import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db/mongodb';
import { WorkflowDefinition } from '@/models/WorkflowDefinition';
import { Client, Project, Deal, Invoice, AttendanceLog, Employee } from '@/models';
import { createNotification } from './notificationService';

/**
 * Triggers configured workflows based on system events.
 *
 * Supported Events:
 * - 'deal_won'
 * - 'project_completed'
 * - 'invoice_overdue'
 * - 'missed_punchout'
 */
export async function executeEvent(eventName: string, companyId: string, payload: any) {
  try {
    await connectToDatabase();

    // Fetch active workflows listening for this event
    const workflows = await WorkflowDefinition.find({
      companyId: new mongoose.Types.ObjectId(companyId),
      status: 'active',
      isArchived: false,
      'triggerConfig.type': eventName,
    });

    if (!workflows || workflows.length === 0) {
      console.log(`[AUTOMATION] No active workflows for event: ${eventName}`);
      return;
    }

    console.log(`[AUTOMATION] Triggering ${workflows.length} workflows for event: ${eventName}`);

    for (const workflow of workflows) {
      // Evaluate conditions (if any)
      let conditionMet = true;
      if (workflow.conditions && workflow.conditions.rules.length > 0) {
        // Simple AND logic for demonstration
        for (const rule of workflow.conditions.rules) {
          const fieldValue = payload[rule.field];
          if (rule.operator === 'equals' && fieldValue !== rule.value) conditionMet = false;
          if (rule.operator === 'not_equals' && fieldValue === rule.value) conditionMet = false;
        }
      }

      if (!conditionMet) {
        console.log(`[AUTOMATION] Workflow ${workflow.name} condition failed, skipping.`);
        continue;
      }

      // Execute action chain
      for (const action of workflow.actionChain) {
        console.log(`[AUTOMATION] Executing action: ${action.type}`);

        switch (action.type) {
          case 'create_client':
            // Logic for deal_won payload
            if (eventName === 'deal_won') {
              const deal = payload as any; // The deal doc
              const newClient = new Client({
                companyId,
                name: deal.name + ' Client',
                status: 'active',
                industry: deal.industry || 'General',
              });
              await newClient.save();
              payload.newClientId = newClient._id; // Add to payload for subsequent actions
            }
            break;

          case 'create_project':
            // Logic for deal_won payload
            if (eventName === 'deal_won') {
              const deal = payload as any;
              const newProject = new Project({
                companyId,
                name: deal.name + ' Project',
                clientId: payload.newClientId || null,
                status: 'planning',
                billingType: 'fixed',
                projectManager: deal.ownerId ? deal.ownerId.toString() : 'System',
                startDate: new Date(),
              });
              await newProject.save();
            }
            break;

          case 'send_notification':
            await createNotification({
              companyId,
              userId: action.options?.targetUserId || payload.userId || payload.ownerId,
              title: action.options?.title || 'Automated Alert',
              description: action.options?.message || 'Workflow triggered.',
              type: 'system',
              priority: action.options?.priority || 'normal',
            });
            break;

          case 'notify_hr':
            if (eventName === 'missed_punchout') {
              const log = payload as any;
              // Find HR user
              const hrUsers = await Employee.find({ companyId, departmentId: null }); // fallback
              if (hrUsers.length > 0) {
                await createNotification({
                  companyId,
                  userId: hrUsers[0]._id.toString(), // Notify first HR
                  title: 'Missed Punch-out',
                  description: `Employee missed punch-out on ${log.date}`,
                  type: 'attendance',
                  priority: 'high',
                });
              }
            }
            break;

          default:
            console.warn(`[AUTOMATION] Unknown action type: ${action.type}`);
            break;
        }
      }
    }
  } catch (error) {
    console.error(`[AUTOMATION] Error executing event ${eventName}:`, error);
  }
}
