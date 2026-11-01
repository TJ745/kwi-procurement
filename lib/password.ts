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

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;
