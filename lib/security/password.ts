import { hash, compare } from '@node-rs/bcrypt';

const PASSWORD_COST = 10;

export async function hashPassword(password: string) {
  return hash(password, PASSWORD_COST);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

export function isAccountLocked(user: { lockUntil?: Date | null }) {
  return Boolean(user.lockUntil && user.lockUntil.getTime() > Date.now());
}
