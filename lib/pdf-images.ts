import "server-only";

import { prisma } from "@/lib/prisma";

export type PdfImage = { data: Buffer; format: "png" | "jpg" };

/** The PDF renderer reads PNG and JPEG only; other formats are left out. */
function toPdfImage(bytes: Uint8Array | null, type: string | null): PdfImage | null {
  const format = type === "image/png" ? "png" : type === "image/jpeg" ? "jpg" : null;
  return bytes && format ? { data: Buffer.from(bytes), format } : null;
}

/** Company logo and print footer for document PDFs. */
export async function loadPdfImages() {
  const settings = await prisma.appSettings.findUnique({
    where: { id: 1 },
    select: { companyLogo: true, companyLogoType: true, printFooter: true, printFooterType: true },
  });
  return {
    logo: toPdfImage(settings?.companyLogo ?? null, settings?.companyLogoType ?? null),
    footer: toPdfImage(settings?.printFooter ?? null, settings?.printFooterType ?? null),
  };
}
