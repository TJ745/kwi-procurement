import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";

import {
  PASSWORD_ABSOLUTE_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  hashPassword,
  verifyPassword,
} from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/roles";

/** Upper bound for the configurable session duration (Settings > Security). */
export const MAX_SESSION_HOURS = 24 * 30;

export const auth = betterAuth({
  appName: "Procurement Management",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    // No public registration. Accounts are created by the Super Admin in
    // Users; the Super Admin itself via `npm run sync-super-admin`.
    disableSignUp: true,
    // Lowest value the setting allows; the configured minimum is enforced by
    // the app's own password actions.
    minPasswordLength: PASSWORD_ABSOLUTE_MIN_LENGTH,
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
  session: {
    // The cookie lives for the maximum; each session's real lifetime is set
    // from Settings when it is created and is not extended by activity.
    expiresIn: MAX_SESSION_HOURS * 60 * 60,
    disableSessionRefresh: true,
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const [user, settings] = await Promise.all([
            prisma.user.findUnique({
              where: { id: session.userId },
              select: { active: true },
            }),
            prisma.appSettings.findUnique({
              where: { id: 1 },
              select: { sessionDurationHours: true },
            }),
          ]);
          if (!user?.active) {
            throw new APIError("FORBIDDEN", {
              message: "This account has been deactivated.",
            });
          }
          const hours = Math.min(settings?.sessionDurationHours ?? 168, MAX_SESSION_HOURS);
          return {
            data: { ...session, expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000) },
          };
        },
      },
    },
  },
  // Account changes go through the app's own Server Actions, which apply the
  // configured password policy and permission checks.
  disabledPaths: [
    "/update-user",
    "/change-email",
    "/change-password",
    "/set-password",
    "/delete-user",
    "/request-password-reset",
    "/reset-password",
  ],
  rateLimit: {
    // Shared across serverless instances, unlike the in-memory default.
    storage: "database",
  },
  // Must be the last plugin so Server Actions can set auth cookies.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
