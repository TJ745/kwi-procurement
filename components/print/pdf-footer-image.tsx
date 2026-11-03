import "server-only";

import { Image } from "@react-pdf/renderer";

import type { PdfFooter } from "@/lib/pdf-images";

/** A4 page widths in points. */
export const A4_WIDTH = { portrait: 595.28, landscape: 841.89 } as const;

const IMAGE_BOTTOM = 12;
/** Guards against a very tall image swallowing the page. */
const MAX_IMAGE_HEIGHT = 140;

export type PdfFooterLayout = {
  footer: PdfFooter;
  inset: number;
  height: number;
  /** Bottom offset for the page-number line, just above the image. */
  textBottom: number;
  /** Page bottom padding that keeps content clear of the image and page-number line. */
  padding: number;
};

/** Sizes the footer to span the page between the side margins, keeping its proportions. */
export function pdfFooterLayout(
  footer: PdfFooter | null,
  { pageWidth, inset }: { pageWidth: number; inset: number },
): PdfFooterLayout | null {
  if (!footer) return null;
  const height = Math.min((pageWidth - inset * 2) * footer.aspect, MAX_IMAGE_HEIGHT);
  const textBottom = IMAGE_BOTTOM + height + 6;
  return { footer, inset, height, textBottom, padding: textBottom + 22 };
}

/** The uploaded print footer, drawn at the bottom of every PDF page. */
export function PdfFooterImage({ layout }: { layout: PdfFooterLayout | null }) {
  if (!layout) return null;
  return (
    // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image, not an HTML img
    <Image
      fixed
      src={layout.footer.image}
      style={{
        position: "absolute",
        bottom: IMAGE_BOTTOM,
        left: layout.inset,
        right: layout.inset,
        height: layout.height,
        objectFit: "contain",
      }}
    />
  );
}
