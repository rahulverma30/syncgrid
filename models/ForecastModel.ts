import mongoose, { Schema, Document } from 'mongoose';

export interface IForecastModel extends Document {
  companyId: mongoose.Types.ObjectId;
  metricName: 'revenue' | 'workload' | 'budget';
  confidenceInterval: number; // e.g. 95 for 95% confidence intervals
  seasonalityFactor: number; // e.g. 12 for monthly seasonal periods
  historicalPointsUsed: number;
  baselineVal: number;
  createdAt: Date;
  updatedAt: Date;
}

const ForecastModelSchema = new Schema<IForecastModel>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    metricName: {
      type: String,
      enum: ['revenue', 'workload', 'budget'],
      required: true,
      index: true,
    },
    confidenceInterval: { type: Number, required: true, default: 95 },
    seasonalityFactor: { type: Number, required: true, default: 12 },
    historicalPointsUsed: { type: Number, required: true, default: 30 },
    baselineVal: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

ForecastModelSchema.index({ companyId: 1, metricName: 1 }, { unique: true });

export const ForecastModel =
  mongoose.models.ForecastModel ||
  mongoose.model<IForecastModel>('ForecastModel', ForecastModelSchema);
