import mongoose, { Schema, Document } from 'mongoose';

export interface IBudget extends Document {
  companyId: mongoose.Types.ObjectId;
  name: string;
  type: 'operational' | 'project' | 'department';
  projectId?: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  spentAmount: number;
  remainingAmount: number;
  startDate: Date;
  endDate: Date;
  alertThreshold: number; // e.g. 80 for 80%
  alertFired: boolean;
  status: 'active' | 'paused' | 'depleted' | 'archived';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['operational', 'project', 'department'],
      required: true,
      index: true,
    },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', index: true },
    amount: { type: Number, required: true, default: 0 },
    currency: { type: String, required: true, default: 'USD' },
    spentAmount: { type: Number, required: true, default: 0 },
    remainingAmount: { type: Number, required: true, default: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    alertThreshold: { type: Number, required: true, default: 80 },
    alertFired: { type: Boolean, required: true, default: false },
    status: {
      type: String,
      enum: ['active', 'paused', 'depleted', 'archived'],
      required: true,
      default: 'active',
      index: true,
    },
    notes: { type: String },
  },
  { timestamps: true }
);

BudgetSchema.index({ companyId: 1, type: 1, status: 1 });

export const Budget = mongoose.models.Budget || mongoose.model<IBudget>('Budget', BudgetSchema);
