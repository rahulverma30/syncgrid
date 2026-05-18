import { cookies } from 'next/headers';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ClientPortalUser } from '@/models/ClientPortalUser';

const SESSION_COOKIE_NAME = 'syncgrid-portal-token';
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// We retrieve or generate a secure key for portal sessions
const ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update(process.env.NEXTAUTH_SECRET || 'syncgrid-portal-super-secret-key-at-least-32-chars')
  .digest();

const IV_LENGTH = 12; // GCM standard IV length

/**
 * Encrypt session payload into a secure token string (AES-256-GCM)
 */
export function encryptSession(payload: any): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  // Format: iv_hex:auth_tag_hex:encrypted_hex
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt session token string back into payload
 */
export function decryptSession(token: string): any | null {
  try {
    const parts = token.split(':');
    if (parts.length !== 3) return null;

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Session decryption failed:', error);
    return null;
  }
}

/**
 * Save portal session in cookies (HTTP-Only, Secure, SameSite=Lax)
 */
export async function setPortalSessionCookie(payload: any) {
  const token = encryptSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_EXPIRY_MS / 1000,
  });
}

/**
 * Clear portal session cookie
 */
export async function clearPortalSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Extract active session from cookies and load linked portal user
 */
export async function getPortalSession(): Promise<any | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!cookie || !cookie.value) return null;

    const payload = decryptSession(cookie.value);
    if (!payload || !payload.userId) return null;

    // Check if session has expired
    if (Date.now() > payload.expiresAt) {
      return null;
    }

    await connectToDatabase();
    const portalUser = await ClientPortalUser.findById(payload.userId)
      .populate('clientId')
      .populate('companyId');

    if (!portalUser || portalUser.status === 'disabled') {
      return null;
    }

    return {
      user: {
        id: portalUser._id.toString(),
        name: portalUser.name,
        email: portalUser.email,
        portalRole: portalUser.portalRole,
        mfaEnabled: portalUser.mfaEnabled ?? false,
        clientId: portalUser.clientId._id.toString(),
        clientName: portalUser.clientId.name,
        companyId: portalUser.companyId._id.toString(),
      },
      expiresAt: payload.expiresAt,
    };
  } catch (error) {
    console.error('getPortalSession error:', error);
    return null;
  }
}

/**
 * Direct check that returns session or throws Authentication Error
 */
export async function requirePortalAuth() {
  const session = await getPortalSession();
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}

/**
 * RBAC Helper: Check if client portal user has specified role
 */
export function hasPortalRole(currentRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(currentRole);
}
