import mongoose, { Schema, Document } from 'mongoose';

export interface IWidgetConfiguration extends Document {
  companyId: mongoose.Types.ObjectId;
  title: string;
  type: 'metric_card' | 'line_graph' | 'bar_chart' | 'donut_split';
  dataSource: 'financials' | 'hr' | 'tasks' | 'speed';
  refreshIntervalSeconds: number;
  createdAt: Date;
  updatedAt: Date;
}

const WidgetConfigurationSchema = new Schema<IWidgetConfiguration>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ['metric_card', 'line_graph', 'bar_chart', 'donut_split'],
      required: true,
      default: 'metric_card',
    },
    dataSource: {
      type: String,
      enum: ['financials', 'hr', 'tasks', 'speed'],
      required: true,
      default: 'financials',
    },
    refreshIntervalSeconds: { type: Number, required: true, default: 300 },
  },
  { timestamps: true }
);

export const WidgetConfiguration =
  mongoose.models.WidgetConfiguration ||
  mongoose.model<IWidgetConfiguration>('WidgetConfiguration', WidgetConfigurationSchema);
