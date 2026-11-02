import { z } from "zod";

import { isValidIban } from "@/lib/validation/iban";

// Schemas are shared by the client forms and the Server Actions. Optional
// fields accept "" from the form; the data layer stores "" as NULL.

const required = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be at most ${max} characters.`);

const optional = (label: string, max: number) =>
  z.string().trim().max(max, `${label} must be at most ${max} characters.`);

const optionalEmail = (label: string) =>
  optional(label, 254).refine(
    (value) => value === "" || z.email().safeParse(value).success,
    `${label} must be a valid email address.`,
  );

const optionalPhone = (label: string) =>
  optional(label, 30).regex(
    /^[0-9+()\-.\s]*$/,
    `${label} may only contain digits, spaces and + ( ) - .`,
  );

export const recordIdSchema = z.string().min(1).max(64);

export const projectSchema = z.object({
  code: required("Code", 50),
  name: required("Name", 200),
});

export const departmentSchema = z.object({
  name: required("Name", 100),
});

export const categorySchema = z.object({
  name: required("Name", 100),
});

export const supplierSchema = z.object({
  name: required("Name", 200),
  vat: optional("VAT", 50).regex(
    /^[A-Za-z0-9\s-]*$/,
    "VAT may only contain letters, digits, spaces and hyphens.",
  ),
  cr: optional("CR", 50),
  iban: optional("IBAN", 42).refine(
    (value) => value === "" || isValidIban(value),
    "Enter a valid IBAN.",
  ),
  address: optional("Address", 500),
  contactName: optional("Contact name", 200),
  contactEmail: optionalEmail("Contact email"),
  contactNumber: optionalPhone("Contact number"),
  email: optionalEmail("Email"),
  telephone: optionalPhone("Telephone"),
  paymentTerm: z.enum(["CASH", "CREDIT"], { message: "Choose cash or credit." }),
  // Optional for credit suppliers; ignored for cash suppliers.
  creditDays: z
    .string()
    .trim()
    .regex(/^(\d{1,3})?$/, "Enter a whole number of days (0–999)."),
});

export const SUPPLIER_PAYMENT_TERMS = [
  { value: "CASH", label: "Cash" },
  { value: "CREDIT", label: "Credit" },
] as const;

export function paymentTermLabel(term: string, creditDays?: number | null) {
  if (term === "CREDIT") return creditDays ? `Credit (${creditDays} days)` : "Credit";
  return "Cash";
}

export type ProjectInput = z.infer<typeof projectSchema>;
export type DepartmentInput = z.infer<typeof departmentSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type SupplierInput = z.infer<typeof supplierSchema>;
