import "server-only";

import { headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/roles";

/**
 * Returns the verified session for the current request, or null.
 * Better Auth validates the session token against the database on every
 * call (cookie caching is not enabled), so `user.role` reflects the stored
 * user record rather than anything supplied by the browser.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** Requires a signed-in user; otherwise redirects to the sign-in page. */
export async function requireUser() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }
  return session;
}

/** Requires a Super Admin; otherwise renders the 403 page. */
export async function requireSuperAdmin() {
  const session = await requireUser();
  if (!isSuperAdmin(session.user.role)) {
    forbidden();
  }
  return session;
}
