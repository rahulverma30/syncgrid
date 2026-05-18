import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ClientPortalUser } from '@/models/ClientPortalUser';
import { ClientPortalAuditLog } from '@/models/ClientPortalAuditLog';
import { verifyPassword, isAccountLocked } from '@/lib/security/password';
import { setPortalSessionCookie, encryptSession } from '@/lib/auth/portal';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await ClientPortalUser.findOne({ email: email.toLowerCase() });
    if (!user || user.status === 'disabled') {
      return NextResponse.json(
        { success: false, error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Check if account is locked
    if (isAccountLocked(user)) {
      return NextResponse.json(
        { success: false, error: 'LOCKED', message: 'Account is temporarily locked.' },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      const failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      const lockUntil =
        failedLoginAttempts >= MAX_FAILED_ATTEMPTS
          ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
          : null;

      await ClientPortalUser.updateOne(
        { _id: user._id },
        { $set: { failedLoginAttempts, lockUntil } }
      );

      // Log failed audit log
      await ClientPortalAuditLog.create({
        companyId: user.companyId,
        clientId: user.clientId,
        portalUserId: user._id,
        portalUserName: user.name,
        eventType: 'login_fail',
        severity: failedLoginAttempts >= MAX_FAILED_ATTEMPTS ? 'critical' : 'warning',
        actionDetails: `Failed login attempt for email: ${email}. Total attempts: ${failedLoginAttempts}.`,
      });

      return NextResponse.json(
        { success: false, error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    if (user.mfaEnabled) {
      // MFA is enabled - generate secure 5-minute temporary token for verification step
      const tempTokenPayload = {
        tempUserId: user._id.toString(),
        expiresAt: Date.now() + 5 * 60 * 1000,
      };
      const tempToken = encryptSession(tempTokenPayload);

      return NextResponse.json({
        success: true,
        mfaRequired: true,
        tempToken,
      });
    }

    // On success without MFA, reset failures and set login time
    await ClientPortalUser.updateOne(
      { _id: user._id },
      {
        $set: {
          lastLoginAt: new Date(),
          failedLoginAttempts: 0,
          lockUntil: null,
          status: 'active', // Activate if they were just invited
        },
      }
    );

    // Set HTTP-Only Session Cookie
    const sessionPayload = {
      userId: user._id.toString(),
      email: user.email,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };
    await setPortalSessionCookie(sessionPayload);

    // Success audit log
    await ClientPortalAuditLog.create({
      companyId: user.companyId,
      clientId: user.clientId,
      portalUserId: user._id,
      portalUserName: user.name,
      eventType: 'login_success',
      severity: 'info',
      actionDetails: `Client Portal user "${user.name}" successfully logged in.`,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        portalRole: user.portalRole,
        clientId: user.clientId.toString(),
        companyId: user.companyId.toString(),
      },
    });
  } catch (error: any) {
    console.error('Portal Login API Error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
