import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IApprovalChain extends Document {
  companyId: mongoose.Types.ObjectId;
  executionId?: mongoose.Types.ObjectId; // Null means standalone approval request
  title: string;
  description: string;
  requestType: 'leave' | 'expense' | 'invoice' | 'purchase_order' | 'general';
  targetResourceId: string; // The ID of the leave/expense/invoice being approved
  status: 'pending' | 'approved' | 'rejected';
  steps: Array<{
    sequenceOrder: number;
    approverId: string; // User ID
    approverName: string;
    status: 'pending' | 'approved' | 'rejected';
    comment?: string;
    decidedAt?: Date;
  }>;
  currentStepIndex: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ApprovalChainSchema = new Schema<IApprovalChain>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    executionId: { type: Schema.Types.ObjectId, ref: 'WorkflowExecution', index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    requestType: {
      type: String,
      enum: ['leave', 'expense', 'invoice', 'purchase_order', 'general'],
      required: true,
      index: true,
    },
    targetResourceId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    steps: [
      {
        sequenceOrder: { type: Number, required: true },
        approverId: { type: String, required: true },
        approverName: { type: String, required: true },
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending',
        },
        comment: { type: String },
        decidedAt: { type: Date },
      },
    ],
    currentStepIndex: { type: Number, default: 0, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

ApprovalChainSchema.index({ companyId: 1, status: 1, createdAt: -1 });

export const ApprovalChain =
  (mongoose.models.ApprovalChain as Model<IApprovalChain>) ||
  mongoose.model<IApprovalChain>('ApprovalChain', ApprovalChainSchema);
