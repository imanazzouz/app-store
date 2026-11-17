import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * Password hashing with Node's built-in scrypt (no external dependency).
 * Stored format: "<16-byte salt hex>:<64-byte derived key hex>".
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const key = scryptSync(password, salt, 64);
  return `${salt}:${key.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, keyHex] = (stored || '').split(':');
  if (!salt || !keyHex) return false;
  const expected = Buffer.from(keyHex, 'hex');
  const actual = scryptSync(password, salt, 64);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
