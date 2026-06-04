import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const ContactSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      trim: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full name
ContactSchema.virtual('name').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

ContactSchema.index({ companyId: 1, isArchived: 1 });
ContactSchema.index({ companyId: 1, accountId: 1 });
ContactSchema.index({ companyId: 1, email: 1 });

export const Contact = ((mongoose.models.Contact as Model<any>) ||
  mongoose.model('Contact', ContactSchema)) as Model<any>;
