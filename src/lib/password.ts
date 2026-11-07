import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";

const PREFIX = "scrypt$";

export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plain, salt, 32).toString("hex");
  return `${PREFIX}${salt}$${hash}`;
}

export function isHashedPassword(value: string): boolean {
  return value.startsWith(PREFIX);
}

/** Verify plaintext against hashed or legacy plaintext (migrates callers separately). */
export function verifyPassword(plain: string, stored: string): boolean {
  if (!stored) return false;
  if (!isHashedPassword(stored)) {
    const a = Buffer.from(plain);
    const b = Buffer.from(stored);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }
  const parts = stored.split("$");
  if (parts.length !== 3) return false;
  const salt = parts[1];
  const expected = parts[2];
  const actual = scryptSync(plain, salt, 32).toString("hex");
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function fingerprintSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex").slice(0, 12);
}
