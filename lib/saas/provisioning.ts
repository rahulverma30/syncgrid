import { connectToDatabase } from '@/lib/db';
import {
  Company,
  Workspace,
  Role,
  Permission,
  SaaSSubscriptionPlan,
  SaaSOrganizationSubscription,
  SaaSUsageMetric,
  Project,
  WikiSpace,
  Document,
  User,
} from '@/models';
import type { Types } from 'mongoose';

export interface ProvisioningInput {
  name: string; // Company Name
  slug: string; // Tenant Subdomain
  ownerId: string; // Owner User ID
  planSlug: string; // 'starter', 'pro', 'enterprise'
  template: 'agile' | 'wiki' | 'none'; // Template selector
  teamSize?: number;
  initialInvites?: string[];
}

/**
 * WorkspaceProvisioningEngine
 *
 * Atomically provisions a new SaaS tenant:
 * 1. Creates/Updates the Company profile
 * 2. Assigns the SaaS pricing tier and starts a 14-day trial
 * 3. Builds a collaborative Workspace and default user associations
 * 4. Seeds Agile Software or Knowledge Wiki templates
 * 5. Installs the initial usage quotas tracking record
 */
export class WorkspaceProvisioningEngine {
  static async provisionOrganization(input: ProvisioningInput) {
    await connectToDatabase();

    // 1. Check if Company slug already exists
    const existingCompany = await Company.findOne({ slug: input.slug });
    if (existingCompany) {
      throw new Error(`Subdomain slug "${input.slug}" is already in use.`);
    }

    // 2. Retrieve the pricing plan ID
    let plan = await SaaSSubscriptionPlan.findOne({ slug: input.planSlug });
    if (!plan) {
      // Fallback: seed standard plans if not present
      plan = await SaaSSubscriptionPlan.create({
        name:
          input.planSlug === 'enterprise'
            ? 'Enterprise Tier'
            : input.planSlug === 'pro'
              ? 'Pro Tier'
              : 'Starter Tier',
        slug: input.planSlug,
        priceMonthly: input.planSlug === 'enterprise' ? 499 : input.planSlug === 'pro' ? 49 : 19,
        pricePerSeat: input.planSlug === 'enterprise' ? 25 : input.planSlug === 'pro' ? 10 : 5,
        maxUsers: input.planSlug === 'enterprise' ? 500 : input.planSlug === 'pro' ? 50 : 10,
        maxStorageGb: input.planSlug === 'enterprise' ? 1000 : input.planSlug === 'pro' ? 100 : 15,
        maxApiRequestsMonth:
          input.planSlug === 'enterprise' ? 500000 : input.planSlug === 'pro' ? 50000 : 5000,
        maxAutomationRunsMonth:
          input.planSlug === 'enterprise' ? 10000 : input.planSlug === 'pro' ? 1000 : 100,
        features: ['sso', 'custom-branding', 'api-access', 'webhooks'],
        isActive: true,
      });
    }

    // 3. Create the Company (Multi-Tenant Org)
    const company = await Company.create({
      name: input.name,
      slug: input.slug.toLowerCase().trim(),
      status: 'active',
      ownerId: input.ownerId,
      settings: {
        timezone: 'UTC',
        locale: 'en',
      },
      subscription: {
        plan: input.planSlug,
        status: 'trialing',
      },
    });

    const companyId = company._id;

    // 4. Update the user with the new companyId if not already set
    if (input.ownerId) {
      await User.updateOne({ _id: input.ownerId }, { $set: { companyId } });
    }

    // 5. Create SaaS Subscription Details
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14 days trial

    await SaaSOrganizationSubscription.create({
      companyId,
      planId: plan._id,
      status: 'trialing',
      seats: input.teamSize || 1,
      trialEndsAt,
      billingPeriod: 'monthly',
    });

    // 6. Create SaaS Usage Metric Profile
    await SaaSUsageMetric.create({
      companyId,
      usersCount: 1, // The owner
      storageBytes: 1024 * 1024, // 1MB starter baseline
      apiRequestsThisMonth: 0,
      automationRunsThisMonth: 0,
    });

    // 7. Create Workspace
    const workspace = await Workspace.create({
      companyId,
      name: `${input.name} General Workspace`,
      description: 'Default organization-wide collaborative space created during onboarding.',
      members: [
        {
          userId: input.ownerId,
          role: 'admin',
        },
      ],
      isActive: true,
    });

    // 8. Seed template deliverables
    if (input.template === 'agile') {
      await Project.create({
        companyId,
        name: 'Enterprise Agile Platform Launch',
        description:
          'Mock agile launch project containing starter milestones, risks, and communication templates.',
        status: 'development',
        priority: 'high',
        projectManager: 'SaaS Onboarding Manager',
        budget: 75000,
        estimatedHours: 350,
        actualHours: 42,
        startDate: new Date(),
        deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60), // 60 days
        technologies: ['React', 'NextJS', 'MongoDB', 'Zustand', 'TailwindCSS'],
        teamMembers: [
          { userName: 'Onboarding Lead', role: 'project-manager', allocation: 100 },
          { userName: 'Principal Engineer', role: 'developer', allocation: 100 },
        ],
        milestones: [
          {
            title: 'Initial Provisioning Sprint',
            description: 'Successfully stand up and verify the workspace context limits.',
            dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
            status: 'completed',
            progressPercentage: 100,
          },
          {
            title: 'Audit System Compliance Review',
            description: 'Formulate security keys rotation and rate limits rules.',
            dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
            status: 'in-progress',
            progressPercentage: 35,
          },
        ],
      });
    } else if (input.template === 'wiki') {
      const space = await WikiSpace.create({
        companyId,
        name: 'Corporate Handbooks & Compliance',
        description: 'Starter corporate manuals, brand white-labels, and multi-tenant policies.',
        color: '#3B82F6',
        isActive: true,
      });

      await Document.create({
        companyId,
        spaceId: space._id,
        title: 'SaaS Platform Governance & Standard Operating Procedures',
        content: `
# Multi-Tenant Workspace Onboarding Guidelines

Welcome to your newly provisioned corporate workspace! As an Admin, you possess deep controls over this collaborative layer.

## 🔒 Security Practices & Compliance
1. **API Keys Rotation:** Manage cryptographically hashed key buffers inside the Scopes settings tab.
2. **Webhook Subscriptions:** Configure webhook endpoints with signing secrets to securely track lifecycle updates.
3. **Usage Metering:** Keep a close eye on automation run counts, user seats limits, and active document storage.

*SyncGrid Enterprise SaaS Systems, 2026*
        `,
        authorId: input.ownerId,
        status: 'published',
        version: 1,
      });
    }

    // 9. Process Mock Team invitations
    if (input.initialInvites && input.initialInvites.length > 0) {
      for (const email of input.initialInvites) {
        if (!email || !email.includes('@')) continue;

        // Setup mock invited users
        await User.create({
          name: email.split('@')[0],
          email: email.trim().toLowerCase(),
          passwordHash: '$2b$10$UnVzZXIxMjNfUGFzc3dvcmRfSGFzaF9WYWx1ZV9Gb3JfU2FhUw==', // Mock hash
          companyId,
          status: 'invited',
        });

        // Increment usage count
        await SaaSUsageMetric.updateOne({ companyId }, { $inc: { usersCount: 1 } });
      }
    }

    return {
      success: true,
      companyId: companyId.toString(),
      workspaceId: workspace._id.toString(),
      slug: company.slug,
    };
  }
}
