import crypto from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(crypto.scrypt);

export interface HashResult {
  hash: string;
  salt: string;
}

/**
 * Non-blocking asynchronous password hashing using Node.js scrypt.
 */
export async function hashPasswordAsync(password: string): Promise<HashResult> {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return { hash: derivedKey.toString("hex"), salt };
}

/**
 * Non-blocking asynchronous password verification with timingSafeEqual.
 */
export async function verifyPasswordAsync(
  password: string,
  storedHash: string,
  salt: string
): Promise<boolean> {
  try {
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    const storedBuffer = Buffer.from(storedHash, "hex");

    if (storedBuffer.length !== derivedKey.length) {
      return false;
    }

    return crypto.timingSafeEqual(storedBuffer, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Synchronous password hashing for legacy/sync calls.
 */
export function hashPassword(password: string): HashResult {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

/**
 * Synchronous password verification for legacy/sync calls.
 */
export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  try {
    const computedHash = crypto.scryptSync(password, salt, 64).toString("hex");
    const storedBuffer = Buffer.from(storedHash, "hex");
    const computedBuffer = Buffer.from(computedHash, "hex");

    if (storedBuffer.length !== computedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(storedBuffer, computedBuffer);
  } catch {
    return false;
  }
}
