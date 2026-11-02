import { z } from "zod";

import {
  OTHERS_ITEM,
  PAYMENT_ITEM_KEYS,
  PAYMENT_PRIORITIES,
  PAYMENT_TYPES,
} from "@/lib/payment-request-options";
import { isoDate } from "@/lib/validation/material-request";

// Shared by the client form and the Server Actions.

const text = (label: string, max: number) =>
  z.string().trim().max(max, `${label} must be at most ${max} characters.`);

export const paymentRequestSchema = z
  .object({
    requestDate: isoDate,
    projectId: z.string().min(1, "Select a project.").max(64),
    supplierId: z.string().max(64),
    inFavorOf: text("In favor of", 200).min(1, "In favor of is required."),
    description: text("Description", 2000).min(1, "Description is required."),
    items: z
      .array(z.enum(PAYMENT_ITEM_KEYS))
      .min(1, "Tick at least one item (Material, Manpower, Vehicle/Equipment, Sub-Contract or Others).")
      .max(PAYMENT_ITEM_KEYS.length),
    otherDetails: text("Others", 200),
    paymentType: z.enum(PAYMENT_TYPES.map((option) => option.value), { message: "Select the type of payment." }),
    priority: z.enum(PAYMENT_PRIORITIES.map((option) => option.value), { message: "Select a priority." }),
    currency: z.string().regex(/^[A-Z]{3}$/, "Select a currency."),
    amount: z
      .string()
      .trim()
      .regex(/^\d{1,13}(\.\d{1,3})?$/, "Enter an amount with up to 3 decimals.")
      .refine((value) => Number(value) > 0, "Amount must be greater than 0."),
    invoiceNo: text("Invoice No", 100),
    quotationNo: text("Quotation No", 100),
  })
  .refine((value) => !value.items.includes(OTHERS_ITEM) || value.otherDetails.length > 0, {
    path: ["otherDetails"],
    message: "Specify what 'Others' is for.",
  });

export type PaymentRequestInput = z.infer<typeof paymentRequestSchema>;
