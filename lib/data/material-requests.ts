import "server-only";

import { forbidden } from "next/navigation";

import type { MaterialRequestStatus, Prisma } from "@/lib/generated/prisma/client";
import { type ListParams, paginate } from "@/lib/data/list-params";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireUser } from "@/lib/session";
import { MATERIAL_REQUEST_STATUSES } from "@/lib/validation/material-request";

const contains = (query: string) =>
  ({ contains: query, mode: "insensitive" }) as const;

export function parseStatusFilter(value: string | string[] | undefined) {
  return typeof value === "string" &&
    (MATERIAL_REQUEST_STATUSES as readonly string[]).includes(value)
    ? (value as MaterialRequestStatus)
    : undefined;
}

export async function listMaterialRequests(
  { query, page }: ListParams,
  status: MaterialRequestStatus | undefined,
) {
  await requirePermission("material_requests:view");
  const where: Prisma.MaterialRequestWhereInput = {
    ...(status && { status }),
    ...(query && {
      OR: [
        { number: contains(query) },
        { project: { OR: [{ code: contains(query) }, { name: contains(query) }] } },
        { department: { name: contains(query) } },
        { category: { name: contains(query) } },
        { supplier: { name: contains(query) } },
      ],
    }),
  };
  return paginate(
    page,
    () => prisma.materialRequest.count({ where }),
    (args) =>
      prisma.materialRequest.findMany({
        where,
        orderBy: [{ requestDate: "desc" }, { number: "desc" }],
        select: {
          id: true,
          number: true,
          requestDate: true,
          status: true,
          project: { select: { code: true, name: true } },
          department: { select: { name: true } },
          category: { select: { name: true } },
          _count: { select: { lines: true } },
        },
        ...args,
      }),
  );
}

export async function getMaterialRequest(id: string) {
  await requirePermission("material_requests:view");
  return prisma.materialRequest.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, code: true, name: true } },
      department: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      supplier: { select: { id: true, name: true } },
      createdBy: { select: { name: true } },
      purchaseOrder: { select: { id: true, number: true } },
      lines: { orderBy: { lineNo: "asc" } },
    },
  });
}

/**
 * Dropdown options for the request form. Available to anyone who can create
 * or edit requests, even without access to the master-data pages; only ids
 * and display names are returned.
 */
export async function getMaterialRequestOptions() {
  const { can } = await requireUser();
  if (!can("material_requests:create") && !can("material_requests:edit")) forbidden();

  const [projects, departments, categories, suppliers] = await Promise.all([
    prisma.project.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
    prisma.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return {
    projects: projects.map((p) => ({ value: p.id, label: `${p.code} – ${p.name}` })),
    departments: departments.map((d) => ({ value: d.id, label: d.name })),
    categories: categories.map((c) => ({ value: c.id, label: c.name })),
    suppliers: suppliers.map((s) => ({ value: s.id, label: s.name })),
  };
}

export type MaterialRequestOptions = Awaited<ReturnType<typeof getMaterialRequestOptions>>;
