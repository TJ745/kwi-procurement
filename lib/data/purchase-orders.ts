import "server-only";

import { forbidden } from "next/navigation";

import type { Prisma, PurchaseOrderStatus } from "@/lib/generated/prisma/client";
import { type ListParams, paginate } from "@/lib/data/list-params";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireUser } from "@/lib/session";
import { PURCHASE_ORDER_STATUSES } from "@/lib/validation/purchase-order";

const contains = (query: string) =>
  ({ contains: query, mode: "insensitive" }) as const;

export function parsePurchaseOrderStatus(value: string | string[] | undefined) {
  return typeof value === "string" &&
    (PURCHASE_ORDER_STATUSES as readonly string[]).includes(value)
    ? (value as PurchaseOrderStatus)
    : undefined;
}

export async function listPurchaseOrders(
  { query, page }: ListParams,
  status: PurchaseOrderStatus | undefined,
) {
  await requirePermission("purchase_orders:view");
  const where: Prisma.PurchaseOrderWhereInput = {
    ...(status && { status }),
    ...(query && {
      OR: [
        { number: contains(query) },
        { category: { name: contains(query) } },
        { supplierName: contains(query) },
        { quotationRef: contains(query) },
        { project: { OR: [{ code: contains(query) }, { name: contains(query) }] } },
        { department: { name: contains(query) } },
        { materialRequest: { number: contains(query) } },
      ],
    }),
  };
  return paginate(
    page,
    () => prisma.purchaseOrder.count({ where }),
    (args) =>
      prisma.purchaseOrder.findMany({
        where,
        orderBy: [{ orderDate: "desc" }, { number: "desc" }],
        select: {
          id: true,
          number: true,
          orderDate: true,
          status: true,
          supplierName: true,
          category: { select: { name: true } },
          currency: true,
          total: true,
          project: { select: { code: true } },
          materialRequest: { select: { number: true } },
        },
        ...args,
      }),
  );
}

export async function getPurchaseOrder(id: string) {
  await requirePermission("purchase_orders:view");
  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, code: true, name: true } },
      department: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      materialRequest: { select: { id: true, number: true } },
      createdBy: { select: { name: true } },
      lines: { orderBy: { lineNo: "asc" } },
    },
  });
}

/**
 * Dropdown options for the PO form. Suppliers include the contact details
 * copied onto a PO (never banking details). Available to anyone who can
 * create or edit POs, without needing the master-data pages.
 */
export async function getPurchaseOrderOptions() {
  const { can } = await requireUser();
  if (!can("purchase_orders:create") && !can("purchase_orders:edit")) forbidden();

  const [projects, departments, categories, suppliers] = await Promise.all([
    prisma.project.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
    prisma.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.supplier.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        address: true,
        contactName: true,
        contactNumber: true,
        contactEmail: true,
        email: true,
        telephone: true,
        vat: true,
      },
    }),
  ]);
  return {
    projects: projects.map((p) => ({ value: p.id, label: `${p.code} – ${p.name}`, name: p.name })),
    departments: departments.map((d) => ({ value: d.id, label: d.name })),
    categories: categories.map((c) => ({ value: c.id, label: c.name })),
    suppliers: suppliers.map((s) => ({
      value: s.id,
      label: s.name,
      details: {
        supplierName: s.name,
        supplierAddress: s.address ?? "",
        supplierContactName: s.contactName ?? "",
        supplierContactNumber: s.contactNumber ?? "",
        supplierEmail: s.email ?? s.contactEmail ?? "",
        supplierTelephone: s.telephone ?? "",
        supplierVat: s.vat ?? "",
      },
    })),
  };
}

export type PurchaseOrderOptions = Awaited<ReturnType<typeof getPurchaseOrderOptions>>;

/**
 * An approved MR that has no PO yet, for prefilling a new PO.
 * Returns null when the MR is missing, not approved or already used.
 */
export async function getMaterialRequestForPurchaseOrder(id: string) {
  await requirePermission("purchase_orders:create");
  const request = await prisma.materialRequest.findUnique({
    where: { id },
    include: {
      project: { select: { name: true } },
      supplier: { select: { id: true } },
      purchaseOrder: { select: { id: true } },
      lines: { orderBy: { lineNo: "asc" } },
    },
  });
  if (!request || request.status !== "APPROVED" || request.purchaseOrder) return null;
  return request;
}
