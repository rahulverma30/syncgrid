import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getAuthSecret } from '@/lib/env';
import { connectToDatabase } from '@/lib/db';
import { SaaSAPIKey } from '@/models';
import crypto from 'crypto';
import { z } from 'zod';

// Fetch active keys list (masked)
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

    const keys = await SaaSAPIKey.find({
      companyId: token.companyId,
      isActive: true,
    }).select('-keyHash');

    return NextResponse.json({
      success: true,
      keys,
    });
  } catch (err: any) {
    console.error('API Keys GET route error:', err);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Failed to retrieve integration keys' },
      { status: 500 }
    );
  }
}

const keyCreateSchema = z.object({
  name: z.string().min(2, 'Token description must be at least 2 characters'),
  scopes: z.array(z.string()).min(1, 'Please select at least one permission scope'),
});

// Create new scoped integration key
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

    const body = await req.json();
    const parsed = keyCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'BAD_REQUEST', message: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 1. Generate unique raw token
    const randomBytes = crypto.randomBytes(24).toString('hex');
    const rawKey = `sg_live_${randomBytes}`;

    // 2. Hash raw token
    const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');
    const maskedKey = `sg_live_...${rawKey.substring(rawKey.length - 4)}`;

    const newKey = await SaaSAPIKey.create({
      companyId: token.companyId,
      name: parsed.data.name,
      keyHash: hashedKey,
      mask: maskedKey,
      scopes: parsed.data.scopes,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      rawKey, // Presented only ONCE to the user
      key: {
        _id: newKey._id,
        name: newKey.name,
        mask: newKey.mask,
        scopes: newKey.scopes,
        createdAt: newKey.createdAt,
      },
    });
  } catch (err: any) {
    console.error('API Keys POST route error:', err);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Failed to provision integration key' },
      { status: 500 }
    );
  }
}

// Revoke/Delete integration key
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
    const keyId = searchParams.get('id');

    if (!keyId) {
      return NextResponse.json(
        { success: false, error: 'BAD_REQUEST', message: 'Missing integration key identifier' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const result = await SaaSAPIKey.deleteOne({
      _id: keyId,
      companyId: token.companyId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Token not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Integration key successfully revoked and removed from records.',
    });
  } catch (err: any) {
    console.error('API Keys DELETE route error:', err);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Failed to revoke integration key' },
      { status: 500 }
    );
  }
}
