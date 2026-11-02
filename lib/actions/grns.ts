"use server";

import { z } from "zod";

import { ActionError, runMutation } from "@/lib/actions/run-mutation";
import { acceptedBefore } from "@/lib/data/grns";
import type { Prisma } from "@/lib/generated/prisma/client";
import { GRN_STATUSES, GRN_STATUS_LABELS, LOCKED_GRN_STATUSES, RECEIVABLE_PO_STATUSES, lineQuantities, outstandingQuantity } from "@/lib/grn";
import { allocateDocumentNumber } from "@/lib/numbering";
import { lockPurchaseOrder } from "@/lib/payment-balance";
import { prisma } from "@/lib/prisma";
import { recordIdSchema } from "@/lib/validation/master-data";
import { type GrnInput, grnSchema } from "@/lib/validation/grn";

// Interactive transactions queue on row locks; allow for that.
const TRANSACTION_OPTIONS = { maxWait: 10_000, timeout: 20_000 };

const orNull = (value: string) => (value === "" ? null : value);

async function assertDepartments(tx: Prisma.TransactionClient, input: GrnInput) {
  const ids = [...new Set([input.departmentId, ...input.lines.map((line) => line.departmentId)])];
  const found = await tx.department.count({ where: { id: { in: ids } } });
  if (found !== ids.length) throw new ActionError("A selected department no longer exists. Refresh the page.");
}

/**
 * Builds the GRN lines from the PO's lines, in PO order, with every computed
 * quantity worked out here from what earlier GRNs accepted. Runs inside a
 * transaction that has locked the PO.
 */
async function buildLines(
  tx: Prisma.TransactionClient,
  purchaseOrderId: string,
  input: GrnInput,
  excludeGrnId?: string,
) {
  const poLines = await tx.purchaseOrderLine.findMany({
    where: { purchaseOrderId },
    orderBy: { lineNo: "asc" },
  });
  const submitted = new Map(input.lines.map((line) => [line.purchaseOrderLineId, line]));
  if (submitted.size !== input.lines.length || poLines.length !== submitted.size || poLines.some((line) => !submitted.has(line.id))) {
    throw new ActionError("The purchase order's items changed. Reload the page and try again.");
  }
  const accepted = await acceptedBefore(tx, purchaseOrderId, excludeGrnId);
  return poLines.map((poLine, index): Omit<Prisma.GoodsReceiptLineCreateManyInput, "goodsReceiptId"> => {
    const line = submitted.get(poLine.id)!;
    const ordered = poLine.quantity.toString();
    const outstanding = outstandingQuantity(ordered, accepted.get(poLine.id) ?? "0");
    const { short, excess, accepted: acceptedQty } = lineQuantities(outstanding, line.receivedQty, line.rejectedQty);
    return {
      purchaseOrderLineId: poLine.id,
      lineNo: index + 1,
      itemCode: orNull(line.itemCode),
      description: poLine.name,
      unit: poLine.unit,
      departmentId: line.departmentId,
      orderedQty: ordered,
      outstandingQty: outstanding,
      receivedQty: line.receivedQty,
      shortQty: short,
      excessQty: excess,
      rejectedQty: line.rejectedQty,
      acceptedQty,
    };
  });
}

function toHeader(input: GrnInput) {
  return {
    receiptDate: new Date(`${input.receiptDate}T00:00:00.000Z`),
    departmentId: input.departmentId,
    supplierName: input.supplierName,
    supplierAddress: orNull(input.supplierAddress),
    invoiceNo: orNull(input.invoiceNo),
    deliveredBy: input.deliveredBy,
    remarks: orNull(input.remarks),
  };
}

async function allocateFreeNumber(tx: Prisma.TransactionClient, timeZone: string) {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const number = await allocateDocumentNumber(tx, "GRN", timeZone);
    if (!(await tx.goodsReceipt.count({ where: { number } }))) return number;
  }
  throw new ActionError("Could not assign a GRN number. Check Settings › Document numbering.");
}

export async function createGrn(purchaseOrderId: string, input: unknown) {
  return runMutation({
    requirement: "grns:create",
    audit: { entity: "grn", action: "create" },
    schema: grnSchema.and(z.object({ purchaseOrderId: recordIdSchema })),
    input: { ...(input as object), purchaseOrderId },
    success: "Goods received note created.",
    refreshPage: false,
    run: ({ purchaseOrderId, ...data }, { user, settings }) =>
      prisma.$transaction(async (tx) => {
        await lockPurchaseOrder(tx, purchaseOrderId);
        const order = await tx.purchaseOrder.findUnique({
          where: { id: purchaseOrderId },
          select: { status: true, projectId: true },
        });
        if (!order) throw new ActionError("The purchase order no longer exists.");
        if (!(RECEIVABLE_PO_STATUSES as readonly string[]).includes(order.status)) {
          throw new ActionError("Goods can only be received against approved or issued purchase orders.");
        }
        await assertDepartments(tx, data);
        const lines = await buildLines(tx, purchaseOrderId, data);
        const number = await allocateFreeNumber(tx, settings.timeZone);
        return tx.goodsReceipt.create({
          data: {
            ...toHeader(data),
            number,
            purchaseOrderId,
            projectId: order.projectId,
            createdById: user.id,
            lines: { createMany: { data: lines } },
          },
          select: { id: true },
        });
      }, TRANSACTION_OPTIONS),
  });
}

export async function updateGrn(id: string, input: unknown) {
  return runMutation({
    requirement: "grns:edit",
    audit: { entity: "grn", action: "update" },
    schema: grnSchema.and(z.object({ id: recordIdSchema })),
    input: { ...(input as object), id },
    success: "Goods received note updated.",
    refreshPage: false,
    run: ({ id, ...data }) =>
      prisma.$transaction(async (tx) => {
        const current = await tx.goodsReceipt.findUnique({ where: { id }, select: { purchaseOrderId: true } });
        if (!current) throw new ActionError("This goods received note no longer exists. Refresh the page.");
        await lockPurchaseOrder(tx, current.purchaseOrderId);
        await assertDepartments(tx, data);
        const lines = await buildLines(tx, current.purchaseOrderId, data, id);
        await tx.goodsReceiptLine.deleteMany({ where: { goodsReceiptId: id } });
        // The PO link, project and number are fixed at creation.
        return tx.goodsReceipt.update({
          where: { id },
          data: { ...toHeader(data), lines: { createMany: { data: lines } } },
          select: { id: true },
        });
      }, TRANSACTION_OPTIONS),
  });
}

export async function setGrnStatus(id: string, status: string) {
  return runMutation({
    requirement: "grns:status",
    audit: { entity: "grn", action: "status" },
    schema: z.object({ id: recordIdSchema, status: z.enum(GRN_STATUSES) }),
    input: { id, status },
    success: "Status updated.",
    run: ({ id, status }) => prisma.goodsReceipt.update({ where: { id }, data: { status }, select: { id: true } }),
  });
}

async function deleteUnlessLocked(id: string) {
  const { count } = await prisma.goodsReceipt.deleteMany({
    where: { id, status: { notIn: [...LOCKED_GRN_STATUSES] } },
  });
  if (count === 0) {
    const current = await prisma.goodsReceipt.findUnique({ where: { id }, select: { status: true } });
    throw new ActionError(
      current
        ? `${GRN_STATUS_LABELS[current.status]} goods received notes cannot be deleted.`
        : "This goods received note no longer exists. Refresh the page.",
    );
  }
}

export async function deleteGrn(id: string) {
  return runMutation({
    requirement: "grns:delete",
    audit: { entity: "grn", action: "delete" },
    schema: z.object({ id: recordIdSchema }),
    input: { id },
    success: "Goods received note deleted.",
    run: ({ id }) => deleteUnlessLocked(id),
  });
}

/** Used on the detail page, which navigates back to the list itself. */
export async function deleteGrnFromDetail(id: string) {
  return runMutation({
    requirement: "grns:delete",
    audit: { entity: "grn", action: "delete" },
    schema: z.object({ id: recordIdSchema }),
    input: { id },
    success: "Goods received note deleted.",
    refreshPage: false,
    run: ({ id }) => deleteUnlessLocked(id),
  });
}
