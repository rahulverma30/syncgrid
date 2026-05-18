import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAutomationTemplate extends Document {
  name: string;
  description: string;
  category: 'hr' | 'finance' | 'project' | 'operations' | 'general';
  triggerConfig: {
    type: string;
    options?: Record<string, any>;
  };
  actionChain: Array<{
    actionId: string;
    type: string;
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
  isSystem: boolean;
  companyId?: mongoose.Types.ObjectId; // Null means global template
}

const AutomationTemplateSchema = new Schema<IAutomationTemplate>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['hr', 'finance', 'project', 'operations', 'general'],
      required: true,
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
    isSystem: { type: Boolean, default: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', index: true },
  },
  { timestamps: true }
);

export const AutomationTemplate =
  (mongoose.models.AutomationTemplate as Model<IAutomationTemplate>) ||
  mongoose.model<IAutomationTemplate>('AutomationTemplate', AutomationTemplateSchema);
