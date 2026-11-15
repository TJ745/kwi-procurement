import { z } from "zod";

import { isoDate, quantity } from "@/lib/validation/material-request";

// Shared by the client form and the Server Actions.

export const PURCHASE_ORDER_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "ISSUED",
  "CLOSED",
  "CANCELLED",
] as const;
export type PurchaseOrderStatusValue = (typeof PURCHASE_ORDER_STATUSES)[number];

export const PURCHASE_ORDER_STATUS_LABELS: Record<PurchaseOrderStatusValue, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  ISSUED: "Issued",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

/** POs past approval, and cancelled POs, are part of the record and cannot be deleted. */
export const LOCKED_PURCHASE_ORDER_STATUSES: readonly PurchaseOrderStatusValue[] = [
  "APPROVED",
  "ISSUED",
  "CLOSED",
  "CANCELLED",
];

/** Orders whose edits can be saved as a new revision (R1, R2…). */
export const REVISABLE_PURCHASE_ORDER_STATUSES: readonly PurchaseOrderStatusValue[] = ["APPROVED", "ISSUED"];

/** "PO-2026-0006" for the original, "PO-2026-0006-R2" for revision 2. */
export function revisedNumber(number: string, revision: number) {
  const base = number.replace(/-R\d+$/i, "");
  return revision > 0 ? `${base}-R${revision}` : base;
}

export const MAX_PO_LINES = 200;

const requiredId = (label: string) => z.string().min(1, `Select a ${label}.`).max(64);
const text = (label: string, max: number) =>
  z.string().trim().max(max, `${label} must be at most ${max} characters.`);
const requiredText = (label: string, max: number) => text(label, max).min(1, `${label} is required.`);

/** Non-negative amount with up to 3 decimals (kept as text to stay exact). */
const amount = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d{1,13}(\.\d{1,3})?$/, `${label}: enter a number with up to 3 decimals.`);

const optionalEmail = (label: string) =>
  text(label, 254).refine(
    (value) => value === "" || z.email().safeParse(value).success,
    `${label} must be a valid email address.`,
  );

export const purchaseOrderLineSchema = z.object({
  name: requiredText("Name", 300),
  unit: requiredText("Unit", 30),
  quantity,
  unitPrice: amount("Unit price"),
});

export const purchaseOrderSchema = z
  .object({
    orderDate: isoDate,
    projectId: requiredId("project"),
    departmentId: requiredId("department"),
    // The category is the PO's subject.
    categoryId: requiredId("subject"),
    deliverTo: requiredText("Deliver to", 500),
    supplierId: requiredId("supplier"),
    supplierName: requiredText("Company name", 200),
    supplierAddress: text("Location", 500),
    supplierContactName: text("Contact person", 200),
    supplierContactNumber: text("Contact number", 30),
    supplierEmail: optionalEmail("Email"),
    supplierTelephone: text("Tel", 30),
    supplierVat: text("VAT number", 50),
    quotationRef: text("Quotation reference", 100),
    currency: z.string().regex(/^[A-Z]{3}$/, "Select a currency."),
    discount: amount("Discount"),
    vatRate: z
      .string()
      .trim()
      .regex(/^\d{1,3}(\.\d{1,2})?$/, "Enter a VAT % with up to 2 decimals.")
      .refine((value) => Number(value) <= 100, "VAT % cannot exceed 100."),
    terms: text("Terms & Conditions", 10_000),
    lines: z
      .array(purchaseOrderLineSchema)
      .min(1, "Add at least one item line.")
      .max(MAX_PO_LINES, `At most ${MAX_PO_LINES} item lines.`),
  });

export type PurchaseOrderLineInput = z.infer<typeof purchaseOrderLineSchema>;
export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;

export const EMPTY_PO_LINE: PurchaseOrderLineInput = {
  name: "",
  unit: "",
  quantity: "",
  unitPrice: "",
};
