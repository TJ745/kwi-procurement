/** Goods Received Note options and quantity rules (shared by client and server). */

export const GRN_STATUSES = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"] as const;
export type GrnStatusValue = (typeof GRN_STATUSES)[number];
export const GRN_STATUS_LABELS: Record<GrnStatusValue, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};
/** Approved GRNs are part of the record and cannot be deleted. */
export const LOCKED_GRN_STATUSES: readonly GrnStatusValue[] = ["APPROVED"];

export const DELIVERY_METHODS = [
  { value: "AIR_FREIGHT", label: "Air Freight" },
  { value: "LOCAL_DELIVERY", label: "Local Delivery" },
  { value: "PICK_UP", label: "Pick-up" },
] as const;
export type DeliveryMethodValue = (typeof DELIVERY_METHODS)[number]["value"];
export function deliveryMethodLabel(value: string) {
  return DELIVERY_METHODS.find((option) => option.value === value)?.label ?? value;
}

/** Purchase orders goods can be received against. */
export const RECEIVABLE_PO_STATUSES = ["APPROVED", "ISSUED"] as const;

// Quantities have 2 decimals; work in whole hundredths so the maths is exact.
const isQty = (value: string) => /^\d{1,12}(\.\d{1,2})?$/.test(value.trim());

function toHundredths(value: string) {
  const [whole, fraction = ""] = value.trim().split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

function fromHundredths(value: number) {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/** Ordered minus already-accepted, never below zero. */
export function outstandingQuantity(ordered: string, acceptedBefore: string) {
  return fromHundredths(Math.max(0, toHundredths(ordered) - toHundredths(acceptedBefore)));
}

/**
 * Short / Excess compare Received with the quantity still outstanding;
 * Accepted = Received − Rejected. Unparseable input counts as 0.
 */
export function lineQuantities(outstanding: string, received: string, rejected: string) {
  const out = isQty(outstanding) ? toHundredths(outstanding) : 0;
  const rec = isQty(received) ? toHundredths(received) : 0;
  const rej = isQty(rejected) ? toHundredths(rejected) : 0;
  return {
    short: fromHundredths(Math.max(0, out - rec)),
    excess: fromHundredths(Math.max(0, rec - out)),
    accepted: fromHundredths(Math.max(0, rec - rej)),
  };
}
