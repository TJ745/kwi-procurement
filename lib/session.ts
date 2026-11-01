import "server-only";

import { headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { cache } from "react";

import type { ActionResult } from "@/lib/action-result";
import { auth } from "@/lib/auth";
import { createDateFormatter } from "@/lib/format";
import { ALL_PERMISSIONS, type Permission, normalizePermissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/roles";
import { getSettings } from "@/lib/settings";

/**
 * Returns the verified session for the current request, or null.
 * Better Auth validates the session token against the database on every
 * call (cookie caching is not enabled).
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export type AuthContext = NonNullable<Awaited<ReturnType<typeof getAuthContext>>>;

/**
 * The signed-in user as stored in the database, with their effective
 * permissions. Returns null when signed out or when the account is
 * deactivated. Never derived from anything the browser sends besides the
 * session cookie.
 */
export const getAuthContext = cache(async () => {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      mustChangePassword: true,
      customRole: { select: { name: true, permissions: true } },
    },
  });
  if (!user?.active) return null;

  const superAdmin = isSuperAdmin(user.role);
  const permissions = new Set<Permission>(
    superAdmin ? ALL_PERMISSIONS : normalizePermissions(user.customRole?.permissions ?? []),
  );
  const settings = await getSettings();

  return {
    user,
    sessionToken: session.session.token,
    isSuperAdmin: superAdmin,
    roleLabel: superAdmin ? "Super Admin" : (user.customRole?.name ?? "No role"),
    can: (permission: Permission) => permissions.has(permission),
    settings,
    formatDate: createDateFormatter(settings),
  };
});

/** Requires a signed-in, active user who has set their own password. */
export async function requireUser() {
  const context = await getAuthContext();
  if (!context) redirect("/sign-in");
  if (context.user.mustChangePassword) redirect("/change-password");
  return context;
}

/** Like requireUser, but allows users who must still change their password. */
export async function requireUserForPasswordChange() {
  const context = await getAuthContext();
  if (!context) redirect("/sign-in");
  return context;
}

/** Requires the given permission; otherwise renders the 403 page. */
export async function requirePermission(permission: Permission) {
  const context = await requireUser();
  if (!context.can(permission)) forbidden();
  return context;
}

/** Requires the Super Admin; otherwise renders the 403 page. */
export async function requireSuperAdmin() {
  const context = await requireUser();
  if (!context.isSuperAdmin) forbidden();
  return context;
}

type ActionAuthorization =
  | { ok: true; context: AuthContext }
  | { ok: false; result: ActionResult };

/**
 * Authorization for Server Actions, which return errors instead of
 * redirecting. Pass a permission, or "super_admin" for administration.
 */
export async function authorizeAction(
  requirement: Permission | "super_admin",
): Promise<ActionAuthorization> {
  const context = await getAuthContext();
  if (!context) {
    return { ok: false, result: { ok: false, message: "Your session has expired. Please sign in again." } };
  }
  if (context.user.mustChangePassword) {
    return { ok: false, result: { ok: false, message: "Change your temporary password before continuing." } };
  }
  const allowed =
    requirement === "super_admin" ? context.isSuperAdmin : context.can(requirement);
  if (!allowed) {
    return { ok: false, result: { ok: false, message: "You do not have permission to perform this action." } };
  }
  return { ok: true, context };
}
