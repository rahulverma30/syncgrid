import mongoose, { Schema, Document } from 'mongoose';

export interface IKPIConfiguration extends Document {
  companyId: mongoose.Types.ObjectId;
  metricName:
    | 'project_profitability'
    | 'employee_utilization'
    | 'revenue_growth'
    | 'overdue_invoice_ratio'
    | 'sprint_completion_rate'
    | 'attendance_consistency';
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: 'currency' | 'percent' | 'count' | 'ratio';
  warningThreshold: number; // e.g. 80 for 80% target completion warning
  criticalThreshold: number; // e.g. 50 for 50% target completion warning
  scoringWeight: number; // relative weight in score calculations
  status: 'on_track' | 'warning' | 'critical';
  alertFired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const KPIConfigurationSchema = new Schema<IKPIConfiguration>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    metricName: {
      type: String,
      enum: [
        'project_profitability',
        'employee_utilization',
        'revenue_growth',
        'overdue_invoice_ratio',
        'sprint_completion_rate',
        'attendance_consistency',
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    targetValue: { type: Number, required: true, default: 0 },
    currentValue: { type: Number, required: true, default: 0 },
    unit: {
      type: String,
      enum: ['currency', 'percent', 'count', 'ratio'],
      required: true,
      default: 'percent',
    },
    warningThreshold: { type: Number, required: true, default: 80 },
    criticalThreshold: { type: Number, required: true, default: 50 },
    scoringWeight: { type: Number, required: true, default: 1 },
    status: {
      type: String,
      enum: ['on_track', 'warning', 'critical'],
      required: true,
      default: 'on_track',
      index: true,
    },
    alertFired: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

KPIConfigurationSchema.index({ companyId: 1, metricName: 1 }, { unique: true });

export const KPIConfiguration =
  mongoose.models.KPIConfiguration ||
  mongoose.model<IKPIConfiguration>('KPIConfiguration', KPIConfigurationSchema);
