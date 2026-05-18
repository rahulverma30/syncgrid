import mongoose, { Schema, Document } from 'mongoose';

export interface IReportSchedule extends Document {
  companyId: mongoose.Types.ObjectId;
  reportId: mongoose.Types.ObjectId;
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  active: boolean;
  lastRun?: Date;
  nextRun: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportScheduleSchema = new Schema<IReportSchedule>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    reportId: { type: Schema.Types.ObjectId, ref: 'SavedReport', required: true },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true,
      default: 'weekly',
    },
    recipients: [{ type: String, required: true }],
    active: { type: Boolean, required: true, default: true, index: true },
    lastRun: { type: Date },
    nextRun: { type: Date, required: true },
  },
  { timestamps: true }
);

ReportScheduleSchema.index({ companyId: 1, active: 1, nextRun: 1 });

export const ReportSchedule =
  mongoose.models.ReportSchedule ||
  mongoose.model<IReportSchedule>('ReportSchedule', ReportScheduleSchema);
