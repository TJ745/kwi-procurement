import "server-only";

import type { Prisma } from "@/lib/generated/prisma/client";
import { type ListParams, paginate } from "@/lib/data/list-params";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/session";

const contains = (query: string) =>
  ({ contains: query, mode: "insensitive" }) as const;

export async function listUsers({ query, page, pageSize }: ListParams) {
  await requireSuperAdmin();
  const where: Prisma.UserWhereInput = query
    ? {
        OR: [
          { name: contains(query) },
          { email: contains(query) },
          { customRole: { name: contains(query) } },
        ],
      }
    : {};
  return paginate(
    { page, pageSize },
    () => prisma.user.count({ where }),
    (args) =>
      prisma.user.findMany({
        where,
        // "super_admin" sorts before "user": Super Admin first, then active
        // users, then by name.
        orderBy: [{ role: "asc" }, { active: "desc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          roleId: true,
          active: true,
          mustChangePassword: true,
          createdAt: true,
          customRole: { select: { name: true } },
        },
        ...args,
      }),
  );
}

export async function listRoleOptions() {
  await requireSuperAdmin();
  const roles = await prisma.role.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return roles.map((role) => ({ value: role.id, label: role.name }));
}

export async function listRoles({ query, page, pageSize }: ListParams) {
  await requireSuperAdmin();
  const where: Prisma.RoleWhereInput = query ? { name: contains(query) } : {};
  return paginate(
    { page, pageSize },
    () => prisma.role.count({ where }),
    (args) =>
      prisma.role.findMany({
        where,
        orderBy: { name: "asc" },
        include: { _count: { select: { users: true } } },
        ...args,
      }),
  );
}

export async function getEditableSettings() {
  await requireSuperAdmin();
  const [settings, sequences] = await Promise.all([
    prisma.appSettings.findUnique({
      where: { id: 1 },
      omit: { companyLogo: true, printFooter: true },
    }),
    prisma.documentSequence.findMany(),
  ]);
  return { settings, sequences };
}
