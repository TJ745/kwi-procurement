"use server";

import { z } from "zod";

import { ActionError, runMutation } from "@/lib/actions/run-mutation";
import { Prisma } from "@/lib/generated/prisma/client";
import { currencyDigits, formatMoney } from "@/lib/money";
import { allocateDocumentNumber } from "@/lib/numbering";
import { lockPurchaseOrder, requestedAgainst } from "@/lib/payment-balance";
import {
  LOCKED_PAYMENT_REQUEST_STATUSES,
  OTHERS_ITEM,
  PAYABLE_PO_STATUSES,
  PAYMENT_REQUEST_STATUSES,
  PAYMENT_REQUEST_STATUS_LABELS,
} from "@/lib/payment-request-options";
import { prisma } from "@/lib/prisma";
import { recordIdSchema } from "@/lib/validation/master-data";
import { type PaymentRequestInput, paymentRequestSchema } from "@/lib/validation/payment-request";

// Interactive transactions queue on row locks; allow for that.
const TRANSACTION_OPTIONS = { maxWait: 10_000, timeout: 20_000 };

async function assertReferences(input: PaymentRequestInput) {
  const [project, supplier] = await Promise.all([
    prisma.project.count({ where: { id: input.projectId } }),
    input.supplierId ? prisma.supplier.count({ where: { id: input.supplierId } }) : 1,
  ]);
  const fieldErrors: Record<string, string> = {};
  if (!project) fieldErrors.projectId = "This project no longer exists.";
  if (!supplier) fieldErrors.supplierId = "This supplier no longer exists.";
  if (Object.keys(fieldErrors).length) {
    throw new ActionError("Some selections are no longer available.", fieldErrors);
  }
}

function assertCurrencyPrecision(amount: string, currency: string) {
  const decimals = amount.split(".")[1]?.length ?? 0;
  const digits = currencyDigits(currency);
  if (decimals > digits) {
    const message = `${currency} amounts allow at most ${digits} decimal${digits === 1 ? "" : "s"}.`;
    throw new ActionError(message, { amount: message });
  }
}

const orNull = (value: string) => (value === "" ? null : value);

function toData(input: PaymentRequestInput) {
  return {
    requestDate: new Date(`${input.requestDate}T00:00:00.000Z`),
    projectId: input.projectId,
    supplierId: input.supplierId || null,
    inFavorOf: input.inFavorOf,
    description: input.description,
    items: [...new Set(input.items)],
    otherDetails: input.items.includes(OTHERS_ITEM) ? orNull(input.otherDetails) : null,
    paymentType: input.paymentType,
    priority: input.priority,
    amount: input.amount,
    invoiceNo: orNull(input.invoiceNo),
    quotationNo: orNull(input.quotationNo),
  };
}

/**
 * Within a transaction that has locked the PO: rejects an amount that would
 * take the PO's (non-rejected) payment requests above its total.
 */
async function assertWithinBalance(
  tx: Prisma.TransactionClient,
  purchaseOrderId: string,
  amount: Prisma.Decimal,
  excludeId?: string,
) {
  const order = await tx.purchaseOrder.findUniqueOrThrow({
    where: { id: purchaseOrderId },
    select: { total: true, currency: true },
  });
  const requested = await requestedAgainst(tx, purchaseOrderId, excludeId);
  const remaining = order.total.minus(requested);
  if (amount.greaterThan(remaining)) {
    const message = `Exceeds the PO's remaining balance of ${formatMoney(remaining.isNegative() ? "0" : remaining.toFixed(currencyDigits(order.currency)), order.currency)}.`;
    throw new ActionError(message, { amount: message });
  }
}

async function allocateFreeNumber(tx: Prisma.TransactionClient, timeZone: string) {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const number = await allocateDocumentNumber(tx, "PAYMENT_REQUEST", timeZone);
    if (!(await tx.paymentRequest.count({ where: { number } }))) return number;
  }
  throw new ActionError("Could not assign a request number. Check Settings › Document numbering.");
}

/** `purchaseOrderId` is "" for a request raised without a purchase order. */
export async function createPaymentRequest(purchaseOrderId: string, input: unknown) {
  return runMutation({
    requirement: "payment_requests:create",
    audit: { entity: "payment_request", action: "create" },
    schema: paymentRequestSchema.and(z.object({ purchaseOrderId: z.string().max(64) })),
    input: { ...(input as object), purchaseOrderId },
    success: "Payment request created.",
    refreshPage: false,
    run: async ({ purchaseOrderId, ...data }, { user, settings }) => {
      await assertReferences(data);
      return prisma.$transaction(async (tx) => {
        let currency = data.currency;
        if (purchaseOrderId) {
          await lockPurchaseOrder(tx, purchaseOrderId);
          const order = await tx.purchaseOrder.findUnique({
            where: { id: purchaseOrderId },
            select: { status: true, currency: true },
          });
          if (!order) throw new ActionError("The purchase order no longer exists.");
          if (!(PAYABLE_PO_STATUSES as readonly string[]).includes(order.status)) {
            throw new ActionError("Payment requests can only be raised against approved, issued or closed purchase orders.");
          }
          // Amounts against a PO are always in the PO's currency.
          currency = order.currency;
          assertCurrencyPrecision(data.amount, currency);
          await assertWithinBalance(tx, purchaseOrderId, new Prisma.Decimal(data.amount));
        } else {
          assertCurrencyPrecision(data.amount, currency);
        }
        const number = await allocateFreeNumber(tx, settings.timeZone);
        return tx.paymentRequest.create({
          data: {
            ...toData(data),
            currency,
            number,
            purchaseOrderId: purchaseOrderId || null,
            createdById: user.id,
          },
          select: { id: true },
        });
      }, TRANSACTION_OPTIONS);
    },
  });
}

export async function updatePaymentRequest(id: string, input: unknown) {
  return runMutation({
    requirement: "payment_requests:edit",
    audit: { entity: "payment_request", action: "update" },
    schema: paymentRequestSchema.and(z.object({ id: recordIdSchema })),
    input: { ...(input as object), id },
    success: "Payment request updated.",
    refreshPage: false,
    run: async ({ id, ...data }) => {
      await assertReferences(data);
      return prisma.$transaction(async (tx) => {
        const current = await tx.paymentRequest.findUnique({
          where: { id },
          select: { purchaseOrderId: true, status: true },
        });
        if (!current) throw new ActionError("This payment request no longer exists. Refresh the page.");
        let currency = data.currency;
        if (current.purchaseOrderId) {
          await lockPurchaseOrder(tx, current.purchaseOrderId);
          const order = await tx.purchaseOrder.findUniqueOrThrow({
            where: { id: current.purchaseOrderId },
            select: { currency: true },
          });
          currency = order.currency;
          assertCurrencyPrecision(data.amount, currency);
          if (current.status !== "REJECTED") {
            await assertWithinBalance(tx, current.purchaseOrderId, new Prisma.Decimal(data.amount), id);
          }
        } else {
          assertCurrencyPrecision(data.amount, currency);
        }
        // The PO link and the number are fixed at creation.
        return tx.paymentRequest.update({
          where: { id },
          data: { ...toData(data), currency },
          select: { id: true },
        });
      }, TRANSACTION_OPTIONS);
    },
  });
}

export async function setPaymentRequestStatus(id: string, status: string) {
  return runMutation({
    requirement: "payment_requests:status",
    audit: { entity: "payment_request", action: "status" },
    schema: z.object({ id: recordIdSchema, status: z.enum(PAYMENT_REQUEST_STATUSES) }),
    input: { id, status },
    success: "Status updated.",
    run: ({ id, status }) =>
      prisma.$transaction(async (tx) => {
        const current = await tx.paymentRequest.findUniqueOrThrow({
          where: { id },
          select: { status: true, amount: true, purchaseOrderId: true },
        });
        // Moving out of Rejected puts the amount back against the PO.
        if (current.purchaseOrderId && current.status === "REJECTED" && status !== "REJECTED") {
          await lockPurchaseOrder(tx, current.purchaseOrderId);
          await assertWithinBalance(tx, current.purchaseOrderId, current.amount, id);
        }
        return tx.paymentRequest.update({ where: { id }, data: { status }, select: { id: true } });
      }, TRANSACTION_OPTIONS),
  });
}

async function deleteUnlessLocked(id: string) {
  const { count } = await prisma.paymentRequest.deleteMany({
    where: { id, status: { notIn: [...LOCKED_PAYMENT_REQUEST_STATUSES] } },
  });
  if (count === 0) {
    const current = await prisma.paymentRequest.findUnique({ where: { id }, select: { status: true } });
    throw new ActionError(
      current
        ? `${PAYMENT_REQUEST_STATUS_LABELS[current.status]} payment requests cannot be deleted.`
        : "This payment request no longer exists. Refresh the page.",
    );
  }
}

export async function deletePaymentRequest(id: string) {
  return runMutation({
    requirement: "payment_requests:delete",
    audit: { entity: "payment_request", action: "delete" },
    schema: z.object({ id: recordIdSchema }),
    input: { id },
    success: "Payment request deleted.",
    run: ({ id }) => deleteUnlessLocked(id),
  });
}

/** Used on the detail page, which navigates back to the list itself. */
export async function deletePaymentRequestFromDetail(id: string) {
  return runMutation({
    requirement: "payment_requests:delete",
    audit: { entity: "payment_request", action: "delete" },
    schema: z.object({ id: recordIdSchema }),
    input: { id },
    success: "Payment request deleted.",
    refreshPage: false,
    run: ({ id }) => deleteUnlessLocked(id),
  });
}
