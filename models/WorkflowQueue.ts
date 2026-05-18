import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWorkflowQueue extends Document {
  companyId: mongoose.Types.ObjectId;
  executionId: mongoose.Types.ObjectId;
  workflowId: mongoose.Types.ObjectId;
  actionId: string;
  type: string;
  options: Record<string, any>;
  variables: Record<string, any>;
  attempts: number;
  maxAttempts: number;
  status: 'queued' | 'processing' | 'failed' | 'completed';
  scheduledFor: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowQueueSchema = new Schema<IWorkflowQueue>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    executionId: {
      type: Schema.Types.ObjectId,
      ref: 'WorkflowExecution',
      required: true,
      index: true,
    },
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: 'WorkflowDefinition',
      required: true,
      index: true,
    },
    actionId: { type: String, required: true },
    type: { type: String, required: true },
    options: { type: Schema.Types.Mixed, default: {} },
    variables: { type: Schema.Types.Mixed, default: {} },
    attempts: { type: Number, default: 0, required: true },
    maxAttempts: { type: Number, default: 3, required: true },
    status: {
      type: String,
      enum: ['queued', 'processing', 'failed', 'completed'],
      default: 'queued',
      index: true,
    },
    scheduledFor: { type: Date, default: Date.now, required: true, index: true },
    error: { type: String },
  },
  { timestamps: true }
);

WorkflowQueueSchema.index({ status: 1, scheduledFor: 1 });

export const WorkflowQueue =
  (mongoose.models.WorkflowQueue as Model<IWorkflowQueue>) ||
  mongoose.model<IWorkflowQueue>('WorkflowQueue', WorkflowQueueSchema);
