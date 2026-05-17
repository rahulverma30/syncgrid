import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const AutomationActionSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['assign_user', 'change_status', 'escalate_priority', 'send_notification'],
      required: true,
    },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User' },
    statusId: { type: Schema.Types.ObjectId, ref: 'TaskStatus' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'] },
    emailTemplate: { type: String },
  },
  { _id: false }
);

const TaskAutomationRuleSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    trigger: {
      type: {
        type: String,
        enum: ['on_status_change', 'on_priority_change', 'on_creation', 'on_overdue'],
        required: true,
      },
      statusId: { type: Schema.Types.ObjectId, ref: 'TaskStatus' },
      priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'] },
    },
    actions: [AutomationActionSchema],
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

TaskAutomationRuleSchema.index({ companyId: 1, active: 1 });

export const TaskAutomationRule = ((mongoose.models.TaskAutomationRule as Model<any>) ||
  mongoose.model('TaskAutomationRule', TaskAutomationRuleSchema)) as Model<any>;
