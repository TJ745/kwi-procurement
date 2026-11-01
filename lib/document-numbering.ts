/** Document types whose numbers are configured in Settings. */
export const DOCUMENT_TYPES = [
  { type: "MATERIAL_REQUEST", label: "Material Request" },
  { type: "PURCHASE_ORDER", label: "Purchase Order" },
  { type: "PAYMENT_REQUEST", label: "Payment Request" },
  { type: "GRN", label: "Goods Received Note" },
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number]["type"];

export function isDocumentType(value: string): value is DocumentType {
  return DOCUMENT_TYPES.some((item) => item.type === value);
}

export type NumberingFormat = {
  prefix: string;
  includeYear: boolean;
  padding: number;
};

/** e.g. MR-2026-0001, or MR-0001 without the year. */
export function formatDocumentNumber(
  format: NumberingFormat,
  sequence: number,
  year: number,
) {
  const number = String(sequence).padStart(format.padding, "0");
  return [format.prefix, format.includeYear && String(year), number]
    .filter(Boolean)
    .join("-");
}
