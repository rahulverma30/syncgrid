import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';

// 1. SaaSSubscriptionPlan Schema
const SaaSSubscriptionPlanSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    priceMonthly: { type: Number, required: true, default: 0 },
    pricePerSeat: { type: Number, required: true, default: 0 },
    maxUsers: { type: Number, required: true, default: 5 },
    maxStorageGb: { type: Number, required: true, default: 10 },
    maxApiRequestsMonth: { type: Number, required: true, default: 1000 },
    maxAutomationRunsMonth: { type: Number, required: true, default: 100 },
    features: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SaaSSubscriptionPlan =
  (mongoose.models.SaaSSubscriptionPlan as Model<any>) ||
  mongoose.model('SaaSSubscriptionPlan', SaaSSubscriptionPlanSchema);

// 2. SaaSOrganizationSubscription Schema
const SaaSOrganizationSubscriptionSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      unique: true,
      index: true,
    },
    planId: { type: Schema.Types.ObjectId, ref: 'SaaSSubscriptionPlan', required: true },
    status: {
      type: String,
      enum: ['trialing', 'active', 'past_due', 'canceled', 'suspended'],
      default: 'trialing',
      index: true,
    },
    seats: { type: Number, required: true, default: 1 },
    stripeSubscriptionId: { type: String, default: null },
    trialEndsAt: { type: Date, required: true },
    billingPeriod: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    gracePeriodEndsAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const SaaSOrganizationSubscription =
  (mongoose.models.SaaSOrganizationSubscription as Model<any>) ||
  mongoose.model('SaaSOrganizationSubscription', SaaSOrganizationSubscriptionSchema);

// 3. SaaSFeatureFlag Schema
const SaaSFeatureFlagSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    description: { type: String, trim: true },
    rolloutPercentage: { type: Number, default: 100 }, // 0 to 100
    enabledPlans: [{ type: String }], // Array of subscription slugs (e.g., 'pro', 'enterprise')
    overrideCompanyIds: [{ type: Schema.Types.ObjectId, ref: 'Company' }], // Custom overrides per tenant
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SaaSFeatureFlag =
  (mongoose.models.SaaSFeatureFlag as Model<any>) ||
  mongoose.model('SaaSFeatureFlag', SaaSFeatureFlagSchema);

// 4. SaaSAPIKey Schema
const SaaSAPIKeySchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    name: { type: String, required: true, trim: true },
    keyHash: { type: String, required: true, unique: true }, // Encrypted / hashed key
    mask: { type: String, required: true }, // Masked display 'sg_live_...4a2c'
    scopes: [{ type: String }], // 'projects:read', 'tasks:write', etc.
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SaaSAPIKey =
  (mongoose.models.SaaSAPIKey as Model<any>) || mongoose.model('SaaSAPIKey', SaaSAPIKeySchema);

// 5. SaaSWebhook Schema
const SaaSWebhookSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    url: { type: String, required: true, trim: true },
    secret: { type: String, required: true }, // Signature key
    subscribedEvents: [{ type: String }], // 'invoice.paid', 'approval.completed', etc.
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SaaSWebhook =
  (mongoose.models.SaaSWebhook as Model<any>) || mongoose.model('SaaSWebhook', SaaSWebhookSchema);

// 6. SaaSWebhookDelivery Schema
const SaaSWebhookDeliverySchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    webhookId: { type: Schema.Types.ObjectId, ref: 'SaaSWebhook', required: true, index: true },
    event: { type: String, required: true },
    payload: { type: String, required: true }, // Stringified JSON
    attempts: [
      {
        timestamp: { type: Date, default: Date.now },
        statusCode: { type: Number },
        response: { type: String },
      },
    ],
    nextRetryAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['pending', 'delivered', 'failed'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

export const SaaSWebhookDelivery =
  (mongoose.models.SaaSWebhookDelivery as Model<any>) ||
  mongoose.model('SaaSWebhookDelivery', SaaSWebhookDeliverySchema);

// 7. SaaSUsageMetric Schema
const SaaSUsageMetricSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      unique: true,
      index: true,
    },
    usersCount: { type: Number, default: 0 },
    storageBytes: { type: Number, default: 0 },
    apiRequestsThisMonth: { type: Number, default: 0 },
    automationRunsThisMonth: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const SaaSUsageMetric =
  (mongoose.models.SaaSUsageMetric as Model<any>) ||
  mongoose.model('SaaSUsageMetric', SaaSUsageMetricSchema);

// 8. SaaSBackup Schema
const SaaSBackupSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    snapshotName: { type: String, required: true },
    sizeBytes: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ['completed', 'failed', 'restored'], default: 'completed' },
  },
  { timestamps: true }
);

export const SaaSBackup =
  (mongoose.models.SaaSBackup as Model<any>) || mongoose.model('SaaSBackup', SaaSBackupSchema);
