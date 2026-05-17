import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  companyId: mongoose.Types.ObjectId;
  transactionNumber: string;
  invoiceId?: mongoose.Types.ObjectId;
  clientId?: mongoose.Types.ObjectId;
  paymentMethod: 'bank_transfer' | 'stripe' | 'razorpay' | 'paypal' | 'upi' | 'cash' | 'manual';
  type: 'income' | 'expense' | 'refund' | 'adjustment';
  currency: string;
  exchangeRate: number;
  amount: number;
  status: 'pending' | 'cleared' | 'failed' | 'refunded';
  referenceNumber?: string;
  paymentDate: Date;
  reconciliationMetadata: {
    reconciled: boolean;
    reconciledAt?: Date;
    reconciledById?: string;
    notes?: string;
  };
  gatewayMetadata: Record<string, any>;
  description?: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    transactionNumber: { type: String, required: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'stripe', 'razorpay', 'paypal', 'upi', 'cash', 'manual'],
      required: true,
      default: 'manual',
    },
    type: {
      type: String,
      enum: ['income', 'expense', 'refund', 'adjustment'],
      required: true,
      index: true,
    },
    currency: { type: String, required: true, default: 'USD' },
    exchangeRate: { type: Number, required: true, default: 1.0 },
    amount: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'cleared', 'failed', 'refunded'],
      required: true,
      default: 'cleared',
      index: true,
    },
    referenceNumber: { type: String },
    paymentDate: { type: Date, required: true, default: Date.now },
    reconciliationMetadata: {
      reconciled: { type: Boolean, required: true, default: false, index: true },
      reconciledAt: { type: Date },
      reconciledById: { type: String },
      notes: { type: String },
    },
    gatewayMetadata: { type: Schema.Types.Map, of: Schema.Types.Mixed, default: {} },
    description: { type: String },
    createdById: { type: String, required: true },
  },
  { timestamps: true }
);

TransactionSchema.index({ companyId: 1, transactionNumber: 1 }, { unique: true });
TransactionSchema.index({ companyId: 1, paymentDate: -1, status: 1 });

export const Transaction =
  mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
