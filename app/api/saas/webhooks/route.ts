import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getAuthSecret } from '@/lib/env';
import { connectToDatabase } from '@/lib/db';
import { SaaSWebhook, SaaSWebhookDelivery } from '@/models';
import { WebhookDeliveryEngine } from '@/lib/saas/webhookQueue';
import crypto from 'crypto';
import { z } from 'zod';

// Fetch registered endpoints & latest delivery history logs
export async function GET(req: Request) {
  try {
    const token = await getToken({
      req: req as any,
      secret: getAuthSecret(),
    });

    if (!token || !token.companyId) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const endpoints = await SaaSWebhook.find({ companyId: token.companyId });
    const deliveries = await SaaSWebhookDelivery.find({ companyId: token.companyId })
      .sort({ createdAt: -1 })
      .limit(10);

    return NextResponse.json({
      success: true,
      endpoints,
      deliveries,
    });
  } catch (err: any) {
    console.error('Webhooks GET route error:', err);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Failed to retrieve webhooks metadata' },
      { status: 500 }
    );
  }
}

const webhookRegisterSchema = z.object({
  url: z.string().url('Invalid endpoint URL address'),
  subscribedEvents: z.array(z.string()).min(1, 'Please subscribe to at least one system event'),
});

// Register new webhook or execute test ping simulation
export async function POST(req: Request) {
  try {
    const token = await getToken({
      req: req as any,
      secret: getAuthSecret(),
    });

    if (!token || !token.companyId) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    await connectToDatabase();

    // 1. Process "Test Ping" request
    if (action === 'ping') {
      const body = await req.json();
      const webhookId = body.webhookId;
      const targetHook = await SaaSWebhook.findOne({ _id: webhookId, companyId: token.companyId });

      if (!targetHook) {
        return NextResponse.json(
          { success: false, error: 'NOT_FOUND', message: 'Webhook endpoint not found' },
          { status: 404 }
        );
      }

      // Publish dynamic test event
      await WebhookDeliveryEngine.publishEvent(token.companyId as string, 'webhook.ping', {
        testEvent: true,
        pingedAt: new Date(),
        scope: 'saas-system-verification',
        platform: 'SyncGrid WebhookBroker v1',
      });

      return NextResponse.json({
        success: true,
        message: 'Test ping event dispatched successfully to webhook deliver pipeline.',
      });
    }

    // 2. Process standard endpoint registration
    const body = await req.json();
    const parsed = webhookRegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'BAD_REQUEST', message: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const signingSecret = `whsec_${crypto.randomBytes(16).toString('hex')}`;

    const newWebhook = await SaaSWebhook.create({
      companyId: token.companyId,
      url: parsed.data.url.trim(),
      secret: signingSecret,
      subscribedEvents: parsed.data.subscribedEvents,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      webhook: newWebhook,
    });
  } catch (err: any) {
    console.error('Webhooks POST route error:', err);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Failed to process webhooks action' },
      { status: 500 }
    );
  }
}

// Remove/Unregister webhook endpoint
export async function DELETE(req: Request) {
  try {
    const token = await getToken({
      req: req as any,
      secret: getAuthSecret(),
    });

    if (!token || !token.companyId) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const webhookId = searchParams.get('id');

    if (!webhookId) {
      return NextResponse.json(
        { success: false, error: 'BAD_REQUEST', message: 'Missing webhook identifier' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const result = await SaaSWebhook.deleteOne({
      _id: webhookId,
      companyId: token.companyId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Webhook not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook endpoint successfully deleted and removed from records.',
    });
  } catch (err: any) {
    console.error('Webhooks DELETE route error:', err);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Failed to delete webhook endpoint' },
      { status: 500 }
    );
  }
}
