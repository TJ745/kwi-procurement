import "server-only";

import { refresh } from "next/cache";
import type { z } from "zod";

import type { ActionResult } from "@/lib/action-result";
import { Prisma } from "@/lib/generated/prisma/client";
import type { Permission } from "@/lib/permissions";
import { type AuthContext, authorizeAction } from "@/lib/session";

/** Thrown from a mutation to return a specific message to the user. */
export class ActionError extends Error {
  constructor(
    message: string,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

type MutationOptions<S extends z.ZodType> = {
  /** Permission required, "super_admin" for administration, or "signed_in". */
  requirement: Permission | "super_admin" | "signed_in";
  schema: S;
  input: unknown;
  run: (data: z.output<S>, context: AuthContext) => Promise<unknown>;
  success: string;
  /** The field covered by a unique constraint, for duplicate errors. */
  unique?: { field: string; message: string };
  /** Set to false when the client navigates away after success. */
  refreshPage?: boolean;
};

/**
 * Runs a write from a Server Action: verifies the session, account status
 * and permission on the server, validates the input with Zod, maps errors to
 * user-facing messages and refreshes the page on success.
 */
export async function runMutation<S extends z.ZodType>({
  requirement,
  schema,
  input,
  run,
  success,
  unique,
  refreshPage = true,
}: MutationOptions<S>): Promise<ActionResult> {
  const authorization = await authorizeAction(requirement);
  if (!authorization.ok) return authorization.result;

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      // Full path, e.g. "lines.2.quantity", so nested fields get their own error.
      const field = issue.path.map(String).join(".");
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { ok: false, message: "Please correct the highlighted fields.", fieldErrors };
  }

  let value: unknown;
  try {
    value = await run(parsed.data, authorization.context);
  } catch (error) {
    return toErrorResult(error, unique);
  }

  if (refreshPage) refresh();
  const id =
    typeof value === "object" && value !== null && "id" in value && typeof value.id === "string"
      ? value.id
      : undefined;
  return { ok: true, message: success, ...(id && { id }) };
}

function toErrorResult(
  error: unknown,
  unique: MutationOptions<z.ZodType>["unique"],
): ActionResult {
  if (error instanceof ActionError) {
    return { ok: false, message: error.message, fieldErrors: error.fieldErrors };
  }
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
