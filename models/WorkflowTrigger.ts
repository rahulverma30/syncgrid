import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWorkflowTrigger extends Document {
  type: string; // e.g. 'task_created', 'invoice_paid'
  title: string;
  description: string;
  category: 'hr' | 'finance' | 'project' | 'operations' | 'general';
  fields: Array<{
    name: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'select';
    options?: string[];
    required: boolean;
  }>;
}

const WorkflowTriggerSchema = new Schema<IWorkflowTrigger>(
  {
    type: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['hr', 'finance', 'project', 'operations', 'general'],
      required: true,
      index: true,
    },
    fields: [
      {
        name: { type: String, required: true },
        label: { type: String, required: true },
        type: {
          type: String,
          enum: ['string', 'number', 'boolean', 'date', 'select'],
          required: true,
        },
        options: [{ type: String }],
        required: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

export const WorkflowTrigger =
  (mongoose.models.WorkflowTrigger as Model<IWorkflowTrigger>) ||
  mongoose.model<IWorkflowTrigger>('WorkflowTrigger', WorkflowTriggerSchema);
