import mongoose, { Schema, Document } from 'mongoose';

export interface IVendor extends Document {
  companyId: mongoose.Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  category: 'software' | 'hardware' | 'utilities' | 'consulting' | 'office_rent' | 'other';
  taxId?: string; // EIN / VAT number
  paymentTerms: 'due_on_receipt' | 'net_15' | 'net_30' | 'net_60';
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zip: { type: String },
      country: { type: String },
    },
    category: {
      type: String,
      enum: ['software', 'hardware', 'utilities', 'consulting', 'office_rent', 'other'],
      required: true,
      default: 'other',
      index: true,
    },
    taxId: { type: String },
    paymentTerms: {
      type: String,
      enum: ['due_on_receipt', 'net_15', 'net_30', 'net_60'],
      required: true,
      default: 'net_30',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      required: true,
      default: 'active',
      index: true,
    },
    notes: { type: String },
  },
  { timestamps: true }
);

VendorSchema.index({ companyId: 1, name: 1 });

export const Vendor = mongoose.models.Vendor || mongoose.model<IVendor>('Vendor', VendorSchema);
