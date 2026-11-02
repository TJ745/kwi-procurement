import { z } from "zod";

import { DATE_FORMATS } from "@/lib/format";
import { ALL_PERMISSIONS } from "@/lib/permissions";

// Shared by client forms and Server Actions. The configured minimum password
// length is checked on the server (see lib/actions/users.ts); the client only
// checks the absolute bounds.

const trimmed = (label: string, max: number) =>
  z.string().trim().max(max, `${label} must be at most ${max} characters.`);

const required = (label: string, max: number) =>
  trimmed(label, max).min(1, `${label} is required.`);

const optionalEmail = (label: string) =>
  trimmed(label, 254).refine(
    (value) => value === "" || z.email().safeParse(value).success,
    `${label} must be a valid email address.`,
  );

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be at most 128 characters.");

// --- Users ------------------------------------------------------------------

export const userSchema = z.object({
  name: required("Name", 100),
  email: z.email("Enter a valid email address.").trim().toLowerCase().max(254),
  roleId: z.string().min(1, "Select a role."),
});

export const createUserSchema = userSchema.extend({
  temporaryPassword: passwordSchema,
});

export const resetPasswordSchema = z.object({
  temporaryPassword: passwordSchema,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })
  .refine((value) => value.newPassword !== value.currentPassword, {
    path: ["newPassword"],
    message: "Choose a password different from your current one.",
  });

export type UserInput = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// --- Roles ------------------------------------------------------------------

export const roleSchema = z.object({
  name: required("Name", 60),
  description: trimmed("Description", 300),
  permissions: z.array(z.enum(ALL_PERMISSIONS)).max(ALL_PERMISSIONS.length),
});

export type RoleInput = z.infer<typeof roleSchema>;

// --- Settings ---------------------------------------------------------------

export const companySettingsSchema = z.object({
  companyName: trimmed("Company name", 200),
  companyAddress: trimmed("Address", 500),
  companyVat: trimmed("VAT", 50),
  companyCr: trimmed("CR", 50),
  companyPhone: trimmed("Phone", 30).regex(
    /^[0-9+()\-.\s]*$/,
    "Phone may only contain digits, spaces and + ( ) - .",
  ),
  companyEmail: optionalEmail("Email"),
});

const isSupported = (kind: "currency" | "timeZone", value: string) =>
  Intl.supportedValuesOf(kind).includes(value) || (kind === "timeZone" && value === "UTC");

export const regionalSettingsSchema = z.object({
  currency: z.string().refine((value) => isSupported("currency", value), "Select a valid currency."),
  timeZone: z.string().refine((value) => isSupported("timeZone", value), "Select a valid time zone."),
  dateFormat: z.enum(DATE_FORMATS.map((format) => format.value) as [string, ...string[]], {
    message: "Select a date format.",
  }),
});

/** Whole number entered as text (form inputs are strings), within bounds. */
const wholeNumber = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, `${label} must be a whole number.`)
    .refine((value) => Number(value) >= min && Number(value) <= max, {
      message: `${label} must be between ${min} and ${max}.`,
    });

export const securitySettingsSchema = z.object({
  sessionDurationHours: wholeNumber("Session duration", 1, 720),
  minPasswordLength: wholeNumber("Minimum password length", 8, 128),
});

export const documentSequenceSchema = z.object({
  prefix: z
    .string()
    .trim()
    .min(1, "Prefix is required.")
    .max(10, "Prefix must be at most 10 characters.")
    .regex(/^[A-Za-z0-9]+$/, "Use letters and digits only."),
  includeYear: z.boolean(),
  resetYearly: z.boolean(),
  padding: wholeNumber("Digits", 1, 10),
  nextNumber: wholeNumber("Next number", 1, 2_000_000_000),
});

export const purchaseOrderDefaultsSchema = z.object({
  defaultVatRate: z
    .string()
    .trim()
    .regex(/^\d{1,3}(\.\d{1,2})?$/, "Enter a VAT % with up to 2 decimals.")
    .refine((value) => Number(value) <= 100, "VAT % cannot exceed 100."),
  purchaseOrderTerms: trimmed("Terms & Conditions", 10_000),
});

export type PurchaseOrderDefaultsInput = z.infer<typeof purchaseOrderDefaultsSchema>;
export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;
export type RegionalSettingsInput = z.infer<typeof regionalSettingsSchema>;
export type SecuritySettingsInput = z.infer<typeof securitySettingsSchema>;
export type DocumentSequenceInput = z.infer<typeof documentSequenceSchema>;
