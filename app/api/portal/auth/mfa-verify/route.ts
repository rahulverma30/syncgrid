import { NextResponse } from 'next/server';
import { getPortalSession, decryptSession, setPortalSessionCookie } from '@/lib/auth/portal';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ClientPortalUser } from '@/models/ClientPortalUser';
import { verifyTOTP, generateBackupCodes } from '@/lib/security/mfa';
import { logSecurityEvent } from '@/lib/security/logger';
import { z } from 'zod';

const verifySchema = z.object({
  code: z.string().length(6, 'Verification code must be exactly 6 digits'),
  tempToken: z.string().optional(), // Provided during login challenge
});

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { code, tempToken } = parsed.data;

    // Case 1: MFA Challenge during Login
    if (tempToken) {
      const payload = decryptSession(tempToken);
      if (!payload || !payload.tempUserId || Date.now() > payload.expiresAt) {
        return NextResponse.json(
          {
            success: false,
            error: 'EXPIRED_TOKEN',
            message: 'Verification window expired. Please log in again.',
          },
          { status: 401 }
        );
      }

      const user = await ClientPortalUser.findById(payload.tempUserId);
      if (!user || user.status === 'disabled') {
        return NextResponse.json(
          { success: false, error: 'INVALID_USER', message: 'User account is invalid.' },
          { status: 401 }
        );
      }

      const isValid = verifyTOTP(code, user.mfaSecret);
      if (!isValid) {
        // Increment failed attempts and log
        await ClientPortalUser.updateOne({ _id: user._id }, { $inc: { failedLoginAttempts: 1 } });

        await logSecurityEvent({
          companyId: user.companyId.toString(),
          clientId: user.clientId.toString(),
          portalUserId: user._id.toString(),
          portalUserName: user.name,
          eventType: 'mfa_fail',
          severity: 'warning',
          actionDetails: `Failed MFA verification attempt for user "${user.name}".`,
        });

        return NextResponse.json(
          { success: false, error: 'INVALID_CODE', message: 'Invalid verification code.' },
          { status: 401 }
        );
      }

      // Successful MFA validation: Reset failed attempts, log in user
      await ClientPortalUser.updateOne(
        { _id: user._id },
        { $set: { failedLoginAttempts: 0, lastLoginAt: new Date() } }
      );

      const sessionPayload = {
        userId: user._id.toString(),
        email: user.email,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      };
      await setPortalSessionCookie(sessionPayload);

      await logSecurityEvent({
        companyId: user.companyId.toString(),
        clientId: user.clientId.toString(),
        portalUserId: user._id.toString(),
        portalUserName: user.name,
        eventType: 'login_success',
        severity: 'info',
        actionDetails: `Client Portal user "${user.name}" successfully authenticated with MFA.`,
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
    }

    // Case 2: Enabling MFA (User is already authenticated via session)
    const session = await getPortalSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Authentication required.' },
        { status: 401 }
      );
    }

    const { id: userId, email, clientId, companyId, name: userName } = session.user;

    const user = await ClientPortalUser.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'User record not found.' },
        { status: 404 }
      );
    }

    if (!user.mfaSecret) {
      return NextResponse.json(
        { success: false, error: 'BAD_REQUEST', message: 'MFA setup not initialized.' },
        { status: 400 }
      );
    }

    const isValid = verifyTOTP(code, user.mfaSecret);
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_CODE',
          message: 'Invalid verification code. Please check your authenticator app.',
        },
        { status: 400 }
      );
    }

    // Enable MFA & generate backup recovery codes
    const backupCodes = generateBackupCodes();

    await ClientPortalUser.updateOne(
      { _id: userId },
      {
        $set: {
          mfaEnabled: true,
          // Storing backup codes could be added if needed, or simply return them to client
        },
      }
    );

    await logSecurityEvent({
      companyId,
      clientId,
      portalUserId: userId,
      portalUserName: userName,
      eventType: 'mfa_enable',
      severity: 'info',
      actionDetails: `Client Portal user "${userName}" successfully enabled Multi-Factor Authentication (MFA).`,
    });

    return NextResponse.json({
      success: true,
      message: 'Multi-Factor Authentication enabled successfully!',
      data: {
        backupCodes,
      },
    });
  } catch (error: any) {
    console.error('MFA verification POST error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
