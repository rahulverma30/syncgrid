import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getAuthSecret } from '@/lib/env';
import { connectToDatabase } from '@/lib/db';
import { WorkspaceProvisioningEngine } from '@/lib/saas/provisioning';
import { z } from 'zod';

const onboardingSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug subdomain must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and dashes'),
  planSlug: z.enum(['starter', 'pro', 'enterprise']),
  template: z.enum(['agile', 'wiki', 'none']),
  teamSize: z.number().min(1).default(1),
  initialInvites: z.array(z.string().email()).optional(),
});

export async function POST(req: Request) {
  try {
    // 1. Get Session user
    const token = await getToken({
      req: req as any,
      secret: getAuthSecret(),
    });

    if (!token || !token.id) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = onboardingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'BAD_REQUEST', message: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 2. Provision resources using the onboarding parameters
    const result = await WorkspaceProvisioningEngine.provisionOrganization({
      name: parsed.data.name,
      slug: parsed.data.slug,
      ownerId: token.id as string,
      planSlug: parsed.data.planSlug,
      template: parsed.data.template,
      teamSize: parsed.data.teamSize,
      initialInvites: parsed.data.initialInvites,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Provisioning route error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'SERVER_ERROR',
        message: err.message || 'Failed to provision workspace',
      },
      { status: 500 }
    );
  }
}
