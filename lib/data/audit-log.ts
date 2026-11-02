import "server-only";

import type { Prisma } from "@/lib/generated/prisma/client";
import type { AuditChange } from "@/lib/audit";
import { AUDIT_ACTION_LABELS, AUDIT_ENTITY_LABELS, AUDIT_PERIODS } from "@/lib/audit-labels";
import { type ListParams, type SearchParams, paginate } from "@/lib/data/list-params";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/session";

export const AUDIT_PAGE_SIZE = 50;

export type AuditFilters = { entity?: string; action?: string; period?: string };

/** Reads `?entity=&action=&period=`; unknown values are ignored. */
export function parseAuditFilters(searchParams: SearchParams): AuditFilters {
  const pick = (value: string | string[] | undefined, allowed: Record<string, unknown>) =>
    typeof value === "string" && value in allowed ? value : undefined;
  return {
    entity: pick(searchParams.entity, AUDIT_ENTITY_LABELS),
    action: pick(searchParams.action, AUDIT_ACTION_LABELS),
    period: pick(searchParams.period, AUDIT_PERIODS),
  };
}

const contains = (query: string) => ({ contains: query, mode: "insensitive" }) as const;

/** Audit entries, newest first (Super Admin only). */
export async function listAuditLog({ query, page, pageSize }: ListParams, filters: AuditFilters) {
  await requireSuperAdmin();
  const days = filters.period ? AUDIT_PERIODS[filters.period].days : undefined;
  const where: Prisma.AuditLogWhereInput = {
    ...(filters.entity && { entityType: filters.entity }),
    ...(filters.action && { action: filters.action }),
    ...(days && { createdAt: { gte: new Date(Date.now() - days * 86_400_000) } }),
    ...(query && {
      OR: [
        { summary: contains(query) },
        { entityLabel: contains(query) },
        { actorName: contains(query) },
        { actorEmail: contains(query) },
        { ipAddress: contains(query) },
      ],
    }),
  };
  const result = await paginate(
    { page, pageSize: pageSize ?? AUDIT_PAGE_SIZE },
    () => prisma.auditLog.count({ where }),
    (args) => prisma.auditLog.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], ...args }),
  );
  return {
    ...result,
    items: result.items.map((item) => ({
      ...item,
      changes: Array.isArray(item.changes) ? (item.changes as unknown as AuditChange[]) : [],
    })),
  };
}
