import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import {
  SaaSSubscriptionPlan,
  SaaSOrganizationSubscription,
  SaaSUsageMetric,
  SaaSBackup,
  SaaSWebhook,
  SaaSWebhookDelivery,
  Company,
} from '@/models';

export async function GET() {
  try {
    await connectToDatabase();

    // 1. Wipe existing SaaS configuration schemas (prevents duplicates)
    await SaaSSubscriptionPlan.deleteMany({});
    await SaaSOrganizationSubscription.deleteMany({});
    await SaaSUsageMetric.deleteMany({});
    await SaaSBackup.deleteMany({});
    await SaaSWebhook.deleteMany({});
    await SaaSWebhookDelivery.deleteMany({});

    // 2. Seed standard Subscription Plans
    const plans = await SaaSSubscriptionPlan.create([
      {
        name: 'Starter Plan',
        slug: 'starter',
        priceMonthly: 19,
        pricePerSeat: 5,
        maxUsers: 10,
        maxStorageGb: 15,
        maxApiRequestsMonth: 5000,
        maxAutomationRunsMonth: 100,
        features: ['sso-baseline'],
        isActive: true,
      },
      {
        name: 'Pro Premium Plan',
        slug: 'pro',
        priceMonthly: 49,
        pricePerSeat: 10,
        maxUsers: 50,
        maxStorageGb: 100,
        maxApiRequestsMonth: 50000,
        maxAutomationRunsMonth: 1000,
        features: ['custom-branding', 'api-access', 'webhooks-dispatcher'],
        isActive: true,
      },
      {
        name: 'Enterprise Tier',
        slug: 'enterprise',
        priceMonthly: 499,
        pricePerSeat: 25,
        maxUsers: 500,
        maxStorageGb: 1000,
        maxApiRequestsMonth: 500000,
        maxAutomationRunsMonth: 10000,
        features: [
          'custom-branding',
          'api-access',
          'webhooks-dispatcher',
          'saml-sso',
          'custom-sla',
        ],
        isActive: true,
      },
    ]);

    const starterPlan = plans[0];
    const proPlan = plans[1];
    const enterprisePlan = plans[2];

    // 3. Find or Create Mock Companies
    let acme = await Company.findOne({ slug: 'acme' });
    if (!acme) {
      acme = await Company.create({
        name: 'Acme Corporate',
        slug: 'acme',
        status: 'active',
        settings: { timezone: 'UTC', locale: 'en' },
        subscription: { plan: 'pro', status: 'active' },
      });
    }

    let stark = await Company.findOne({ slug: 'stark' });
    if (!stark) {
      stark = await Company.create({
        name: 'Stark Industries',
        slug: 'stark',
        status: 'active',
        settings: { timezone: 'EST', locale: 'en' },
        subscription: { plan: 'enterprise', status: 'active' },
      });
    }

    let oscorp = await Company.findOne({ slug: 'oscorp' });
    if (!oscorp) {
      oscorp = await Company.create({
        name: 'Oscorp Biotech',
        slug: 'oscorp',
        status: 'active',
        settings: { timezone: 'PST', locale: 'en' },
        subscription: { plan: 'starter', status: 'active' },
      });
    }

    // 4. Seed SaaS Subscriptions details
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    await SaaSOrganizationSubscription.create([
      {
        companyId: acme._id,
        planId: proPlan._id,
        status: 'active',
        seats: 8,
        trialEndsAt,
        billingPeriod: 'monthly',
      },
      {
        companyId: stark._id,
        planId: enterprisePlan._id,
        status: 'active',
        seats: 125,
        trialEndsAt,
        billingPeriod: 'yearly',
      },
      {
        companyId: oscorp._id,
        planId: starterPlan._id,
        status: 'past_due',
        seats: 3,
        trialEndsAt,
        billingPeriod: 'monthly',
      },
    ]);

    // 5. Seed SaaS Usage Metrics
    await SaaSUsageMetric.create([
      {
        companyId: acme._id,
        usersCount: 8,
        storageBytes: 1024 * 1024 * 1024 * 42.5, // 42.5 GB
        apiRequestsThisMonth: 12500,
        automationRunsThisMonth: 320,
      },
      {
        companyId: stark._id,
        usersCount: 125,
        storageBytes: 1024 * 1024 * 1024 * 680, // 680 GB
        apiRequestsThisMonth: 380000,
        automationRunsThisMonth: 7850,
      },
      {
        companyId: oscorp._id,
        usersCount: 3,
        storageBytes: 1024 * 1024 * 1024 * 11.2, // 11.2 GB
        apiRequestsThisMonth: 4800,
        automationRunsThisMonth: 95,
      },
    ]);

    // 6. Seed SaaS Backups history
    await SaaSBackup.create([
      {
        companyId: acme._id,
        snapshotName: 'acme_daily_snap_0518',
        sizeBytes: 1024 * 1024 * 142,
        status: 'completed',
      },
      {
        companyId: stark._id,
        snapshotName: 'stark_hourly_snap_0518',
        sizeBytes: 1024 * 1024 * 1024 * 2.8,
        status: 'completed',
      },
      {
        companyId: oscorp._id,
        snapshotName: 'oscorp_manual_snap_0517',
        sizeBytes: 1024 * 1024 * 72,
        status: 'completed',
      },
    ]);

    // 7. Seed SaaS Webhooks and Deliveries
    const hook = await SaaSWebhook.create({
      companyId: acme._id,
      url: 'https://webhook.acme.com/receiver',
      secret: 'whsec_e8f0003058849b29',
      subscribedEvents: ['invoice.paid', 'approval.completed'],
      isActive: true,
    });

    await SaaSWebhookDelivery.create([
      {
        companyId: acme._id,
        webhookId: hook._id,
        event: 'invoice.paid',
        payload: '{"invoiceId":"INV-2026-9041","amount":129,"status":"paid"}',
        attempts: [
          {
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
            statusCode: 200,
            response: '{"success":true,"latencyMs":140}',
          },
        ],
        status: 'delivered',
      },
      {
        companyId: acme._id,
        webhookId: hook._id,
        event: 'approval.completed',
        payload: '{"approvalId":"APP-0042","signedBy":"Tony Stark"}',
        attempts: [
          {
            timestamp: new Date(Date.now() - 1000 * 60 * 5),
            statusCode: 503,
            response: '{"error":"Timeout","message":"Service unavailable"}',
          },
          {
            timestamp: new Date(Date.now() - 1000 * 60 * 4),
            statusCode: 200,
            response: '{"success":true,"latencyMs":190}',
          },
        ],
        status: 'delivered',
      },
    ]);

    return NextResponse.json({
      success: true,
      message: 'SaaS Multi-tenant simulation data seeded successfully across all indices.',
    });
  } catch (err: any) {
    console.error('Seeding API route error:', err);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: err.message || 'Seeding failed' },
      { status: 500 }
    );
  }
}
