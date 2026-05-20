import { NextResponse } from 'next/server';
import { withApiRole } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import {
  Company,
  SaaSBackup,
  SaaSOrganizationSubscription,
  SaaSSubscriptionPlan,
  SaaSUsageMetric,
} from '@/models';

export const GET = withApiRole(['super-admin'], async (request: Request) => {
  try {
    await connectToDatabase();

    // 1. Total Registered Tenant Companies
    const companies = await Company.find({}).lean();
    const tenantsCount = companies.length;

    // 2. Load SaaS subscriptions and plans to compute active MRR
    const subscriptions = await SaaSOrganizationSubscription.find({
      status: { $in: ['active', 'trialing'] },
    }).lean();

    const planIds = subscriptions.map((s) => s.planId);
    const plansList = await SaaSSubscriptionPlan.find({ _id: { $in: planIds } }).lean();
    const plansMap = new Map(plansList.map((p) => [p._id.toString(), p]));

    let calculatedMrr = 0;
    subscriptions.forEach((sub) => {
      const plan = plansMap.get(sub.planId.toString());
      if (plan) {
        const basePrice = plan.priceMonthly || 0;
        const seatPrice = (plan.pricePerSeat || 0) * (sub.seats || 0);
        calculatedMrr += basePrice + seatPrice;
      }
    });

    // 3. Retrieve live cluster backups
    const dbBackups = await SaaSBackup.find({}).sort({ createdAt: -1 }).limit(10).lean();

    // Map database backups to frontend format
    const backupsList = dbBackups.map((b: any) => {
      const sizeMb = (b.sizeBytes / (1024 * 1024)).toFixed(1);
      return {
        id: b._id.toString(),
        name: b.snapshotName,
        size: `${sizeMb} MB`,
        date: new Date(b.createdAt).toLocaleDateString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        status: b.status || 'completed',
      };
    });

    // 4. Retrieve live tenant utilization stats
    const usageMetricsList = await SaaSUsageMetric.find({}).lean();
    const usageMetricsMap = new Map(usageMetricsList.map((m) => [m.companyId.toString(), m]));

    const tenantsList = companies.map((c: any) => {
      const sub = subscriptions.find((s) => s.companyId.toString() === c._id.toString());
      const plan = sub ? plansMap.get(sub.planId.toString()) : null;
      const metric = usageMetricsMap.get(c._id.toString());

      return {
        _id: c._id.toString(),
        name: c.name,
        slug: c.slug || c.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        plan: plan?.name || 'Free Tier',
        seats: sub?.seats || 0,
        storageGb: metric ? Number((metric.storageBytes / (1024 * 1024 * 1024)).toFixed(2)) : 0,
        apiCalls: metric?.apiRequestsThisMonth || 0,
        status: sub?.status || 'inactive',
      };
    });

    // 5. System Indicators
    const systemHealth = 99.9;
    const avgLatency = 38; // Mock cluster latency average

    return NextResponse.json({
      success: true,
      data: {
        tenants: tenantsList,
        backups: backupsList,
        calculatedMrr,
        systemHealth,
        avgLatency,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'STATS_FETCH_FAILED', message: error.message },
      { status: 500 }
    );
  }
});
