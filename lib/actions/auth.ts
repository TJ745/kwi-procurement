"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requestMeta, writeAudit } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { getAuthContext } from "@/lib/session";

export async function signOutAction() {
  const context = await getAuthContext();
  if (context) {
    const { user } = context;
    await writeAudit({
      actor: { id: user.id, name: user.name, email: user.email },
      action: "sign_out",
      entityType: "auth",
      entityId: user.id,
      entityLabel: user.email,
      summary: "Signed out",
      ...(await requestMeta()),
    });
  }
  await auth.api.signOut({ headers: await headers() });
  redirect("/sign-in");
}
