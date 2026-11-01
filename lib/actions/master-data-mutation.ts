import "server-only";

import { refresh } from "next/cache";
import type { z } from "zod";

import type { ActionResult } from "@/lib/action-result";
import { Prisma } from "@/lib/generated/prisma/client";
import { canManageMasterData } from "@/lib/permissions";
import { getSession } from "@/lib/session";

type MutationOptions<S extends z.ZodType> = {
  schema: S;
  input: unknown;
  run: (data: z.output<S>) => Promise<unknown>;
  success: string;
  /** The field covered by a unique constraint, for duplicate errors. */
  unique?: { field: string; message: string };
  /** Set to false when the client navigates away after success. */
  refreshPage?: boolean;
};

/**
 * Runs a master-data write: verifies the session and role on the server,
 * validates the input with Zod, maps database errors to user-facing
 * messages and refreshes the page on success.
 */
export async function masterDataMutation<S extends z.ZodType>({
  schema,
  input,
  run,
  success,
  unique,
  refreshPage = true,
}: MutationOptions<S>): Promise<ActionResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, message: "Your session has expired. Please sign in again." };
  }
  if (!canManageMasterData(session.user.role)) {
    return { ok: false, message: "You do not have permission to change master data." };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "");
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { ok: false, message: "Please correct the highlighted fields.", fieldErrors };
  }

  try {
    await run(parsed.data);
  } catch (error) {
    return toErrorResult(error, unique);
  }

  if (refreshPage) refresh();
  return { ok: true, message: success };
}

function toErrorResult(
  error: unknown,
  unique: MutationOptions<z.ZodType>["unique"],
): ActionResult {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002" && unique) {
      return {
        ok: false,
        message: unique.message,
        fieldErrors: { [unique.field]: unique.message },
      };
    }
    if (error.code === "P2025") {
      return { ok: false, message: "This record no longer exists. Refresh the page." };
    }
    if (error.code === "P2003") {
      return { ok: false, message: "This record is in use and cannot be deleted." };
    }
  }
  console.error(error);
  return { ok: false, message: "Something went wrong. Please try again." };
}
