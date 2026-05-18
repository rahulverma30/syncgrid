import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWorkflowCondition extends Document {
  companyId: mongoose.Types.ObjectId;
  workflowId: mongoose.Types.ObjectId;
  nodeId: string;
  logicalOperator: 'and' | 'or';
  rules: Array<{
    field: string; // e.g. 'invoice.amount'
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
    value: string;
  }>;
}

const WorkflowConditionSchema = new Schema<IWorkflowCondition>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: 'WorkflowDefinition',
      required: true,
      index: true,
    },
    nodeId: { type: String, required: true },
    logicalOperator: { type: String, enum: ['and', 'or'], default: 'and', required: true },
    rules: [
      {
        field: { type: String, required: true },
        operator: {
          type: String,
          enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'in'],
          required: true,
        },
        value: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

export const WorkflowCondition =
  (mongoose.models.WorkflowCondition as Model<IWorkflowCondition>) ||
  mongoose.model<IWorkflowCondition>('WorkflowCondition', WorkflowConditionSchema);
