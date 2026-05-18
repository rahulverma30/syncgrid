import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAutomationVariable extends Document {
  companyId: mongoose.Types.ObjectId;
  key: string; // e.g. 'SENDER_EMAIL', 'MAX_LEAVE_BUDGET'
  value: string;
  isSecret: boolean; // If true, encrypt or mask in UI
  description?: string;
}

const AutomationVariableSchema = new Schema<IAutomationVariable>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    key: { type: String, required: true, index: true },
    value: { type: String, required: true },
    isSecret: { type: Boolean, default: false, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

AutomationVariableSchema.index({ companyId: 1, key: 1 }, { unique: true });

export const AutomationVariable =
  (mongoose.models.AutomationVariable as Model<IAutomationVariable>) ||
  mongoose.model<IAutomationVariable>('AutomationVariable', AutomationVariableSchema);
