import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWorkflowDefinition extends Document {
  companyId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  category: 'hr' | 'finance' | 'project' | 'operations' | 'general';
  triggerConfig: {
    type: string; // 'task_created' | 'task_completed' | 'invoice_overdue' | 'invoice_paid' | 'leave_submitted' | 'onboarded' | 'project_status' | 'kpi_breached' | 'cron'
    options?: Record<string, any>;
  };
  actionChain: Array<{
    actionId: string;
    type: string; // 'create_task' | 'assign_task' | 'send_notification' | 'send_email' | 'approval_request' | 'update_stage' | 'escalate' | 'chain_workflow'
    options?: Record<string, any>;
  }>;
  conditions?: {
    logicalOperator: 'and' | 'or';
    rules: Array<{
      field: string;
      operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
      value: any;
    }>;
  };
  version: number;
  status: 'draft' | 'active' | 'paused';
  isArchived: boolean;
  ownerId: string;
  retryPolicy?: {
    maxAttempts: number;
    delaySeconds: number;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowDefinitionSchema = new Schema<IWorkflowDefinition>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    category: {
      type: String,
      enum: ['hr', 'finance', 'project', 'operations', 'general'],
      default: 'general',
      index: true,
    },
    triggerConfig: {
      type: { type: String, required: true },
      options: { type: Schema.Types.Mixed, default: {} },
    },
    actionChain: [
      {
        actionId: { type: String, required: true },
        type: { type: String, required: true },
        options: { type: Schema.Types.Mixed, default: {} },
      },
    ],
    conditions: {
      logicalOperator: { type: String, enum: ['and', 'or'], default: 'and' },
      rules: [
        {
          field: { type: String, required: true },
          operator: {
            type: String,
            enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'in'],
            required: true,
          },
          value: { type: Schema.Types.Mixed },
        },
      ],
    },
    version: { type: Number, default: 1, required: true },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused'],
      default: 'draft',
      index: true,
    },
    isArchived: { type: Boolean, default: false, index: true },
    ownerId: { type: String, required: true },
    retryPolicy: {
      maxAttempts: { type: Number, default: 3 },
      delaySeconds: { type: Number, default: 60 },
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

WorkflowDefinitionSchema.index({ companyId: 1, isArchived: 1, status: 1 });

export const WorkflowDefinition =
  (mongoose.models.WorkflowDefinition as Model<IWorkflowDefinition>) ||
  mongoose.model<IWorkflowDefinition>('WorkflowDefinition', WorkflowDefinitionSchema);
