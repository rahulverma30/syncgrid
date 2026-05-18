import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWorkflowExecution extends Document {
  companyId: mongoose.Types.ObjectId;
  workflowId: mongoose.Types.ObjectId;
  workflowVersion: number;
  triggerEvent: string;
  triggerPayload: Record<string, any>;
  variables: Record<string, any>;
  status: 'running' | 'completed' | 'failed' | 'pending_approval' | 'cancelled';
  currentNodeId?: string;
  stepHistory: Array<{
    actionId: string;
    type: string;
    status: 'pending' | 'success' | 'failed' | 'skipped';
    executedAt?: Date;
    durationMs?: number;
    error?: string;
    retryCount?: number;
  }>;
  errorLog?: {
    message: string;
    nodeId?: string;
    stack?: string;
  };
  startedAt: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowExecutionSchema = new Schema<IWorkflowExecution>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: 'WorkflowDefinition',
      required: true,
      index: true,
    },
    workflowVersion: { type: Number, required: true },
    triggerEvent: { type: String, required: true, index: true },
    triggerPayload: { type: Schema.Types.Mixed, default: {} },
    variables: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ['running', 'completed', 'failed', 'pending_approval', 'cancelled'],
      default: 'running',
      index: true,
    },
    currentNodeId: { type: String },
    stepHistory: [
      {
        actionId: { type: String, required: true },
        type: { type: String, required: true },
        status: {
          type: String,
          enum: ['pending', 'success', 'failed', 'skipped'],
          default: 'pending',
        },
        executedAt: { type: Date },
        durationMs: { type: Number },
        error: { type: String },
        retryCount: { type: Number, default: 0 },
      },
    ],
    errorLog: {
      message: { type: String },
      nodeId: { type: String },
      stack: { type: String },
    },
    startedAt: { type: Date, default: Date.now, required: true },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

WorkflowExecutionSchema.index({ companyId: 1, status: 1, createdAt: -1 });

export const WorkflowExecution =
  (mongoose.models.WorkflowExecution as Model<IWorkflowExecution>) ||
  mongoose.model<IWorkflowExecution>('WorkflowExecution', WorkflowExecutionSchema);
