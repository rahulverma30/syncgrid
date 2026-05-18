import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

const ClientPortalThemeSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      unique: true,
      index: true,
    },
    logoUrl: {
      type: String,
      default: '',
    },
    primaryColor: {
      type: String,
      default: '#3b82f6', // Tailwinds indigo-600 standard primary color hex
    },
    accentColor: {
      type: String,
      default: '#10b981', // Emerald-500 accent hex
    },
    welcomeTitle: {
      type: String,
      default: 'Welcome to your Client Space',
    },
    welcomeSubtitle: {
      type: String,
      default:
        'Collaborate with us, track progress, review deliverables, and access shared billing here.',
    },
    bannerUrl: {
      type: String,
      default: '',
    },
    customDomain: {
      type: String,
      default: '',
      index: true,
    },
    isWhiteLabeled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const ClientPortalTheme = ((mongoose.models.ClientPortalTheme as Model<any>) ||
  mongoose.model('ClientPortalTheme', ClientPortalThemeSchema)) as Model<any>;
