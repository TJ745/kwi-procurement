"use server";

import { z } from "zod";

import { ActionError, runMutation } from "@/lib/actions/run-mutation";
import type { Prisma } from "@/lib/generated/prisma/client";
import { computeTotals, formatMoney } from "@/lib/money";
import { lockPurchaseOrder, requestedAgainst } from "@/lib/payment-balance";
import { allocateDocumentNumber } from "@/lib/numbering";
import { prisma } from "@/lib/prisma";
import { recordIdSchema } from "@/lib/validation/master-data";
import {
  LOCKED_PURCHASE_ORDER_STATUSES,
  PURCHASE_ORDER_STATUSES,
  PURCHASE_ORDER_STATUS_LABELS,
  type PurchaseOrderInput,
  purchaseOrderSchema,
} from "@/lib/validation/purchase-order";

// Interactive transactions queue on the numbering row lock; allow for that.
const TRANSACTION_OPTIONS = { maxWait: 10_000, timeout: 20_000 };

/** Confirms the selected master data still exists (for clear field errors). */
async function assertReferences(input: PurchaseOrderInput) {
  const [project, department, category, supplier] = await Promise.all([
    prisma.project.count({ where: { id: input.projectId } }),
    prisma.department.count({ where: { id: input.departmentId } }),
    prisma.category.count({ where: { id: input.categoryId } }),
    prisma.supplier.count({ where: { id: input.supplierId } }),
  ]);
  const fieldErrors: Record<string, string> = {};
  if (!project) fieldErrors.projectId = "This project no longer exists.";
  if (!department) fieldErrors.departmentId = "This department no longer exists.";
  if (!category) fieldErrors.categoryId = "This category no longer exists.";
  if (!supplier) fieldErrors.supplierId = "This supplier no longer exists.";
  if (Object.keys(fieldErrors).length) {
    throw new ActionError("Some selections are no longer available.", fieldErrors);
  }
}

const orNull = (value: string) => (value === "" ? null : value);

/** Header fields and line rows, with every amount computed on the server. */
function toData(input: PurchaseOrderInput) {
  const totals = computeTotals({
    lines: input.lines,
    discount: input.discount,
    vatRate: input.vatRate,
    currency: input.currency,
  });
  if (totals.taxable.startsWith("-")) {
    throw new ActionError("The discount cannot exceed the subtotal.", {
      discount: "The discount cannot exceed the subtotal.",
    });
  }
  const header = {
    // Stored as a calendar date (no time zone).
    orderDate: new Date(`${input.orderDate}T00:00:00.000Z`),
    projectId: input.projectId,
    departmentId: input.departmentId,
    categoryId: input.categoryId,
    deliverTo: input.deliverTo,
    supplierId: input.supplierId,
    supplierName: input.supplierName,
    supplierAddress: orNull(input.supplierAddress),
    supplierContactName: orNull(input.supplierContactName),
    supplierContactNumber: orNull(input.supplierContactNumber),
    supplierEmail: orNull(input.supplierEmail.toLowerCase()),
    supplierTelephone: orNull(input.supplierTelephone),
    supplierVat: orNull(input.supplierVat),
    quotationRef: orNull(input.quotationRef),
    currency: input.currency,
    subtotal: totals.subtotal,
    discount: totals.discount,
    vatRate: input.vatRate,
    vatAmount: totals.vatAmount,
    total: totals.total,
    terms: orNull(input.terms),
  };
  const lines = input.lines.map(
    (line, index): Omit<Prisma.PurchaseOrderLineCreateManyInput, "purchaseOrderId"> => ({
      lineNo: index + 1,
      name: line.name,
      unit: line.unit,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      total: totals.lineTotals[index],
    }),
  );
  return { header, lines };
}

async function allocateFreeNumber(tx: Prisma.TransactionClient, timeZone: string) {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const number = await allocateDocumentNumber(tx, "PURCHASE_ORDER", timeZone);
    if (!(await tx.purchaseOrder.count({ where: { number } }))) return number;
  }
  throw new ActionError("Could not assign a PO number. Check Settings › Document numbering.");
}

const createSchema = purchaseOrderSchema.extend({
  materialRequestId: z.string().max(64),
});

/** `materialRequestId` is "" for a PO raised without a material request. */
export async function createPurchaseOrder(materialRequestId: string, input: unknown) {
  return runMutation({
    requirement: "purchase_orders:create",
    schema: createSchema,
    input: { ...(input as object), materialRequestId },
    success: "Purchase order created.",
    unique: {
      field: "materialRequestId",
      message: "A purchase order has already been raised from this material request.",
    },
    // The client navigates to the new order.
    refreshPage: false,
    run: async ({ materialRequestId, ...data }, { user, settings }) => {
      await assertReferences(data);
      const { header, lines } = toData(data);
      return prisma.$transaction(async (tx) => {
        if (materialRequestId) {
          const source = await tx.materialRequest.findUnique({
            where: { id: materialRequestId },
            select: { status: true, purchaseOrder: { select: { number: true } } },
          });
          if (!source) throw new ActionError("The material request no longer exists.");
          if (source.status !== "APPROVED") {
            throw new ActionError("Only approved material requests can be turned into a purchase order.");
          }
          if (source.purchaseOrder) {
            throw new ActionError(
              `Purchase order ${source.purchaseOrder.number} has already been raised from this request.`,
            );
          }
        }
        const number = await allocateFreeNumber(tx, settings.timeZone);
        // The unique index on materialRequestId settles concurrent attempts.
        return tx.purchaseOrder.create({
          data: {
            ...header,
            number,
            materialRequestId: materialRequestId || null,
            createdById: user.id,
            lines: { createMany: { data: lines } },
          },
          select: { id: true },
        });
      }, TRANSACTION_OPTIONS);
    },
  });
}

export async function updatePurchaseOrder(id: string, input: unknown) {
  return runMutation({
    requirement: "purchase_orders:edit",
    schema: purchaseOrderSchema.extend({ id: recordIdSchema }),
    input: { ...(input as object), id },
    success: "Purchase order updated.",
    refreshPage: false,
    run: async ({ id, ...data }) => {
      await assertReferences(data);
      const { header, lines } = toData(data);
      // Lines are replaced as a whole so Sr No stays contiguous. The source MR
      // link and the number are fixed at creation.
      return prisma.$transaction(async (tx) => {
        await lockPurchaseOrder(tx, id);
        const current = await tx.purchaseOrder.findUniqueOrThrow({
          where: { id },
          select: { currency: true },
        });
        // Payment requests already raised must still fit within the order.
        const requested = await requestedAgainst(tx, id);
        if (requested.greaterThan(0)) {
          if (header.currency !== current.currency) {
            throw new ActionError("The currency can't change once payment requests exist for this order.", {
              currency: "Locked by existing payment requests.",
            });
          }
          if (requested.greaterThan(header.total)) {
            throw new ActionError(
              `The new total is below the ${formatMoney(requested.toString(), current.currency)} already requested for payment.`,
            );
          }
        }
        // Received goods reference the PO's lines: once a GRN exists, the items
        // can't change (header fields still can).
        if (await tx.goodsReceipt.count({ where: { purchaseOrderId: id } })) {
          const existing = await tx.purchaseOrderLine.findMany({
            where: { purchaseOrderId: id },
            orderBy: { lineNo: "asc" },
          });
          const same =
            existing.length === lines.length &&
            existing.every(
              (line, index) =>
                line.name === lines[index].name &&
                line.unit === lines[index].unit &&
                line.quantity.equals(lines[index].quantity as string) &&
                line.unitPrice.equals(lines[index].unitPrice as string),
            );
          if (!same) {
            throw new ActionError(
              "Goods have been received against this purchase order, so its items, quantities and prices can't be changed.",
            );
          }
          return tx.purchaseOrder.update({ where: { id }, data: header, select: { id: true } });
        }
        await tx.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: id } });
        return tx.purchaseOrder.update({
          where: { id },
          data: { ...header, lines: { createMany: { data: lines } } },
          select: { id: true },
        });
      }, TRANSACTION_OPTIONS);
    },
  });
}

export async function setPurchaseOrderStatus(id: string, status: string) {
  return runMutation({
    requirement: "purchase_orders:status",
    schema: z.object({ id: recordIdSchema, status: z.enum(PURCHASE_ORDER_STATUSES) }),
    input: { id, status },
    success: "Status updated.",
    run: ({ id, status }) =>
      prisma.purchaseOrder.update({ where: { id }, data: { status }, select: { id: true } }),
  });
}

async function deleteUnlessLocked(id: string) {
  const receipts = await prisma.goodsReceipt.count({ where: { purchaseOrderId: id } });
  if (receipts > 0) {
    throw new ActionError(
      `This purchase order has ${receipts} goods received note${receipts === 1 ? "" : "s"}. Delete ${receipts === 1 ? "it" : "them"} first.`,
    );
  }
  const payments = await prisma.paymentRequest.count({ where: { purchaseOrderId: id } });
  if (payments > 0) {
    throw new ActionError(
      `This purchase order has ${payments} payment request${payments === 1 ? "" : "s"}. Delete ${payments === 1 ? "it" : "them"} first.`,
    );
  }
  // The status check is part of the delete, so a concurrent approval wins.
  const { count } = await prisma.purchaseOrder.deleteMany({
    where: { id, status: { notIn: [...LOCKED_PURCHASE_ORDER_STATUSES] } },
  });
  if (count === 0) {
    const current = await prisma.purchaseOrder.findUnique({ where: { id }, select: { status: true } });
    throw new ActionError(
      current
        ? `${PURCHASE_ORDER_STATUS_LABELS[current.status]} purchase orders cannot be deleted.`
        : "This purchase order no longer exists. Refresh the page.",
    );
  }
}

export async function deletePurchaseOrder(id: string) {
  return runMutation({
    requirement: "purchase_orders:delete",
    schema: z.object({ id: recordIdSchema }),
    input: { id },
    success: "Purchase order deleted.",
    run: ({ id }) => deleteUnlessLocked(id),
  });
}

/** Used on the detail page, which navigates back to the list itself. */
export async function deletePurchaseOrderFromDetail(id: string) {
  return runMutation({
    requirement: "purchase_orders:delete",
    schema: z.object({ id: recordIdSchema }),
    input: { id },
    success: "Purchase order deleted.",
    refreshPage: false,
    run: ({ id }) => deleteUnlessLocked(id),
  });
}
