import { NextResponse } from 'next/server';
import { requirePortalAuth } from '@/lib/auth/portal';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ClientPortalTheme } from '@/models/ClientPortalTheme';
import { ClientPortalAuditLog } from '@/models/ClientPortalAuditLog';
import { z } from 'zod';

const updateThemeSchema = z.object({
  logoUrl: z.string().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color')
    .optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color')
    .optional(),
  welcomeTitle: z.string().min(2).optional(),
  welcomeSubtitle: z.string().min(2).optional(),
  bannerUrl: z.string().optional(),
  isWhiteLabeled: z.boolean().optional(),
});

export async function GET() {
  try {
    await connectToDatabase();

    const session = await requirePortalAuth();
    const { clientId, companyId } = session.user;

    // Find or initialize theme settings for this client
    let theme = await ClientPortalTheme.findOne({ clientId });
    if (!theme) {
      theme = new ClientPortalTheme({
        companyId,
        clientId,
        primaryColor: '#3b82f6', // Indigo/Blue default
        accentColor: '#10b981', // Emerald default
        welcomeTitle: 'Welcome to your Workspace',
        welcomeSubtitle:
          'Track your projects, submit feedback, approve milestones, and chat with us.',
      });
      await theme.save();
    }

    return NextResponse.json({ success: true, data: theme });
  } catch (error: any) {
    console.error('Portal Theme GET Error:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: 'QUERY_ERROR', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const session = await requirePortalAuth();
    const {
      id: portalUserId,
      name: portalUserName,
      portalRole,
      clientId,
      companyId,
    } = session.user;

    // Only 'Client Owner' role or internal agency managers should change theme colors
    if (portalRole !== 'Client Owner') {
      return NextResponse.json(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'Only Client Owners can configure portal branding.',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = updateThemeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const updated = await ClientPortalTheme.findOneAndUpdate(
      { clientId },
      { $set: parsed.data },
      { new: true, upsert: true }
    );

    // Audit log branding updates
    await ClientPortalAuditLog.create({
      companyId,
      clientId,
      portalUserId,
      portalUserName,
      eventType: 'permission_change', // branding change
      severity: 'info',
      actionDetails: `Client Portal owner "${portalUserName}" updated portal branding settings (Primary: ${updated.primaryColor}, Accent: ${updated.accentColor}, White-Labeled: ${updated.isWhiteLabeled}).`,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Portal Theme POST Error:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: 'ACTION_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
