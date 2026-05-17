import mongoose, { Schema, Document } from 'mongoose';

export interface IClientBillingProfile extends Document {
  companyId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  billingEmail?: string;
  billingPhone?: string;
  preferredCurrency: string;
  paymentTerms: 'due_on_receipt' | 'net_15' | 'net_30' | 'net_60';
  taxExempt: boolean;
  taxRegistrationNumber?: string; // GSTIN / VAT ID
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  automaticInvoicing: boolean;
  creditLimit: number;
  w9Attached: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClientBillingProfileSchema = new Schema<IClientBillingProfile>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, unique: true, index: true },
    billingEmail: { type: String },
    billingPhone: { type: String },
    preferredCurrency: { type: String, required: true, default: 'USD' },
    paymentTerms: {
      type: String,
      enum: ['due_on_receipt', 'net_15', 'net_30', 'net_60'],
      required: true,
      default: 'net_30',
    },
    taxExempt: { type: Boolean, required: true, default: false },
    taxRegistrationNumber: { type: String },
    billingAddress: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zip: { type: String },
      country: { type: String },
    },
    automaticInvoicing: { type: Boolean, required: true, default: false },
    creditLimit: { type: Number, required: true, default: 0 },
    w9Attached: { type: Boolean, required: true, default: false },
    notes: { type: String },
  },
  { timestamps: true }
);

export const ClientBillingProfile =
  mongoose.models.ClientBillingProfile ||
  mongoose.model<IClientBillingProfile>('ClientBillingProfile', ClientBillingProfileSchema);
