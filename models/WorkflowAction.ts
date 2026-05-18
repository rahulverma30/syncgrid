import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWorkflowAction extends Document {
  type: string; // e.g. 'create_task', 'send_notification'
  title: string;
  description: string;
  category: 'hr' | 'finance' | 'project' | 'operations' | 'general';
  fields: Array<{
    name: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'select' | 'textarea' | 'object';
    options?: string[];
    required: boolean;
  }>;
}

const WorkflowActionSchema = new Schema<IWorkflowAction>(
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
          enum: ['string', 'number', 'boolean', 'date', 'select', 'textarea', 'object'],
          required: true,
        },
        options: [{ type: String }],
        required: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

export const WorkflowAction =
  (mongoose.models.WorkflowAction as Model<IWorkflowAction>) ||
  mongoose.model<IWorkflowAction>('WorkflowAction', WorkflowActionSchema);
