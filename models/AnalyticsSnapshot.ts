import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalyticsSnapshot extends Document {
  companyId: mongoose.Types.ObjectId;
  snapshotDate: Date;
  revenueTotal: number;
  expenseTotal: number;
  profitMargin: number;
  billableHours: number;
  nonBillableHours: number;
  activeProjects: number;
  completedSprints: number;
  completedTasks: number;
  cycleTimeAverage: number; // in hours
  blockersCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const AnalyticsSnapshotSchema = new Schema<IAnalyticsSnapshot>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    snapshotDate: { type: Date, required: true, index: true },
    revenueTotal: { type: Number, required: true, default: 0 },
    expenseTotal: { type: Number, required: true, default: 0 },
    profitMargin: { type: Number, required: true, default: 0 },
    billableHours: { type: Number, required: true, default: 0 },
    nonBillableHours: { type: Number, required: true, default: 0 },
    activeProjects: { type: Number, required: true, default: 0 },
    completedSprints: { type: Number, required: true, default: 0 },
    completedTasks: { type: Number, required: true, default: 0 },
    cycleTimeAverage: { type: Number, required: true, default: 0 },
    blockersCount: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

AnalyticsSnapshotSchema.index({ companyId: 1, snapshotDate: -1 });

export const AnalyticsSnapshot =
  mongoose.models.AnalyticsSnapshot ||
  mongoose.model<IAnalyticsSnapshot>('AnalyticsSnapshot', AnalyticsSnapshotSchema);
