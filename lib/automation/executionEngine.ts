import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db/mongodb';
import {
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowLog,
  ApprovalChain,
  Task,
  Invoice,
  LeaveRequest,
  Project,
  FinancialActivity,
} from '@/models';
import { broadcastEvent } from '@/lib/realtime';

/**
 * Enterprise Actions Execution & Orchestration Engine
 * Resumes or runs workflow actions chain, resolving dynamic variable placeholders,
 * and coordinating sequential approval halts.
 */
export async function executeWorkflow(executionId: string) {
  try {
    await connectToDatabase();
    console.log(`[ExecutionEngine] Starting processing for execution: ${executionId}`);

    // 1. Fetch execution trace
    const execution = await WorkflowExecution.findById(executionId);
    if (!execution) {
      console.error(`[ExecutionEngine] Execution trace ${executionId} not found.`);
      return;
    }

    if (execution.status === 'completed' || execution.status === 'failed') {
      console.log(
        `[ExecutionEngine] Execution ${executionId} already finalized in state: ${execution.status}`
      );
      return;
    }

    // 2. Fetch definition rule configuration
    const workflow = await WorkflowDefinition.findById(execution.workflowId);
    if (!workflow) {
      execution.status = 'failed';
      execution.errorLog = {
        message: 'Parent workflow definition was deleted or not found.',
      };
      await execution.save();
      return;
    }

    // 3. Process actions sequentially
    const chain = workflow.actionChain;
    execution.status = 'running';
    await execution.save();

    for (let i = 0; i < chain.length; i++) {
      const action = chain[i];

      // Check if this action index was already processed successfully
      const stepIndex = execution.stepHistory.findIndex((s) => s.actionId === action.actionId);

      const stepHistoryItem = execution.stepHistory[stepIndex];
      if (stepHistoryItem && stepHistoryItem.status === 'success') {
        continue;
      }

      console.log(
        `[ExecutionEngine] Executing step [${action.type}] for workflow: ${workflow.name}`
      );
      execution.currentNodeId = action.actionId;
      await execution.save();

      const startTime = Date.now();

      try {
        // Resolve dynamic variables in options config
        const resolvedOptions = interpolateVariables(action.options || {}, execution.variables);

        // Execute action type
        const actionResult = await runActionHandler(
          execution.companyId.toString(),
          action.type,
          resolvedOptions,
          execution
        );

        // Record positive trace in step history
        execution.stepHistory[stepIndex].status = 'success';
        execution.stepHistory[stepIndex].executedAt = new Date();
        execution.stepHistory[stepIndex].durationMs = Date.now() - startTime;
        await execution.save();

        // Write audit log
        const stepLog = new WorkflowLog({
          companyId: execution.companyId,
          executionId: execution._id,
          workflowId: workflow._id,
          nodeId: action.actionId,
          level: 'success',
          message: `Step "${action.type}" executed successfully.`,
          metadata: { result: actionResult },
        });
        await stepLog.save();

        // Realtime broadcast step update
        broadcastEvent({
          companyId: execution.companyId.toString(),
          event: 'workflow_step_completed',
          payload: {
            executionId: execution._id,
            actionId: action.actionId,
            type: action.type,
            status: 'success',
          },
        });

        // Halt execution if action requested approval suspension
        if (actionResult && actionResult.halted === true) {
          execution.status = 'pending_approval';
          await execution.save();

          console.log(
            `[ExecutionEngine] Workflow execution halted pending approval: ${executionId}`
          );
          return; // Stop loop, will be resumed by approval resolution API
        }
      } catch (err: any) {
        console.error(`[ExecutionEngine] Step failed: ${action.type}`, err);

        // Retry policy calculations
        const maxAttempts = workflow.retryPolicy?.maxAttempts || 3;
        const currentRetry = stepHistoryItem.retryCount || 0;

        if (currentRetry < maxAttempts) {
          execution.stepHistory[stepIndex].retryCount = currentRetry + 1;
          execution.stepHistory[stepIndex].status = 'pending'; // retry again
          await execution.save();

          const retryLog = new WorkflowLog({
            companyId: execution.companyId,
            executionId: execution._id,
            workflowId: workflow._id,
            nodeId: action.actionId,
            level: 'warn',
            message: `Step "${action.type}" failed. Retrying (Attempt ${currentRetry + 1}/${maxAttempts}). Error: ${err.message}`,
          });
          await retryLog.save();

          // Wait and retry execution loop
          setTimeout(
            () => {
              executeWorkflow(executionId).catch(console.error);
            },
            (workflow.retryPolicy?.delaySeconds || 5) * 1000
          );

          return; // Wait for retry schedule trigger
        }

        // Final step failure
        execution.stepHistory[stepIndex].status = 'failed';
        execution.stepHistory[stepIndex].error = err.message;
        execution.status = 'failed';
        execution.errorLog = {
          message: err.message,
          nodeId: action.actionId,
          stack: err.stack,
        };
        execution.endedAt = new Date();
        await execution.save();

        const failureLog = new WorkflowLog({
          companyId: execution.companyId,
          executionId: execution._id,
          workflowId: workflow._id,
          nodeId: action.actionId,
          level: 'error',
          message: `Step "${action.type}" failed permanently. Workflow halted. Error: ${err.message}`,
        });
        await failureLog.save();

        broadcastEvent({
          companyId: execution.companyId.toString(),
          event: 'workflow_execution_failed',
          payload: {
            executionId: execution._id,
            workflowId: workflow._id,
            error: err.message,
            endedAt: execution.endedAt,
          },
        });

        return; // Halt chain
      }
    }

    // 4. Finalize completed executions
    execution.status = 'completed';
    execution.endedAt = new Date();
    await execution.save();

    const completeLog = new WorkflowLog({
      companyId: execution.companyId,
      executionId: execution._id,
      workflowId: workflow._id,
      level: 'success',
      message: `Workflow "${workflow.name}" completed successfully in ${
        execution.endedAt.getTime() - execution.startedAt.getTime()
      }ms.`,
    });
    await completeLog.save();

    broadcastEvent({
      companyId: execution.companyId.toString(),
      event: 'workflow_execution_completed',
      payload: {
        executionId: execution._id,
        workflowId: workflow._id,
        status: 'completed',
        endedAt: execution.endedAt,
      },
    });
  } catch (error: any) {
    console.error(`[ExecutionEngine] Fatal orchestration queue failure:`, error);
  }
}

/**
 * Registry of dynamic action runners
 */
async function runActionHandler(
  companyId: string,
  type: string,
  options: Record<string, any>,
  execution: any
): Promise<any> {
  const compId = new mongoose.Types.ObjectId(companyId);

  switch (type) {
    case 'create_task':
      const task = new Task({
        companyId: compId,
        title: options.title || 'Automated Action Task',
        description: options.description || 'Dispatched by SyncGrid Automation Engine',
        status: options.status || 'todo',
        priority: options.priority || 'medium',
        dueDate: options.dueDate ? new Date(options.dueDate) : undefined,
        assignedTo: options.assignedTo
          ? new mongoose.Types.ObjectId(options.assignedTo)
          : undefined,
      });
      await task.save();

      // Push created task ID into variables stack for downstream reference!
      execution.variables[`task_id`] = task._id.toString();
      execution.variables[`task_title`] = task.title;
      return { taskId: task._id, title: task.title };

    case 'assign_task':
      if (options.taskId) {
        await Task.updateOne(
          { _id: new mongoose.Types.ObjectId(options.taskId), companyId: compId },
          { assignedTo: new mongoose.Types.ObjectId(options.assigneeId) }
        );
        return { success: true, message: `Task assigned to resource.` };
      }
      throw new Error('Task ID missing in options.');

    case 'send_notification':
      // Emulate notification infrastructure trigger
      broadcastEvent({
        companyId,
        event: 'alert_notification',
        payload: {
          title: options.title || 'System Notification',
          message: options.message || 'Triggered operations alert.',
          type: options.type || 'info',
        },
      });
      return { success: true, message: 'Real-time alert notification broadcasted.' };

    case 'send_email':
      // Log an email dispatch placeholder in WorkflowLog
      console.log(
        `[Email Dispatcher] Sending placeholder email to: ${options.to}. Subject: ${options.subject}`
      );
      return { success: true, dispatchedTo: options.to };

    case 'approval_request':
      // Configure an approval request chain
      const approval = new ApprovalChain({
        companyId: compId,
        executionId: execution._id,
        title: options.title || 'Approval Required',
        description: options.description || 'Process requires senior review to proceed.',
        requestType: options.requestType || 'general',
        targetResourceId: options.targetResourceId || execution._id.toString(),
        steps: (options.approvers || []).map((app: any, idx: number) => ({
          sequenceOrder: idx + 1,
          approverId: app.id,
          approverName: app.name,
          status: 'pending',
        })),
        currentStepIndex: 0,
      });
      await approval.save();

      // Push approval details downstream
      execution.variables[`approval_id`] = approval._id.toString();
      execution.variables[`approval_title`] = approval.title;

      return { halted: true, approvalChainId: approval._id }; // Request execution halt

    case 'update_stage':
      if (options.projectId) {
        await Project.updateOne(
          { _id: new mongoose.Types.ObjectId(options.projectId), companyId: compId },
          { stage: options.stage || 'in_progress' }
        );
        return { success: true, stage: options.stage };
      }
      throw new Error('Project ID parameter missing.');

    case 'create_finance_entry':
      const audit = new FinancialActivity({
        companyId: compId,
        userId: execution.variables.userId || 'system_agent',
        userName: execution.variables.userName || 'SyncGrid Automation Engine',
        type: 'invoice_created',
        title: options.title || 'Automated Ledger Creation',
        description:
          options.description || 'Calculated transaction generated by trigger pipelines.',
        severity: 'info',
        metadata: { amount: options.amount || 0 },
      });
      await audit.save();
      return { success: true, activityId: audit._id };

    case 'escalate':
      broadcastEvent({
        companyId,
        event: 'escalation_alert',
        payload: {
          title: `CRITICAL ESCALATION: ${options.title}`,
          message: options.message || 'Immediate response requested.',
          severity: 'high',
        },
      });
      return { escalated: true };

    default:
      throw new Error(`Unsupported action handler type: "${type}"`);
  }
}

/**
 * Replace double-curly bracket placeholders with execution variables context
 */
export function interpolateVariables(options: any, variables: Record<string, any>): any {
  if (typeof options === 'string') {
    return options.replace(/{{\s*([\w.]+)\s*}}/g, (_, key) => {
      return variables[key] !== undefined ? String(variables[key]) : `{{${key}}}`;
    });
  }

  if (Array.isArray(options)) {
    return options.map((item) => interpolateVariables(item, variables));
  }

  if (options && typeof options === 'object') {
    const res: Record<string, any> = {};
    Object.keys(options).forEach((key) => {
      res[key] = interpolateVariables(options[key], variables);
    });
    return res;
  }

  return options;
}
