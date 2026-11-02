import "server-only";

import { Prisma } from "@/lib/generated/prisma/client";

type Client = Pick<Prisma.TransactionClient, "paymentRequest">;

/**
 * Sum of a PO's payment requests that count against its total (everything
 * except Rejected), optionally excluding one request (when editing it).
 */
export async function requestedAgainst(client: Client, purchaseOrderId: string, excludeId?: string) {
  const { _sum } = await client.paymentRequest.aggregate({
    where: {
      purchaseOrderId,
      status: { not: "REJECTED" },
      ...(excludeId && { id: { not: excludeId } }),
    },
    _sum: { amount: true },
  });
  return _sum.amount ?? new Prisma.Decimal(0);
}

/** Locks a PO row for the rest of the transaction (serialises balance checks). */
export async function lockPurchaseOrder(tx: Prisma.TransactionClient, purchaseOrderId: string) {
  await tx.$queryRaw`SELECT "id" FROM "purchase_order" WHERE "id" = ${purchaseOrderId} FOR UPDATE`;
}
