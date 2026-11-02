import "server-only";

import type { Prisma } from "@/lib/generated/prisma/client";
import { type ListParams, paginate } from "@/lib/data/list-params";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";

const contains = (query: string) =>
  ({ contains: query, mode: "insensitive" }) as const;

export async function listProjects({ query, page, pageSize }: ListParams) {
  await requirePermission("projects:view");
  const where: Prisma.ProjectWhereInput = query
    ? { OR: [{ code: contains(query) }, { name: contains(query) }] }
    : {};
  return paginate(
    { page, pageSize },
    () => prisma.project.count({ where }),
    (args) => prisma.project.findMany({ where, orderBy: { code: "asc" }, ...args }),
  );
}

export async function listDepartments({ query, page, pageSize }: ListParams) {
  await requirePermission("departments:view");
  const where: Prisma.DepartmentWhereInput = query
    ? { name: contains(query) }
    : {};
  return paginate(
    { page, pageSize },
    () => prisma.department.count({ where }),
    (args) =>
      prisma.department.findMany({ where, orderBy: { name: "asc" }, ...args }),
  );
}

export async function listCategories({ query, page, pageSize }: ListParams) {
  await requirePermission("categories:view");
  const where: Prisma.CategoryWhereInput = query
    ? { name: contains(query) }
    : {};
  return paginate(
    { page, pageSize },
    () => prisma.category.count({ where }),
    (args) =>
      prisma.category.findMany({ where, orderBy: { name: "asc" }, ...args }),
  );
}

/** Reads `?term=CASH|CREDIT`; anything else means "all". */
export function parseSupplierTerm(value: string | string[] | undefined) {
  return value === "CASH" || value === "CREDIT" ? value : undefined;
}

export async function listSuppliers(
  { query, page, pageSize }: ListParams,
  term?: "CASH" | "CREDIT",
) {
  await requirePermission("suppliers:view");
  const where: Prisma.SupplierWhereInput = {
    ...(term && { paymentTerm: term }),
    ...(query && {
      OR: [
        { name: contains(query) },
        { vat: contains(query) },
        { cr: contains(query) },
        { contactName: contains(query) },
        { email: contains(query) },
        { contactEmail: contains(query) },
      ],
    }),
  };
  return paginate(
    { page, pageSize },
    () => prisma.supplier.count({ where }),
    (args) =>
      prisma.supplier.findMany({ where, orderBy: { name: "asc" }, ...args }),
  );
}

export async function getSupplier(id: string) {
  await requirePermission("suppliers:view");
  return prisma.supplier.findUnique({ where: { id } });
}
