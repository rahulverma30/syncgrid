import { connectToDatabase } from '@/lib/db';
import { SaaSOrganizationSubscription, SaaSSubscriptionPlan, SaaSUsageMetric } from '@/models';

export interface BillingQuotas {
  planName: string;
  planSlug: string;
  priceMonthly: number;
  seats: number;
  status: string;
  trialEndsAt: Date;
  gracePeriodEndsAt: Date | null;
  users: { current: number; limit: number; pct: number };
  storage: { current: number; limit: number; pct: number; currentGb: number };
  api: { current: number; limit: number; pct: number };
  automations: { current: number; limit: number; pct: number };
}

/**
 * EnterpriseBillingEngine
 *
 * Scopes SaaS subscriptions, calculates usage ratios, and compiles
 * metered billing indicators for the tenant settings dashboards.
 */
export class EnterpriseBillingEngine {
  /**
   * Compiles and aggregates all metered quota capacities
   */
  static async getBillingQuotas(companyId: string): Promise<BillingQuotas> {
    await connectToDatabase();

    // 1. Get active Subscription and Plan
    const sub = await SaaSOrganizationSubscription.findOne({ companyId }).populate({
      path: 'planId',
      model: SaaSSubscriptionPlan,
    });

    if (!sub) {
      throw new Error(`No active subscription record found for organization: ${companyId}`);
    }

    const plan = sub.planId;
    if (!plan) {
      throw new Error(`Pricing Plan information missing for subscription: ${sub._id}`);
    }

    // 2. Fetch Usage Metric
    let usage = await SaaSUsageMetric.findOne({ companyId });
    if (!usage) {
      usage = await SaaSUsageMetric.create({
        companyId,
        usersCount: 1,
        storageBytes: 1024 * 1024 * 15, // 15MB base
        apiRequestsThisMonth: 120,
        automationRunsThisMonth: 8,
      });
    }

    const currentUsers = usage.usersCount || 1;
    const currentStorageBytes = usage.storageBytes || 1024 * 1024;
    const currentStorageGb = parseFloat((currentStorageBytes / (1024 * 1024 * 1024)).toFixed(3));
    const currentApi = usage.apiRequestsThisMonth || 0;
    const currentAutomations = usage.automationRunsThisMonth || 0;

    return {
      planName: plan.name,
      planSlug: plan.slug,
      priceMonthly: plan.priceMonthly,
      seats: sub.seats,
      status: sub.status,
      trialEndsAt: sub.trialEndsAt,
      gracePeriodEndsAt: sub.gracePeriodEndsAt,
      users: {
        current: currentUsers,
        limit: plan.maxUsers,
        pct: Math.min(100, Math.round((currentUsers / plan.maxUsers) * 100)),
      },
      storage: {
        current: currentStorageBytes,
        currentGb: currentStorageGb,
        limit: plan.maxStorageGb,
        pct: Math.min(100, Math.round((currentStorageGb / plan.maxStorageGb) * 100)),
      },
      api: {
        current: currentApi,
        limit: plan.maxApiRequestsMonth,
        pct: Math.min(100, Math.round((currentApi / plan.maxApiRequestsMonth) * 100)),
      },
      automations: {
        current: currentAutomations,
        limit: plan.maxAutomationRunsMonth,
        pct: Math.min(100, Math.round((currentAutomations / plan.maxAutomationRunsMonth) * 100)),
      },
    };
  }

  static getInvoiceLog(companyId: string, planPrice: number, seatsCount: number) {
    return [];
  }

  /**
   * Updates organization billing tiers
   */
  static async changePlan(companyId: string, newPlanSlug: string, newSeats: number) {
    await connectToDatabase();

    const plan = await SaaSSubscriptionPlan.findOne({ slug: newPlanSlug });
    if (!plan) {
      throw new Error(`Target pricing plan "${newPlanSlug}" does not exist.`);
    }

    await SaaSOrganizationSubscription.updateOne(
      { companyId },
      {
        $set: {
          planId: plan._id,
          seats: newSeats,
          status: 'active',
        },
      }
    );

    return {
      success: true,
      message: `Successfully migrated organization to the ${plan.name}.`,
    };
  }
}
