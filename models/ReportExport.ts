import mongoose, { Schema, Document } from 'mongoose';

export interface IReportExport extends Document {
  companyId: mongoose.Types.ObjectId;
  reportId?: mongoose.Types.ObjectId;
  userId: string;
  userName: string;
  format: 'csv' | 'xlsx' | 'pdf';
  url: string;
  rowSize: number;
  generationTimeMs: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportExportSchema = new Schema<IReportExport>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    reportId: { type: Schema.Types.ObjectId, ref: 'SavedReport' },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    format: {
      type: String,
      enum: ['csv', 'xlsx', 'pdf'],
      required: true,
      default: 'csv',
    },
    url: { type: String, required: true },
    rowSize: { type: Number, required: true, default: 0 },
    generationTimeMs: { type: Number, required: true, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

ReportExportSchema.index({ companyId: 1, userId: 1 });
ReportExportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto purge expired exports using MongoDB TTL index!

export const ReportExport =
  mongoose.models.ReportExport || mongoose.model<IReportExport>('ReportExport', ReportExportSchema);
