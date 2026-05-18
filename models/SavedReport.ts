import mongoose, { Schema, Document } from 'mongoose';

export interface ISavedReport extends Document {
  companyId: mongoose.Types.ObjectId;
  name: string;
  type: 'financial' | 'project' | 'workforce' | 'productivity';
  ownerId: string;
  visibilityScope: 'private' | 'shared' | 'organization';
  filters: Record<string, any>;
  metrics: string[];
  groupBy?: string;
  aggregateType: 'sum' | 'avg' | 'count' | 'max' | 'min';
  chartConfig: {
    chartType: 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'stacked' | 'metric';
    dimensions?: string[];
    legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  };
  scheduleId?: mongoose.Types.ObjectId;
  dashboardWidgetPlacement?: {
    isWidget: boolean;
    positionIndex?: number;
    widthKey?: 'full' | 'half' | 'third';
  };
  createdAt: Date;
  updatedAt: Date;
}

const SavedReportSchema = new Schema<ISavedReport>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['financial', 'project', 'workforce', 'productivity'],
      required: true,
      index: true,
    },
    ownerId: { type: String, required: true, index: true },
    visibilityScope: {
      type: String,
      enum: ['private', 'shared', 'organization'],
      required: true,
      default: 'private',
    },
    filters: { type: Schema.Types.Mixed, default: {} },
    metrics: [{ type: String, required: true }],
    groupBy: { type: String },
    aggregateType: {
      type: String,
      enum: ['sum', 'avg', 'count', 'max', 'min'],
      required: true,
      default: 'sum',
    },
    chartConfig: {
      chartType: {
        type: String,
        enum: ['line', 'bar', 'area', 'pie', 'donut', 'stacked', 'metric'],
        required: true,
        default: 'bar',
      },
      dimensions: [{ type: String }],
      legendPosition: {
        type: String,
        enum: ['top', 'bottom', 'left', 'right'],
        default: 'bottom',
      },
    },
    scheduleId: { type: Schema.Types.ObjectId, ref: 'ReportSchedule' },
    dashboardWidgetPlacement: {
      isWidget: { type: Boolean, default: false },
      positionIndex: { type: Number },
      widthKey: { type: String, enum: ['full', 'half', 'third'], default: 'half' },
    },
  },
  { timestamps: true }
);

SavedReportSchema.index({ companyId: 1, type: 1 });
SavedReportSchema.index({ companyId: 1, ownerId: 1 });

export const SavedReport =
  mongoose.models.SavedReport || mongoose.model<ISavedReport>('SavedReport', SavedReportSchema);
