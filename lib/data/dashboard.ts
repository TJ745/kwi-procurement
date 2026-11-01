import "server-only";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function getMasterDataCounts() {
  await requireUser();

  const [projects, suppliers, departments, categories] = await Promise.all([
    prisma.project.count(),
    prisma.supplier.count(),
    prisma.department.count(),
    prisma.category.count(),
  ]);

  return {
    "/projects": projects,
    "/suppliers": suppliers,
    "/departments": departments,
    "/categories": categories,
  } satisfies Record<string, number>;
}
