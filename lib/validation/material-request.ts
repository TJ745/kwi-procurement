import { z } from "zod";

// Shared by the client form and the Server Actions.

export const MATERIAL_REQUEST_STATUSES = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"] as const;
export type MaterialRequestStatusValue = (typeof MATERIAL_REQUEST_STATUSES)[number];

export const MATERIAL_REQUEST_STATUS_LABELS: Record<MaterialRequestStatusValue, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const MAX_LINES = 200;

const requiredId = (label: string) => z.string().min(1, `Select a ${label}.`).max(64);

/** yyyy-MM-dd, and a real calendar date. */
export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Select a date.")
  .refine((value) => {
    const [y, m, d] = value.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  }, "Select a valid date.");

/** Up to 12 digits and 2 decimals, greater than zero (kept as text to stay exact). */
export const quantity = z
  .string()
  .trim()
  .regex(/^\d{1,12}(\.\d{1,2})?$/, "Enter a number with up to 2 decimals.")
  .refine((value) => Number(value) > 0, "Must be greater than 0.");

export const materialRequestLineSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(300, "At most 300 characters."),
  unit: z.string().trim().min(1, "Unit is required.").max(30, "At most 30 characters."),
  quantity,
  remarks: z.string().trim().max(500, "At most 500 characters."),
});

export const materialRequestSchema = z.object({
  requestDate: isoDate,
  projectId: requiredId("project"),
  departmentId: requiredId("department"),
  categoryId: requiredId("category"),
  supplierId: z.string().max(64),
  lines: z
    .array(materialRequestLineSchema)
    .min(1, "Add at least one item line.")
    .max(MAX_LINES, `At most ${MAX_LINES} item lines.`),
});

export type MaterialRequestLineInput = z.infer<typeof materialRequestLineSchema>;
export type MaterialRequestInput = z.infer<typeof materialRequestSchema>;

export const EMPTY_LINE: MaterialRequestLineInput = { name: "", unit: "", quantity: "", remarks: "" };
