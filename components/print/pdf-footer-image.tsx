import "server-only";

import { Image } from "@react-pdf/renderer";

import type { PdfImage } from "@/lib/pdf-images";

const IMAGE_HEIGHT = 52;
const IMAGE_BOTTOM = 12;

/** Bottom offset for the page-number line when the footer image is shown. */
export const PDF_FOOTER_TEXT_BOTTOM = IMAGE_BOTTOM + IMAGE_HEIGHT + 6;
/** Page bottom padding that keeps content clear of the footer image and page-number line. */
export const PDF_FOOTER_PADDING = PDF_FOOTER_TEXT_BOTTOM + 22;

/** The uploaded print footer, drawn at the bottom of every PDF page. */
export function PdfFooterImage({ image, inset }: { image: PdfImage | null; inset: number }) {
  if (!image) return null;
  return (
    // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image, not an HTML img
    <Image
      fixed
      src={image}
      style={{ position: "absolute", bottom: IMAGE_BOTTOM, left: inset, right: inset, height: IMAGE_HEIGHT, objectFit: "contain" }}
    />
  );
}
