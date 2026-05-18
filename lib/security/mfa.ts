import crypto from 'crypto';

/**
 * Native Base32 Decoder
 */
export function decodeBase32(base32: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleaned = base32.toUpperCase().replace(/=+$/, '');
  let bits = 0;
  let value = 0;
  const buffer: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = alphabet.indexOf(cleaned[i]);
    if (idx === -1) {
      throw new Error('Invalid Base32 character: ' + cleaned[i]);
    }
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      buffer.push((value >> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(buffer);
}

/**
 * Generate a random 16-character Base32 secret for setup
 */
export function generateMFASecret(email: string): { secret: string; otpauthUrl: string } {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  // Generate 16 random characters
  const randomBytes = crypto.randomBytes(16);
  for (let i = 0; i < 16; i++) {
    secret += alphabet[randomBytes[i] % 32];
  }

  const issuer = 'SyncGrid';
  const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;

  return { secret, otpauthUrl };
}

/**
 * Verify a 6-digit TOTP token against a Base32 secret
 */
export function verifyTOTP(token: string, secret: string): boolean {
  try {
    const secretBuffer = decodeBase32(secret);
    const timeStep = 30; // standard 30-second window
    const currentEpoch = Math.floor(Date.now() / 1000);
    const currentCounter = Math.floor(currentEpoch / timeStep);

    // Allow clock drift of ±30s (check current, previous, and next window)
    for (let i = -1; i <= 1; i++) {
      const counter = currentCounter + i;
      const buffer = Buffer.alloc(8);

      // Write counter as 64-bit integer big-endian
      buffer.writeUInt32BE(0, 0);
      buffer.writeUInt32BE(counter, 4);

      const hmac = crypto.createHmac('sha1', secretBuffer);
      hmac.update(buffer);
      const hmacResult = hmac.digest();

      // Dynamic Truncation
      const offset = hmacResult[hmacResult.length - 1] & 0xf;
      const binary =
        ((hmacResult[offset] & 0x7f) << 24) |
        ((hmacResult[offset + 1] & 0xff) << 16) |
        ((hmacResult[offset + 2] & 0xff) << 8) |
        (hmacResult[offset + 3] & 0xff);

      const otp = (binary % 1000000).toString().padStart(6, '0');
      if (otp === token) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('TOTP validation error:', error);
    return false;
  }
}

/**
 * Generate cryptographically secure recovery codes
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    // Generate an 8-character hex code
    codes.push(crypto.randomBytes(4).toString('hex'));
  }
  return codes;
}
