import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWorkflowLog extends Document {
  companyId: mongoose.Types.ObjectId;
  executionId: mongoose.Types.ObjectId;
  workflowId: mongoose.Types.ObjectId;
  nodeId?: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

const WorkflowLogSchema = new Schema<IWorkflowLog>(
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
    nodeId: { type: String },
    level: {
      type: String,
      enum: ['info', 'warn', 'error', 'success'],
      default: 'info',
      index: true,
    },
    message: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, required: true },
  },
  { timestamps: true }
);

WorkflowLogSchema.index({ companyId: 1, level: 1, createdAt: -1 });

export const WorkflowLog =
  (mongoose.models.WorkflowLog as Model<IWorkflowLog>) ||
  mongoose.model<IWorkflowLog>('WorkflowLog', WorkflowLogSchema);
