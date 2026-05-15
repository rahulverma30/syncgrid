import crypto from 'crypto';

export function createSecureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createExpiry(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000);
}
