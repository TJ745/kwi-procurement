"use server";

import { TZDate } from "@date-fns/tz";
import { z } from "zod";

import { ActionError, runMutation } from "@/lib/actions/run-mutation";
import { DOCUMENT_TYPES } from "@/lib/document-numbering";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import {
  companySettingsSchema,
  documentSequenceSchema,
  purchaseOrderDefaultsSchema,
  regionalSettingsSchema,
  securitySettingsSchema,
} from "@/lib/validation/admin";

const orNull = (value: string) => (value === "" ? null : value);

function saveSettings(data: Parameters<typeof prisma.appSettings.update>[0]["data"]) {
  return prisma.appSettings.upsert({
    where: { id: 1 },
    create: { id: 1, ...(data as object) },
    update: data,
  });
}

export async function updateCompanySettings(input: unknown) {
  return runMutation({
    requirement: "super_admin",
    audit: { entity: "settings", action: "update", id: () => "1" },
    schema: companySettingsSchema,
    input,
    success: "Company profile saved.",
    run: (data) =>
      saveSettings({
        companyName: orNull(data.companyName),
        companyAddress: orNull(data.companyAddress),
        companyVat: orNull(data.companyVat),
        companyCr: orNull(data.companyCr),
        companyPhone: orNull(data.companyPhone),
        companyEmail: orNull(data.companyEmail.toLowerCase()),
      }),
  });
}

export async function updateRegionalSettings(input: unknown) {
  return runMutation({
    requirement: "super_admin",
    audit: { entity: "settings", action: "update", id: () => "1" },
    schema: regionalSettingsSchema,
    input,
    success: "Regional settings saved.",
    run: (data) => saveSettings(data),
  });
}

export async function updateSecuritySettings(input: unknown) {
  return runMutation({
    requirement: "super_admin",
    audit: { entity: "settings", action: "update", id: () => "1" },
    schema: securitySettingsSchema,
    input,
    success: "Security settings saved. The session duration applies to new sign-ins.",
    run: (data) =>
      saveSettings({
        sessionDurationHours: Number(data.sessionDurationHours),
        minPasswordLength: Number(data.minPasswordLength),
      }),
  });
}

export async function updatePurchaseOrderDefaults(input: unknown) {
  return runMutation({
    requirement: "super_admin",
    audit: { entity: "settings", action: "update", id: () => "1" },
    schema: purchaseOrderDefaultsSchema,
    input,
    success: "Purchase order defaults saved. They apply to new purchase orders.",
    run: (data) =>
      saveSettings({
        defaultVatRate: data.defaultVatRate,
        purchaseOrderTerms: orNull(data.purchaseOrderTerms),
      }),
  });
}

const documentTypeSchema = z.enum(DOCUMENT_TYPES.map((item) => item.type));

export async function updateDocumentSequence(type: string, input: unknown) {
  return runMutation({
    requirement: "super_admin",
    audit: { entity: "document_sequence", action: "update", id: (data) => data.type },
    schema: documentSequenceSchema.extend({ type: documentTypeSchema }),
    input: { ...(input as object), type },
    success: "Numbering saved.",
    run: async ({ type, ...data }) => {
      const { timeZone } = await getSettings();
      await prisma.documentSequence.update({
        where: { type },
        data: {
          prefix: data.prefix.toUpperCase(),
          includeYear: data.includeYear,
          // A yearly reset without the year in the number would repeat numbers.
          resetYearly: data.includeYear && data.resetYearly,
          padding: Number(data.padding),
          nextNumber: Number(data.nextNumber),
          // The configured next number counts from the current year.
          counterYear: new TZDate(new Date(), timeZone).getFullYear(),
        },
      });
    },
  });
}

const MAX_LOGO_BYTES = 512 * 1024;

/** Identifies PNG, JPEG and WebP by their file signature. */
function detectImageType(bytes: Uint8Array) {
  const starts = (...signature: number[]) => signature.every((byte, i) => bytes[i] === byte);
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (starts(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (starts(0x52, 0x49, 0x46, 0x46) && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") {
    return "image/webp";
  }
  return null;
}

export async function uploadCompanyLogo(formData: FormData) {
  return runMutation({
    requirement: "super_admin",
    audit: { entity: "settings", action: "update", id: () => "1" },
    schema: z.object({ file: z.instanceof(File, { message: "Choose an image file." }) }),
    input: { file: formData.get("file") },
    success: "Logo uploaded.",
    run: async ({ file }) => {
      if (file.size === 0) throw new ActionError("Choose an image file.");
      if (file.size > MAX_LOGO_BYTES) throw new ActionError("The logo must be 512 KB or smaller.");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const type = detectImageType(bytes);
      if (!type) throw new ActionError("Use a PNG, JPEG or WebP image.");
      await saveSettings({ companyLogo: bytes, companyLogoType: type });
    },
  });
}

export async function removeCompanyLogo() {
  return runMutation({
    requirement: "super_admin",
    audit: { entity: "settings", action: "update", id: () => "1" },
    schema: z.object({}),
    input: {},
    success: "Logo removed.",
    run: () => saveSettings({ companyLogo: null, companyLogoType: null }),
  });
}
