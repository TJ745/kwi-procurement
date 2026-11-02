import "server-only";

import { forbidden } from "next/navigation";

import type { GoodsReceiptStatus, Prisma } from "@/lib/generated/prisma/client";
import { GRN_STATUSES, RECEIVABLE_PO_STATUSES, outstandingQuantity } from "@/lib/grn";
import { type ListParams, paginate } from "@/lib/data/list-params";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireUser } from "@/lib/session";

const contains = (query: string) =>
  ({ contains: query, mode: "insensitive" }) as const;

type Client = Pick<Prisma.TransactionClient, "goodsReceiptLine">;

/**
 * Quantity already accepted per PO line on this PO's other GRNs
 * (rejected GRNs don't count), keyed by purchaseOrderLineId.
 */
export async function acceptedBefore(client: Client, purchaseOrderId: string, excludeGrnId?: string) {
  const rows = await client.goodsReceiptLine.groupBy({
    by: ["purchaseOrderLineId"],
    where: {
      goodsReceipt: {
        purchaseOrderId,
        status: { not: "REJECTED" },
        ...(excludeGrnId && { id: { not: excludeGrnId } }),
      },
    },
    _sum: { acceptedQty: true },
  });
  return new Map(rows.map((row) => [row.purchaseOrderLineId, row._sum.acceptedQty?.toString() ?? "0"]));
}

export function parseGrnStatus(value: string | string[] | undefined) {
  return typeof value === "string" && (GRN_STATUSES as readonly string[]).includes(value)
    ? (value as GoodsReceiptStatus)
    : undefined;
}

export async function listGrns({ query, page }: ListParams, status: GoodsReceiptStatus | undefined) {
  await requirePermission("grns:view");
  const where: Prisma.GoodsReceiptWhereInput = {
    ...(status && { status }),
    ...(query && {
      OR: [
        { number: contains(query) },
        { supplierName: contains(query) },
        { invoiceNo: contains(query) },
        { purchaseOrder: { number: contains(query) } },
        { purchaseOrder: { materialRequest: { number: contains(query) } } },
        { project: { OR: [{ code: contains(query) }, { name: contains(query) }] } },
      ],
    }),
  };
  return paginate(
    page,
    () => prisma.goodsReceipt.count({ where }),
    (args) =>
      prisma.goodsReceipt.findMany({
        where,
        orderBy: [{ receiptDate: "desc" }, { number: "desc" }],
        select: {
          id: true,
          number: true,
          receiptDate: true,
          status: true,
          supplierName: true,
          deliveredBy: true,
          project: { select: { code: true } },
          purchaseOrder: { select: { number: true } },
          _count: { select: { lines: true } },
        },
        ...args,
      }),
  );
}

export async function getGrn(id: string) {
  await requirePermission("grns:view");
  return prisma.goodsReceipt.findUnique({
    where: { id },
    include: {
      project: { select: { code: true, name: true } },
      department: { select: { id: true, name: true } },
      purchaseOrder: {
        select: { id: true, number: true, materialRequest: { select: { id: true, number: true } } },
      },
      createdBy: { select: { name: true } },
      lines: { orderBy: { lineNo: "asc" }, include: { department: { select: { name: true } } } },
    },
  });
}

/** Department options for the GRN form. */
export async function getGrnOptions() {
  const { can } = await requireUser();
  if (!can("grns:create") && !can("grns:edit")) forbidden();
  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return { departments: departments.map((d) => ({ value: d.id, label: d.name })) };
}

export type GrnSourceLine = {
  purchaseOrderLineId: string;
  lineNo: number;
  description: string;
  unit: string;
  orderedQty: string;
  outstandingQty: string;
};

/**
 * A receivable PO (Approved or Issued) with its lines and what is still
 * outstanding on each, for a new GRN or an edit (excluding that GRN).
 * Null when the PO is missing or not receivable.
 */
export async function getPurchaseOrderForGrn(purchaseOrderId: string, excludeGrnId?: string) {
  const order = await prisma.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    select: {
      id: true,
      number: true,
      status: true,
      projectId: true,
      departmentId: true,
      supplierName: true,
      supplierAddress: true,
      project: { select: { code: true, name: true } },
      materialRequest: { select: { number: true } },
      lines: { orderBy: { lineNo: "asc" } },
    },
  });
  if (!order) return null;
  if (!excludeGrnId && !(RECEIVABLE_PO_STATUSES as readonly string[]).includes(order.status)) return null;
  const accepted = await acceptedBefore(prisma, purchaseOrderId, excludeGrnId);
  const lines: GrnSourceLine[] = order.lines.map((line) => ({
    purchaseOrderLineId: line.id,
    lineNo: line.lineNo,
    description: line.name,
    unit: line.unit,
    orderedQty: line.quantity.toString(),
    outstandingQty: outstandingQuantity(line.quantity.toString(), accepted.get(line.id) ?? "0"),
  }));
  return { ...order, lines };
}

/** GRNs raised against a PO, for its detail page (empty without access). */
export async function listGrnsForPurchaseOrder(purchaseOrderId: string) {
  const { can } = await requireUser();
  if (!can("grns:view")) return [];
  return prisma.goodsReceipt.findMany({
    where: { purchaseOrderId },
    orderBy: { createdAt: "asc" },
    select: { id: true, number: true, receiptDate: true, status: true, _count: { select: { lines: true } } },
  });
}
