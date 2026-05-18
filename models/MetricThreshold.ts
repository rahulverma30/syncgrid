import mongoose, { Schema, Document } from 'mongoose';

export interface IMetricThreshold extends Document {
  companyId: mongoose.Types.ObjectId;
  metricName: string;
  boundaryCondition: 'above' | 'below' | 'percent_drop';
  thresholdVal: number;
  triggerType: 'email' | 'notification' | 'event';
  createdAt: Date;
  updatedAt: Date;
}

const MetricThresholdSchema = new Schema<IMetricThreshold>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    metricName: { type: String, required: true, index: true },
    boundaryCondition: {
      type: String,
      enum: ['above', 'below', 'percent_drop'],
      required: true,
      default: 'percent_drop',
    },
    thresholdVal: { type: Number, required: true },
    triggerType: {
      type: String,
      enum: ['email', 'notification', 'event'],
      required: true,
      default: 'notification',
    },
  },
  { timestamps: true }
);

export const MetricThreshold =
  mongoose.models.MetricThreshold ||
  mongoose.model<IMetricThreshold>('MetricThreshold', MetricThresholdSchema);
