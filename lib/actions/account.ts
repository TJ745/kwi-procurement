"use server";

import type { ActionResult } from "@/lib/action-result";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { changePasswordSchema } from "@/lib/validation/admin";

/**
 * Changes the signed-in user's own password. Also used for the forced change
 * after an administrator assigns a temporary password, so it deliberately
 * does not require mustChangePassword to be false.
 */
export async function changeOwnPassword(input: unknown): Promise<ActionResult> {
  const context = await getAuthContext();
  if (!context) {
    return { ok: false, message: "Your session has expired. Please sign in again." };
  }
  if (context.isSuperAdmin) {
    return {
      ok: false,
      message: "The Super Admin password is managed in .env. Update it there and run npm run sync-super-admin.",
    };
  }

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "");
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { ok: false, message: "Please correct the highlighted fields.", fieldErrors };
  }
  const { currentPassword, newPassword } = parsed.data;

  const { minPasswordLength } = await getSettings();
  if (newPassword.length < minPasswordLength) {
    const message = `Password must be at least ${minPasswordLength} characters.`;
    return { ok: false, message, fieldErrors: { newPassword: message } };
  }

  const credential = await prisma.account.findFirst({
    where: { userId: context.user.id, providerId: "credential" },
    select: { id: true, password: true },
  });
  if (!credential?.password || !(await verifyPassword(credential.password, currentPassword))) {
    const message = "Current password is incorrect.";
    return { ok: false, message, fieldErrors: { currentPassword: message } };
  }

  await prisma.$transaction([
    prisma.account.update({
      where: { id: credential.id },
      data: { password: await hashPassword(newPassword) },
    }),
    prisma.user.update({
      where: { id: context.user.id },
      data: { mustChangePassword: false },
    }),
    // Keep this session; sign out everywhere else.
    prisma.session.deleteMany({
      where: { userId: context.user.id, token: { not: context.sessionToken } },
    }),
  ]);

  return { ok: true, message: "Password changed." };
}
