import "server-only";

import { forbidden } from "next/navigation";

import type { PaymentRequestStatus, Prisma } from "@/lib/generated/prisma/client";
import { type ListParams, paginate } from "@/lib/data/list-params";
import { requestedAgainst } from "@/lib/payment-balance";
import { PAYABLE_PO_STATUSES, PAYMENT_REQUEST_STATUSES } from "@/lib/payment-request-options";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireUser } from "@/lib/session";

const contains = (query: string) =>
  ({ contains: query, mode: "insensitive" }) as const;

export function parsePaymentRequestStatus(value: string | string[] | undefined) {
  return typeof value === "string" &&
    (PAYMENT_REQUEST_STATUSES as readonly string[]).includes(value)
    ? (value as PaymentRequestStatus)
    : undefined;
}

export async function listPaymentRequests(
  { query, page, pageSize }: ListParams,
  status: PaymentRequestStatus | undefined,
) {
  await requirePermission("payment_requests:view");
  const where: Prisma.PaymentRequestWhereInput = {
    ...(status && { status }),
    ...(query && {
      OR: [
        { number: contains(query) },
        { inFavorOf: contains(query) },
        { description: contains(query) },
        { invoiceNo: contains(query) },
        { quotationNo: contains(query) },
        { project: { OR: [{ code: contains(query) }, { name: contains(query) }] } },
        { purchaseOrder: { number: contains(query) } },
      ],
    }),
  };
  return paginate(
    { page, pageSize },
    () => prisma.paymentRequest.count({ where }),
    (args) =>
      prisma.paymentRequest.findMany({
        where,
        orderBy: [{ requestDate: "desc" }, { number: "desc" }],
        select: {
          id: true,
          number: true,
          requestDate: true,
          status: true,
          priority: true,
          inFavorOf: true,
          currency: true,
          amount: true,
          project: { select: { code: true } },
          purchaseOrder: { select: { number: true } },
        },
        ...args,
      }),
  );
}

export async function getPaymentRequest(id: string) {
  await requirePermission("payment_requests:view");
  return prisma.paymentRequest.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, code: true, name: true } },
      purchaseOrder: { select: { id: true, number: true, total: true, currency: true } },
      createdBy: { select: { name: true } },
    },
  });
}

/** Dropdown options for the PR form (ids and names only). */
export async function getPaymentRequestOptions() {
  const { can } = await requireUser();
  if (!can("payment_requests:create") && !can("payment_requests:edit")) forbidden();
  const [projects, suppliers] = await Promise.all([
    prisma.project.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return {
    projects: projects.map((p) => ({ value: p.id, label: `${p.code} – ${p.name}` })),
    suppliers: suppliers.map((s) => ({ value: s.id, label: s.name })),
  };
}

export type PurchaseOrderBalance = {
  id: string;
  number: string;
  currency: string;
  total: string;
  requested: string;
  remaining: string;
};

/** A PO's total, what its payment requests already cover, and what remains. */
export async function getPurchaseOrderBalance(purchaseOrderId: string, excludeRequestId?: string) {
  const order = await prisma.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    select: { id: true, number: true, currency: true, total: true },
  });
  if (!order) return null;
  const requested = await requestedAgainst(prisma, purchaseOrderId, excludeRequestId);
  const remaining = order.total.minus(requested);
  return {
    id: order.id,
    number: order.number,
    currency: order.currency,
    total: order.total.toString(),
    requested: requested.toString(),
    remaining: (remaining.isNegative() ? remaining.mul(0) : remaining).toString(),
  } satisfies PurchaseOrderBalance;
}

/**
 * A payable PO (Approved, Issued or Closed) for prefilling a new payment
 * request, with its remaining balance. Null if missing or not payable.
 */
export async function getPurchaseOrderForPayment(id: string) {
  await requirePermission("payment_requests:create");
  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      projectId: true,
      supplierId: true,
      supplierName: true,
      quotationRef: true,
      currency: true,
      category: { select: { name: true } },
    },
  });
  if (!order || !(PAYABLE_PO_STATUSES as readonly string[]).includes(order.status)) return null;
  const balance = await getPurchaseOrderBalance(id);
  return balance && { ...order, balance };
}

/** Payment requests raised against a PO, for its detail page (empty without access). */
export async function listPaymentRequestsForPurchaseOrder(purchaseOrderId: string) {
  const { can } = await requireUser();
  if (!can("payment_requests:view")) return [];
  return prisma.paymentRequest.findMany({
    where: { purchaseOrderId },
    orderBy: { createdAt: "asc" },
    select: { id: true, number: true, requestDate: true, status: true, amount: true },
  });
}
