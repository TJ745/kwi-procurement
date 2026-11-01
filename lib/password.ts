import "server-only";

import { hash, verify } from "@node-rs/argon2";

// Argon2id with the library defaults (19 MiB memory, 2 iterations, 1 lane),
// which match the OWASP minimum recommendation.
export function hashPassword(password: string) {
  return hash(password);
}

export function verifyPassword(passwordHash: string, password: string) {
  return verify(passwordHash, password);
}

/** Lowest minimum length that Settings > Security allows. */
export const PASSWORD_ABSOLUTE_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
/** Minimum for the .env-managed Super Admin password. */
export const PASSWORD_MIN_LENGTH = 12;
