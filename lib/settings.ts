import "server-only";

import { cache } from "react";

import { type AppSettings, Prisma } from "@/lib/generated/prisma/client";
import { imageSize } from "@/lib/image-size";
import { prisma } from "@/lib/prisma";

export type Settings = Omit<AppSettings, "companyLogo" | "printFooter">;

const DEFAULTS: Settings = {
  id: 1,
  companyName: null,
  companyAddress: null,
  companyVat: null,
  companyCr: null,
  companyPhone: null,
  companyEmail: null,
  companyLogoType: null,
  printFooterType: null,
  currency: "USD",
  timeZone: "UTC",
  dateFormat: "d MMM yyyy",
  sessionDurationHours: 168,
  minPasswordLength: 12,
  defaultVatRate: new Prisma.Decimal(0),
  purchaseOrderTerms: null,
  updatedAt: new Date(0),
};

/** System settings for this request (the logo and footer bytes are loaded separately). */
export const getSettings = cache(async (): Promise<Settings> => {
  const settings = await prisma.appSettings.findUnique({
    where: { id: 1 },
    omit: { companyLogo: true, printFooter: true },
  });
  return settings ?? DEFAULTS;
});

/** Pixel size of the uploaded print footer, or null when there is none. */
export const getPrintFooterSize = cache(async () => {
  const settings = await prisma.appSettings.findUnique({
    where: { id: 1 },
    select: { printFooter: true },
  });
  return settings?.printFooter ? imageSize(settings.printFooter) : null;
});
