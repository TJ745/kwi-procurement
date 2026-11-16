import "server-only";

import { Prisma } from "@/lib/generated/prisma/client";

/** Everything the PO document (PDF) shows, for the live order or a saved revision. */
export const PO_DOCUMENT_INCLUDE = {
  project: { select: { code: true, name: true, client: true } },
  department: { select: { name: true } },
  category: { select: { name: true } },
  materialRequest: { select: { number: true } },
  createdBy: { select: { name: true } },
  lines: { orderBy: { lineNo: "asc" } },
} satisfies Prisma.PurchaseOrderInclude;

export type PurchaseOrderDocument = Prisma.PurchaseOrderGetPayload<{ include: typeof PO_DOCUMENT_INCLUDE }>;

const DATE_FIELDS = ["orderDate", "createdAt", "updatedAt"] as const;
const DECIMAL_FIELDS = ["subtotal", "discount", "vatRate", "vatAmount", "total"] as const;
const LINE_DECIMAL_FIELDS = ["quantity", "unitPrice", "total"] as const;

/** JSON copy of the order: decimals become exact strings and dates ISO strings. */
export function toSnapshot(order: PurchaseOrderDocument): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(order));
}

/** Rebuilds a saved order with real Decimal and Date values, so it renders like the live one. */
export function fromSnapshot(snapshot: Prisma.JsonValue): PurchaseOrderDocument {
  const order = structuredClone(snapshot) as Record<string, unknown>;
  for (const key of DATE_FIELDS) order[key] = new Date(order[key] as string);
  for (const key of DECIMAL_FIELDS) order[key] = new Prisma.Decimal(order[key] as string);
  order.lines = (order.lines as Record<string, unknown>[]).map((line) => {
    const copy = { ...line };
    for (const key of LINE_DECIMAL_FIELDS) copy[key] = new Prisma.Decimal(copy[key] as string);
    return copy;
  });
  return order as unknown as PurchaseOrderDocument;
}
