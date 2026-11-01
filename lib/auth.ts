import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  hashPassword,
  verifyPassword,
} from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/roles";

export const auth = betterAuth({
  appName: "Procurement Management",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    // No public registration. Accounts are provisioned by an administrator
    // (the first Super Admin via `npm run create-super-admin`).
    disableSignUp: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: PASSWORD_MAX_LENGTH,
    password: {
      hash: hashPassword,
      verify: ({ hash, password }) => verifyPassword(hash, password),
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: ROLES.USER,
        // Never accept a role from client input on any Better Auth endpoint.
        input: false,
      },
    },
  },
  rateLimit: {
    // Shared across serverless instances, unlike the in-memory default.
    storage: "database",
  },
  // Must be the last plugin so Server Actions can set auth cookies.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
