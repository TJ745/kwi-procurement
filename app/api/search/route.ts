import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import type { SearchGroup } from "@/lib/search";
import { getAuthContext } from "@/lib/session";

const LIMIT = 5;

const contains = (query: string) => ({ contains: query, mode: "insensitive" }) as const;

/**
 * Header search across everything the signed-in user may view. Each module
 * is only queried when the user's role grants its "view" permission.
 */
export async function GET(request: NextRequest) {
  const context = await getAuthContext();
  if (!context || context.user.mustChangePassword) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);
  if (query.length < 2) return Response.json({ groups: [] });

  const { can } = context;
  const q = contains(query);

  const searches: Promise<SearchGroup>[] = [];
  if (can("material_requests:view")) {
    searches.push(
      prisma.materialRequest
        .findMany({
          where: {
            OR: [
              { number: q },
              { project: { OR: [{ code: q }, { name: q }] } },
              { department: { name: q } },
              { category: { name: q } },
              { supplier: { name: q } },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: LIMIT,
          select: { id: true, number: true, project: { select: { code: true } }, department: { select: { name: true } } },
        })
        .then((rows) => ({
          label: "Material requests",
          results: rows.map((row) => ({
            id: row.id,
            title: row.number,
            subtitle: `${row.project.code} · ${row.department.name}`,
            href: `/material-requests/${row.id}`,
          })),
        })),
    );
  }
  if (can("projects:view")) {
    searches.push(
      prisma.project
        .findMany({ where: { OR: [{ code: q }, { name: q }] }, orderBy: { code: "asc" }, take: LIMIT })
        .then((rows) => ({
          label: "Projects",
          results: rows.map((row) => ({
            id: row.id,
            title: `${row.code} – ${row.name}`,
            href: `/projects?q=${encodeURIComponent(row.code)}`,
          })),
        })),
    );
  }
  if (can("suppliers:view")) {
    searches.push(
      prisma.supplier
        .findMany({
          where: { OR: [{ name: q }, { vat: q }, { cr: q }, { contactName: q }] },
          orderBy: { name: "asc" },
          take: LIMIT,
          select: { id: true, name: true, vat: true },
        })
        .then((rows) => ({
          label: "Suppliers",
          results: rows.map((row) => ({
            id: row.id,
            title: row.name,
            subtitle: row.vat ? `VAT ${row.vat}` : undefined,
            href: `/suppliers/${row.id}`,
          })),
        })),
    );
  }
  if (can("departments:view")) {
    searches.push(
      prisma.department
        .findMany({ where: { name: q }, orderBy: { name: "asc" }, take: LIMIT })
        .then((rows) => ({
          label: "Departments",
          results: rows.map((row) => ({
            id: row.id,
            title: row.name,
            href: `/departments?q=${encodeURIComponent(row.name)}`,
          })),
        })),
    );
  }
  if (can("categories:view")) {
    searches.push(
      prisma.category
        .findMany({ where: { name: q }, orderBy: { name: "asc" }, take: LIMIT })
        .then((rows) => ({
          label: "Categories",
          results: rows.map((row) => ({
            id: row.id,
            title: row.name,
            href: `/categories?q=${encodeURIComponent(row.name)}`,
          })),
        })),
    );
  }

  const groups = (await Promise.all(searches)).filter((group) => group.results.length > 0);
  return Response.json({ groups }, { headers: { "Cache-Control": "private, no-store" } });
}
