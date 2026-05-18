import mongoose, { Schema, Document } from 'mongoose';

export interface IExecutiveInsight extends Document {
  companyId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'success';
  category: 'financial' | 'productivity' | 'attrition';
  detectedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExecutiveInsightSchema = new Schema<IExecutiveInsight>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    severity: {
      type: String,
      enum: ['info', 'warning', 'success'],
      required: true,
      default: 'info',
    },
    category: {
      type: String,
      enum: ['financial', 'productivity', 'attrition'],
      required: true,
      default: 'financial',
      index: true,
    },
    detectedAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true }
);

export const ExecutiveInsight =
  mongoose.models.ExecutiveInsight ||
  mongoose.model<IExecutiveInsight>('ExecutiveInsight', ExecutiveInsightSchema);
