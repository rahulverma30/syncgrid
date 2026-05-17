import mongoose from 'mongoose';
import { Task, TaskActivity } from '@/models';

/**
 * Idempotent Recurrence Processor
 * Scans active task recurrence rules and duplicate clones due tasks safely.
 */
export async function processRecurringTasks() {
  const now = new Date();

  // Find all active templates due for generation
  const tasksDue = await Task.find({
    'recurrenceRules.active': true,
    'recurrenceRules.nextRunDate': { $lte: now },
    isSoftDeleted: false,
    isArchived: false,
  });

  console.log(`[Recurrence Queue] Found ${tasksDue.length} tasks due for execution.`);

  const stats = {
    processed: 0,
    cloned: 0,
    errors: 0,
  };

  for (const template of tasksDue) {
    stats.processed++;
    const nextRun = new Date(template.recurrenceRules.nextRunDate);

    // Formulate a daily idempotent deduplication key (Format: TEMPLATE_ID-YYYY-MM-DD)
    const year = nextRun.getFullYear();
    const month = String(nextRun.getMonth() + 1).padStart(2, '0');
    const day = String(nextRun.getDate()).padStart(2, '0');
    const dedupKey = `recurrence-${template._id}-${year}-${month}-${day}`;

    try {
      // Check if a task has already been generated using this deduplication token
      const alreadyCloned = await Task.findOne({
        companyId: template.companyId,
        'automationMetadata.dedupKey': dedupKey,
      });

      if (alreadyCloned) {
        console.log(
          `[Recurrence Queue] Idempotency safeguard triggered. Task already cloned for key: ${dedupKey}`
        );

        // Advance nextRunDate on template task to prevent perpetual loops
        template.recurrenceRules.nextRunDate = calculateNextRunDate(
          template.recurrenceRules.nextRunDate,
          template.recurrenceRules.frequency,
          template.recurrenceRules.interval
        );
        await template.save();
        continue;
      }

      // Clone task data structure excluding unique IDs and logs
      const clonedData = {
        companyId: template.companyId,
        title: `${template.title} (Auto-Generated)`,
        description: template.description,
        projectId: template.projectId,
        sprintId: template.sprintId || null,
        milestoneId: template.milestoneId || null,
        parentId: template.parentId || null,
        assignees: template.assignees || [],
        watchers: template.watchers || [],
        statusId: template.statusId,
        priority: template.priority || 'medium',
        severity: template.severity || 'medium',
        storyPoints: template.storyPoints || 0,
        estimatedHours: template.estimatedHours || 0,
        dueDate: template.dueDate
          ? calculateOffsetDate(now, template.dueDate, template.createdAt)
          : null,
        checklistItems: (template.checklistItems || []).map((c: any) => ({
          title: c.title,
          isCompleted: false,
        })),
        automationMetadata: {
          dedupKey,
          generatedFromTemplateId: template._id,
        },
      };

      const clonedTask = new Task(clonedData);
      await clonedTask.save();

      // Log recurrence execution audit history
      const activity = new TaskActivity({
        companyId: template.companyId,
        taskId: clonedTask._id,
        type: 'created',
        title: 'Recurrence Rule Fired',
        description: `Task auto-generated from template "${template.title}" (Code: ${template.code}).`,
        metadata: { templateTaskId: template._id },
      });
      await activity.save();

      // Advance schedule on original template task
      template.recurrenceRules.nextRunDate = calculateNextRunDate(
        template.recurrenceRules.nextRunDate,
        template.recurrenceRules.frequency,
        template.recurrenceRules.interval
      );
      await template.save();

      stats.cloned++;
      console.log(
        `[Recurrence Queue] Successfully generated task: ${clonedTask.code} for key ${dedupKey}`
      );
    } catch (err: any) {
      stats.errors++;
      console.error(`[Recurrence Queue] Error processing template: ${template._id}`, err);
    }
  }

  return stats;
}

/**
 * Calculate future next execution date threshold
 */
function calculateNextRunDate(current: Date, frequency: string, interval: number): Date {
  const next = new Date(current);
  const offset = interval || 1;

  if (frequency === 'daily') {
    next.setDate(next.getDate() + offset);
  } else if (frequency === 'weekly') {
    next.setDate(next.getDate() + offset * 7);
  } else if (frequency === 'monthly') {
    next.setMonth(next.getMonth() + offset);
  } else {
    // Fail-safe default: advance by 1 day to prevent loops
    next.setDate(next.getDate() + 1);
  }

  return next;
}

/**
 * Recalculate dynamic due dates keeping exact day-span offset ratios
 */
function calculateOffsetDate(now: Date, originalDue: Date, templateCreated: Date): Date {
  const span = new Date(originalDue).getTime() - new Date(templateCreated).getTime();
  return new Date(now.getTime() + (span > 0 ? span : 1000 * 60 * 60 * 24 * 7)); // Default 7 days offset if span is negative
}
