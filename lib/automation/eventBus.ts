import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db/mongodb';
import { WorkflowDefinition, WorkflowExecution, WorkflowLog, EventSubscription } from '@/models';
import { executeWorkflow } from './executionEngine';
import { broadcastEvent } from '@/lib/realtime';

/**
 * Enterprise Automation Event Bus
 * Dispatches system events, checks active multi-tenant subscriptions, and triggers workflows.
 */
export async function emitEvent(
  companyId: string,
  eventName: string,
  payload: Record<string, any>
) {
  try {
    await connectToDatabase();
    console.log(`[EventBus] Emitting event: "${eventName}" for company: ${companyId}`);

    // 1. Fetch active workflows triggering on this event
    const activeWorkflows = await WorkflowDefinition.find({
      companyId,
      'triggerConfig.type': eventName,
      status: 'active',
      isArchived: false,
    });

    if (activeWorkflows.length === 0) {
      console.log(`[EventBus] No active workflows found matching trigger: "${eventName}"`);
      return;
    }

    // 2. Loop through and execute each matching workflow
    for (const workflow of activeWorkflows) {
      // Evaluate trigger configuration conditions
      const matchesConditions = evaluateConditions(workflow.conditions, payload);
      if (!matchesConditions) {
        console.log(`[EventBus] Workflow "${workflow.name}" skipped (conditions mismatch)`);
        continue;
      }

      // Compile runtime variables context
      const variables = resolveContextVariables(payload, eventName);

      // Create a persistent execution record
      const execution = new WorkflowExecution({
        companyId: new mongoose.Types.ObjectId(companyId),
        workflowId: workflow._id,
        workflowVersion: workflow.version,
        triggerEvent: eventName,
        triggerPayload: payload,
        variables,
        status: 'running',
        stepHistory: workflow.actionChain.map((act) => ({
          actionId: act.actionId,
          type: act.type,
          status: 'pending',
        })),
        startedAt: new Date(),
      });

      await execution.save();

      // Log startup event
      const startLog = new WorkflowLog({
        companyId: new mongoose.Types.ObjectId(companyId),
        executionId: execution._id,
        workflowId: workflow._id,
        level: 'info',
        message: `Workflow "${workflow.name}" (v${workflow.version}) triggered by event "${eventName}".`,
        metadata: { triggerPayload: payload },
      });
      await startLog.save();

      // Realtime Broadcast execution telemetry pulse
      broadcastEvent({
        companyId,
        event: 'workflow_execution_started',
        payload: {
          executionId: execution._id,
          workflowId: workflow._id,
          workflowName: workflow.name,
          triggerEvent: eventName,
          status: 'running',
          startedAt: execution.startedAt,
        },
      });

      // Async/non-blocking workflow execution trigger
      executeWorkflow(execution._id.toString()).catch((err) => {
        console.error(`[EventBus] Async execution error for workflow ${workflow._id}:`, err);
      });
    }
  } catch (error: any) {
    console.error(`[EventBus] Failed to emit event "${eventName}":`, error);
  }
}

/**
 * Rules Evaluator matching logical parameters and operator bounds
 */
export function evaluateConditions(conditions: any, payload: Record<string, any>): boolean {
  if (!conditions || !conditions.rules || conditions.rules.length === 0) {
    return true; // No conditions means automatically matches
  }

  const { logicalOperator, rules } = conditions;

  const results = rules.map((rule: any) => {
    const payloadValue = getNestedValue(payload, rule.field);

    if (payloadValue === undefined || payloadValue === null) {
      return rule.operator === 'not_equals';
    }

    const ruleValue = rule.value;

    switch (rule.operator) {
      case 'equals':
        return String(payloadValue).toLowerCase() === String(ruleValue).toLowerCase();
      case 'not_equals':
        return String(payloadValue).toLowerCase() !== String(ruleValue).toLowerCase();
      case 'greater_than':
        return Number(payloadValue) > Number(ruleValue);
      case 'less_than':
        return Number(payloadValue) < Number(ruleValue);
      case 'contains':
        return String(payloadValue).toLowerCase().includes(String(ruleValue).toLowerCase());
      case 'in':
        const arr = Array.isArray(ruleValue)
          ? ruleValue
          : String(ruleValue)
              .split(',')
              .map((x) => x.trim());
        return arr.some((val) => String(val).toLowerCase() === String(payloadValue).toLowerCase());
      default:
        return false;
    }
  });

  if (logicalOperator === 'or') {
    return results.some((r: boolean) => r === true);
  }

  return results.every((r: boolean) => r === true);
}

/**
 * Dynamic resolution of dynamic context values
 */
function resolveContextVariables(
  payload: Record<string, any>,
  eventName: string
): Record<string, any> {
  const vars: Record<string, any> = {
    trigger_event: eventName,
    execution_time: new Date().toISOString(),
  };

  // Automatically flatten payload references for easy visual selector token parsing
  function flatten(obj: any, prefix = '') {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach((key) => {
      const val = obj[key];
      const flatKey = prefix ? `${prefix}.${key}` : key;
      if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        flatten(val, flatKey);
      } else {
        vars[flatKey] = val;
      }
    });
  }

  flatten(payload);
  return vars;
}

/**
 * Read dot-notation nested object keys
 */
export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => {
    return acc && acc[part] !== undefined ? acc[part] : undefined;
  }, obj);
}
