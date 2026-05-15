import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { createExpiry, createSecureToken, hashToken } from '@/lib/security/tokens';
import { forgotPasswordSchema } from '@/schemas/auth';
import { AuditLog, PasswordResetToken, User } from '@/models';

export async function POST(request) {
  const genericResponse = {
    success: true,
    message: 'If the account exists, password reset instructions will be sent.',
  };

  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email: parsed.data.email }).select('_id companyId email');

    if (!user) {
      return NextResponse.json(genericResponse);
    }

    const token = createSecureToken();

    await PasswordResetToken.create({
      userId: user._id,
      tokenHash: hashToken(token),
      expiresAt: createExpiry(30),
    });

    await AuditLog.create({
      companyId: user.companyId,
      actorId: user._id,
      action: 'forgot-password',
      resource: 'auth',
      resourceId: user._id.toString(),
      status: 'success',
    });

    return NextResponse.json({
      ...genericResponse,
      devResetToken: process.env.NODE_ENV === 'production' ? undefined : token,
    });
  } catch (error) {
    return NextResponse.json(genericResponse);
  }
}
