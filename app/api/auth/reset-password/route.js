import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { hashPassword } from '@/lib/security/password';
import { hashToken } from '@/lib/security/tokens';
import { resetPasswordSchema } from '@/schemas/auth';
import { AuditLog, PasswordResetToken, User } from '@/models';

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

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

    const resetToken = await PasswordResetToken.findOne({
      tokenHash: hashToken(parsed.data.token),
      usedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!resetToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_TOKEN',
          message: 'Reset token is invalid or expired.',
        },
        { status: 400 }
      );
    }

    const user = await User.findById(resetToken.userId);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_TOKEN',
          message: 'Reset token is invalid or expired.',
        },
        { status: 400 }
      );
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordHash: await hashPassword(parsed.data.password),
          passwordChangedAt: new Date(),
          failedLoginAttempts: 0,
          lockUntil: null,
        },
      }
    );

    await PasswordResetToken.updateOne(
      { _id: resetToken._id },
      {
        $set: {
          usedAt: new Date(),
        },
      }
    );

    await AuditLog.create({
      companyId: user.companyId,
      actorId: user._id,
      action: 'reset-password',
      resource: 'auth',
      resourceId: user._id.toString(),
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully.',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'RESET_FAILED',
        message: 'Unable to reset password.',
      },
      { status: 500 }
    );
  }
}
