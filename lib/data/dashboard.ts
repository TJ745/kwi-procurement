import "server-only";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const COUNTERS = {
  "/projects": { permission: "projects:view", count: () => prisma.project.count() },
  "/suppliers": { permission: "suppliers:view", count: () => prisma.supplier.count() },
  "/departments": { permission: "departments:view", count: () => prisma.department.count() },
  "/categories": { permission: "categories:view", count: () => prisma.category.count() },
} as const;

/** Record counts for the master-data modules the current user may view. */
export async function getMasterDataCounts() {
  const { can } = await requireUser();
  const entries = await Promise.all(
    Object.entries(COUNTERS)
      .filter(([, counter]) => can(counter.permission))
      .map(async ([href, counter]) => [href, await counter.count()] as const),
  );
  return new Map<string, number>(entries);
}
