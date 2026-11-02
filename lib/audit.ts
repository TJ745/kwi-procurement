import "server-only";

import { headers } from "next/headers";

import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type AuditChange = { field: string; label: string; from: string | null; to: string | null };

/** A record as people read it: display label plus labelled, formatted fields. */
export type Snapshot = {
  label: string;
  fields: Record<string, { label: string; value: string | null }>;
};

export type AuditActor = { id: string | null; name: string | null; email: string | null };

export type AuditEntry = {
  actor: AuditActor;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  summary: string;
  changes?: AuditChange[];
  ipAddress?: string | null;
  userAgent?: string | null;
};

/** Client IP and browser for the current request (best effort). */
export async function requestMeta(source?: Headers) {
  try {
    const h = source ?? (await headers());
    const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
    return {
      ipAddress: (forwarded || h.get("x-real-ip") || null)?.slice(0, 64) ?? null,
      userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
    };
  } catch {
    return { ipAddress: null, userAgent: null };
  }
}

/**
 * Appends an audit entry. Never throws: the change it describes has already
 * happened, so a failed write is reported to the server log instead.
 */
export async function writeAudit(entry: AuditEntry) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actor.id,
        actorName: entry.actor.name,
        actorEmail: entry.actor.email,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        entityLabel: entry.entityLabel ?? null,
        summary: entry.summary.slice(0, 500),
        changes: entry.changes?.length ? (entry.changes as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
      },
    });
  } catch (error) {
    console.error("Audit log write failed", { action: entry.action, entityType: entry.entityType, entityId: entry.entityId }, error);
  }
}

/** Field-level differences between two snapshots (either may be null for create/delete). */
export function diffSnapshots(before: Snapshot | null, after: Snapshot | null): AuditChange[] {
  const keys = [...new Set([...Object.keys(before?.fields ?? {}), ...Object.keys(after?.fields ?? {})])];
  const changes: AuditChange[] = [];
  for (const key of keys) {
    const from = before?.fields[key]?.value ?? null;
    const to = after?.fields[key]?.value ?? null;
    if (from === to) continue;
    // On create/delete, skip fields that are simply empty.
    if (!before && !to) continue;
    if (!after && !from) continue;
    changes.push({ field: key, label: after?.fields[key]?.label ?? before?.fields[key]?.label ?? key, from, to });
  }
  return changes;
}
