import "server-only";

import type { MaterialRequestStatus, Prisma } from "@/lib/generated/prisma/client";
import { ROLES } from "@/lib/roles";
import { MATERIAL_REQUEST_STATUS_LABELS } from "@/lib/validation/material-request";

/**
 * Notification rules (agreed with the business):
 * - New material request      → approvers + Super Admin
 * - Request set to Submitted  → approvers + Super Admin
 * - Request status changed    → the request's creator
 * "Approvers" are active users whose role has `material_requests:status`.
 * The person who performed the action is never notified, and each user gets
 * at most one notification per event.
 */

type Actor = { id: string; name: string };
type Draft = Omit<Prisma.NotificationCreateManyInput, "id" | "createdAt" | "readAt">;

async function approverIds(tx: Prisma.TransactionClient) {
  const users = await tx.user.findMany({
    where: {
      active: true,
      OR: [
        { role: ROLES.SUPER_ADMIN },
        { customRole: { permissions: { has: "material_requests:status" } } },
      ],
    },
    select: { id: true },
  });
  return users.map((user) => user.id);
}

async function send(tx: Prisma.TransactionClient, drafts: Map<string, Draft>, actor: Actor) {
  drafts.delete(actor.id);
  if (drafts.size > 0) await tx.notification.createMany({ data: [...drafts.values()] });
}

const href = (requestId: string) => `/material-requests/${requestId}`;

export async function notifyMaterialRequestCreated(
  tx: Prisma.TransactionClient,
  request: { id: string; number: string },
  actor: Actor,
) {
  const drafts = new Map<string, Draft>();
  for (const userId of await approverIds(tx)) {
    drafts.set(userId, {
      userId,
      type: "material_request.created",
      title: "New material request",
      body: `${request.number} was created by ${actor.name}.`,
      href: href(request.id),
    });
  }
  await send(tx, drafts, actor);
}

export async function notifyMaterialRequestStatusChanged(
  tx: Prisma.TransactionClient,
  request: { id: string; number: string; createdById: string },
  status: MaterialRequestStatus,
  actor: Actor,
) {
  const label = MATERIAL_REQUEST_STATUS_LABELS[status];
  const drafts = new Map<string, Draft>();
  if (status === "SUBMITTED") {
    for (const userId of await approverIds(tx)) {
      drafts.set(userId, {
        userId,
        type: "material_request.submitted",
        title: "Material request submitted",
        body: `${request.number} was submitted by ${actor.name} and awaits approval.`,
        href: href(request.id),
      });
    }
  }
  // The creator's own update takes precedence over the approver message.
  drafts.set(request.createdById, {
    userId: request.createdById,
    type: "material_request.status_changed",
    title: `Material request ${label.toLowerCase()}`,
    body: `${actor.name} changed ${request.number} to ${label}.`,
    href: href(request.id),
  });
  await send(tx, drafts, actor);
}
