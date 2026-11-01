import "server-only";

import { cache } from "react";

import type { AppSettings } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type Settings = Omit<AppSettings, "companyLogo">;

const DEFAULTS: Settings = {
  id: 1,
  companyName: null,
  companyAddress: null,
  companyVat: null,
  companyCr: null,
  companyPhone: null,
  companyEmail: null,
  companyLogoType: null,
  currency: "USD",
  timeZone: "UTC",
  dateFormat: "d MMM yyyy",
  sessionDurationHours: 168,
  minPasswordLength: 12,
  updatedAt: new Date(0),
};

/** System settings for this request (the logo bytes are loaded separately). */
export const getSettings = cache(async (): Promise<Settings> => {
  const settings = await prisma.appSettings.findUnique({
    where: { id: 1 },
    omit: { companyLogo: true },
  });
  return settings ?? DEFAULTS;
});
