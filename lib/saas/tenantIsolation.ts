import { connectToDatabase } from '@/lib/db';
import {
  SaaSOrganizationSubscription,
  SaaSSubscriptionPlan,
  SaaSFeatureFlag,
  SaaSUsageMetric,
  ClientPortalAuditLog,
} from '@/models';
import type { Types } from 'mongoose';

/**
 * TenantIsolationEngine
 *
 * Scopes database queries, checks plan feature permissions, audits access,
 * and maintains absolute boundaries between client organizations.
 */
export class TenantIsolationEngine {
  /**
   * Enforces strict multi-tenant context validation
   */
  static validateTenantScope(userCompanyId: string, targetCompanyId: string): boolean {
    if (!userCompanyId || !targetCompanyId) return false;
    return userCompanyId.toString() === targetCompanyId.toString();
  }

  /**
   * Scopes any DB query to the correct organization
   */
  static scopeQuery(
    companyId: string | Types.ObjectId,
    baseQuery: Record<string, any> = {}
  ): Record<string, any> {
    if (!companyId) {
      throw new Error('Tenant isolation violation: Scoping required but no companyId provided.');
    }
    return {
      ...baseQuery,
      companyId: typeof companyId === 'string' ? companyId : companyId.toString(),
    };
  }

  /**
   * Evaluates feature flags for a specific tenant
   */
  static async isFeatureEnabled(companyId: string, featureKey: string): Promise<boolean> {
    await connectToDatabase();

    // Check custom overrides first
    const flag = await SaaSFeatureFlag.findOne({ key: featureKey, isActive: true });
    if (!flag) return false;

    // Check direct company overrides
    if (flag.overrideCompanyIds?.some((id: any) => id.toString() === companyId)) {
      return true;
    }

    // Retrieve company's active plan
    const sub = await SaaSOrganizationSubscription.findOne({ companyId }).populate({
      path: 'planId',
      model: SaaSSubscriptionPlan,
    });
    if (!sub || sub.status === 'suspended') return false;

    const plan = sub.planId;
    if (!plan || !plan.isActive) return false;

    // Fall back to rollout percentages or active plan lists
    const isPlanEnabled = flag.enabledPlans?.includes(plan.slug);
    if (!isPlanEnabled) return false;

    // Optional Rollout percentages check based on company ID hash
    if (flag.rolloutPercentage < 100) {
      const hash = companyId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return hash % 100 < flag.rolloutPercentage;
    }

    return true;
  }

  /**
   * Safely increments metered limits
   */
  static async incrementUsage(
    companyId: string,
    metric: 'usersCount' | 'storageBytes' | 'apiRequestsThisMonth' | 'automationRunsThisMonth',
    amount = 1
  ): Promise<void> {
    await connectToDatabase();
    await SaaSUsageMetric.updateOne(
      { companyId },
      { $inc: { [metric]: amount } },
      { upsert: true }
    );
  }

  /**
   * Checks if user remains under active subscription caps
   */
  static async isUsageWithinLimits(
    companyId: string,
    metric: 'usersCount' | 'storageBytes' | 'apiRequestsThisMonth' | 'automationRunsThisMonth'
  ): Promise<boolean> {
    await connectToDatabase();

    const sub = await SaaSOrganizationSubscription.findOne({ companyId }).populate({
      path: 'planId',
      model: SaaSSubscriptionPlan,
    });
    if (!sub || sub.status === 'suspended') return false;

    const plan = sub.planId;
    if (!plan) return false;

    const usage = await SaaSUsageMetric.findOne({ companyId });
    if (!usage) return true; // No usage recorded yet

    // Compare actual against caps
    if (metric === 'usersCount') {
      return (usage.usersCount || 0) < plan.maxUsers;
    }
    if (metric === 'storageBytes') {
      const maxBytes = plan.maxStorageGb * 1024 * 1024 * 1024;
      return (usage.storageBytes || 0) < maxBytes;
    }
    if (metric === 'apiRequestsThisMonth') {
      return (usage.apiRequestsThisMonth || 0) < plan.maxApiRequestsMonth;
    }
    if (metric === 'automationRunsThisMonth') {
      return (usage.automationRunsThisMonth || 0) < plan.maxAutomationRunsMonth;
    }

    return true;
  }

  /**
   * Centralized platform security monitoring
   */
  static async logSecurityEvent(
    companyId: string,
    userId: string,
    action: string,
    severity: 'info' | 'warning' | 'critical',
    details: string
  ): Promise<void> {
    await connectToDatabase();
    await ClientPortalAuditLog.create({
      companyId,
      portalUserId: userId,
      portalUserName: 'Platform Scopes Engine',
      action,
      resource: 'SecurityGuard',
      details: `[${severity.toUpperCase()}] ${details}`,
      ipAddress: '127.0.0.1',
    });
  }
}
