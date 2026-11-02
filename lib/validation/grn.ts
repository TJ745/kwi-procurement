import { z } from "zod";

import { DELIVERY_METHODS } from "@/lib/grn";
import { isoDate } from "@/lib/validation/material-request";

// Shared by the client form and the Server Actions.

const text = (label: string, max: number) =>
  z.string().trim().max(max, `${label} must be at most ${max} characters.`);

/** 0 or more, up to 2 decimals (kept as text to stay exact). */
const qty = (label: string) =>
  z.string().trim().regex(/^\d{1,12}(\.\d{1,2})?$/, `${label}: enter a number with up to 2 decimals.`);

export const grnLineSchema = z
  .object({
    purchaseOrderLineId: z.string().min(1).max(64),
    itemCode: text("Item code", 50),
    departmentId: z.string().min(1, "Select a department.").max(64),
    receivedQty: qty("Received"),
    rejectedQty: qty("Rejected"),
  })
  .refine((line) => Number(line.rejectedQty) <= Number(line.receivedQty), {
    path: ["rejectedQty"],
    message: "Rejected can't exceed received.",
  });

export const grnSchema = z
  .object({
    receiptDate: isoDate,
    departmentId: z.string().min(1, "Select a department.").max(64),
    supplierName: text("Supplier name", 200).min(1, "Supplier name is required."),
    supplierAddress: text("Address", 500),
    invoiceNo: text("Invoice No", 100),
    deliveredBy: z.enum(DELIVERY_METHODS.map((option) => option.value), { message: "Select how it was delivered." }),
    remarks: text("Remarks", 2000),
    lines: z.array(grnLineSchema).min(1).max(200),
  })
  .refine((value) => value.lines.some((line) => Number(line.receivedQty) > 0), {
    path: ["lines"],
    message: "Enter a received quantity for at least one item.",
  });

export type GrnLineInput = z.infer<typeof grnLineSchema>;
export type GrnInput = z.infer<typeof grnSchema>;
