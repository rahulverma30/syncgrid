import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IScheduledJob extends Document {
  companyId: mongoose.Types.ObjectId;
  workflowId: mongoose.Types.ObjectId;
  cronExpression?: string; // e.g. '0 9 * * 1' (Weekly Monday morning)
  intervalMinutes?: number;
  nextRun: Date;
  lastRun?: Date;
  status: 'active' | 'paused' | 'executing';
  timezone: string;
}

const ScheduledJobSchema = new Schema<IScheduledJob>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: 'WorkflowDefinition',
      required: true,
      index: true,
    },
    cronExpression: { type: String },
    intervalMinutes: { type: Number },
    nextRun: { type: Date, required: true, index: true },
    lastRun: { type: Date },
    status: {
      type: String,
      enum: ['active', 'paused', 'executing'],
      default: 'active',
      index: true,
    },
    timezone: { type: String, default: 'UTC', required: true },
  },
  { timestamps: true }
);

ScheduledJobSchema.index({ nextRun: 1, status: 1 });

export const ScheduledJob =
  (mongoose.models.ScheduledJob as Model<IScheduledJob>) ||
  mongoose.model<IScheduledJob>('ScheduledJob', ScheduledJobSchema);
