import mongoose, { Schema, Document } from 'mongoose';

export interface IDashboardWidgetPosition {
  widgetId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  isCollapsed?: boolean;
}

export interface IDashboardLayout extends Document {
  companyId: mongoose.Types.ObjectId;
  userId: string;
  name: string;
  isDefault: boolean;
  widgets: IDashboardWidgetPosition[];
  createdAt: Date;
  updatedAt: Date;
}

const DashboardWidgetPositionSchema = new Schema<IDashboardWidgetPosition>({
  widgetId: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  w: { type: Number, required: true },
  h: { type: Number, required: true },
  isCollapsed: { type: Boolean, default: false },
});

const DashboardLayoutSchema = new Schema<IDashboardLayout>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, default: 'Default Layout' },
    isDefault: { type: Boolean, default: true },
    widgets: [DashboardWidgetPositionSchema],
  },
  { timestamps: true }
);

DashboardLayoutSchema.index({ companyId: 1, userId: 1, isDefault: 1 });

export const DashboardLayout =
  mongoose.models.DashboardLayout ||
  mongoose.model<IDashboardLayout>('DashboardLayout', DashboardLayoutSchema);
