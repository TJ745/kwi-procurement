import { z } from "zod";

// Signature boxes printed on document PDFs, set in Settings › Signatures.
// Shared by the settings form, the Server Action and the PDF routes.

export type Signatory = { title: string; position: string; name: string };

const box = (title: string, position = ""): Signatory => ({ title, position, name: "" });

/** Documents with signature boxes, their box count (fixed by the PDF layout) and defaults. */
export const SIGNATORY_DOCUMENTS = [
  {
    key: "materialRequest",
    label: "Material Request",
    defaults: [box("Reviewed By"), box("Authorized By"), box("Approved By", "General Manager")],
  },
  {
    key: "purchaseOrder",
    label: "Purchase Order",
    defaults: [box("Prepared By"), box("Approved By", "General Manager")],
  },
  {
    key: "paymentRequest",
    label: "Payment Request",
    defaults: [
      box("Prepared By"),
      box("Checked By", "Accounts Dept."),
      box("Approved By", "General Manager"),
      box("Executive Director"),
      box("Finance Department"),
      box(""),
    ],
  },
  {
    key: "goodsReceipt",
    label: "GRN",
    defaults: [box("Prepared By"), box("Received By", "Store Keeper"), box("Inspected By", "Production Manager")],
  },
] as const;

export type SignatoryDocument = (typeof SIGNATORY_DOCUMENTS)[number]["key"];

const text = (label: string, max: number) =>
  z.string().trim().max(max, `${label} must be at most ${max} characters.`);

const signatorySchema = z.object({
  title: text("Title", 60),
  position: text("Position", 100),
  name: text("Name", 100),
});

const boxes = (count: number) => z.array(signatorySchema).length(count);

export const signatoriesSchema = z.object({
  materialRequest: boxes(3),
  purchaseOrder: boxes(2),
  paymentRequest: boxes(6),
  goodsReceipt: boxes(3),
});

export type Signatories = z.infer<typeof signatoriesSchema>;

const DEFAULTS = Object.fromEntries(
  SIGNATORY_DOCUMENTS.map((document) => [document.key, document.defaults.map((entry) => ({ ...entry }))]),
) as Signatories;

/** The saved signatories, falling back to the defaults per document when missing or invalid. */
export function readSignatories(saved: unknown): Signatories {
  const value = (saved ?? {}) as Record<string, unknown>;
  return Object.fromEntries(
    SIGNATORY_DOCUMENTS.map(({ key }) => {
      const parsed = signatoriesSchema.shape[key].safeParse(value[key]);
      return [key, parsed.success ? parsed.data : DEFAULTS[key]];
    }),
  ) as Signatories;
}

/** One document's boxes; an empty name in the first box prints the document's creator. */
export function documentSignatories(saved: unknown, document: SignatoryDocument, creatorName: string): Signatory[] {
  return readSignatories(saved)[document].map((entry, index) =>
    index === 0 && !entry.name ? { ...entry, name: creatorName } : entry,
  );
}
