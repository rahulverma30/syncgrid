import mongoose, { Schema, Document } from 'mongoose';

export interface IFinancialActivity extends Document {
  companyId: mongoose.Types.ObjectId;
  userId: string;
  userName: string;
  type:
    | 'invoice_created'
    | 'invoice_sent'
    | 'invoice_voided'
    | 'payment_received'
    | 'refund_issued'
    | 'expense_approved'
    | 'budget_threshold_crossed'
    | 'vendor_created'
    | 'po_approved';
  title: string;
  description: string;
  metadata: Record<string, any>;
  severity: 'info' | 'warning' | 'critical';
  createdAt: Date;
  updatedAt: Date;
}

const FinancialActivitySchema = new Schema<IFinancialActivity>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'invoice_created',
        'invoice_sent',
        'invoice_voided',
        'payment_received',
        'refund_issued',
        'expense_approved',
        'budget_threshold_crossed',
        'vendor_created',
        'po_approved',
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Map, of: Schema.Types.Mixed, default: {} },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      required: true,
      default: 'info',
    },
  },
  { timestamps: true }
);

export const FinancialActivity =
  mongoose.models.FinancialActivity ||
  mongoose.model<IFinancialActivity>('FinancialActivity', FinancialActivitySchema);
