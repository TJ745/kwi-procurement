import "server-only";

import { imageSize } from "@/lib/image-size";
import { prisma } from "@/lib/prisma";

export type PdfImage = { data: Buffer; format: "png" | "jpg" };
/** The print footer plus its shape (height ÷ width), so it can span the page width. */
export type PdfFooter = { image: PdfImage; aspect: number };

/** The PDF renderer reads PNG and JPEG only; other formats are left out. */
function toPdfImage(bytes: Uint8Array | null, type: string | null): PdfImage | null {
  const format = type === "image/png" ? "png" : type === "image/jpeg" ? "jpg" : null;
  return bytes && format ? { data: Buffer.from(bytes), format } : null;
}

function toPdfFooter(bytes: Uint8Array | null, type: string | null): PdfFooter | null {
  const image = toPdfImage(bytes, type);
  const size = bytes && imageSize(bytes);
  return image && size && size.width > 0 ? { image, aspect: size.height / size.width } : null;
}

/** Company logo and print footer for document PDFs. */
export async function loadPdfImages() {
  const settings = await prisma.appSettings.findUnique({
    where: { id: 1 },
    select: { companyLogo: true, companyLogoType: true, printFooter: true, printFooterType: true },
  });
  return {
    logo: toPdfImage(settings?.companyLogo ?? null, settings?.companyLogoType ?? null),
    footer: toPdfFooter(settings?.printFooter ?? null, settings?.printFooterType ?? null),
  };
}
