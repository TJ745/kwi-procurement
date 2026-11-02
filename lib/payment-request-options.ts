/** Expense items on a payment request: tick any number, at least one overall. */
export const PAYMENT_ITEM_GROUPS = [
  {
    key: "material",
    label: "Material",
    items: [
      { key: "material.raw_material", label: "Raw Material" },
      { key: "material.assets", label: "Assets" },
      { key: "material.consumables", label: "Consumables" },
      { key: "material.iwi_payments", label: "IWI Payments" },
    ],
  },
  {
    key: "manpower",
    label: "Manpower",
    items: [
      { key: "manpower.salaries", label: "Salaries" },
      { key: "manpower.vacation", label: "Vacation" },
      { key: "manpower.daily_wages", label: "Daily Wages" },
      { key: "manpower.govt_fee", label: "Govt. Fee" },
    ],
  },
  {
    key: "vehicle",
    label: "Vehicle/Equipment",
    items: [
      { key: "vehicle.purchase", label: "Purchase" },
      { key: "vehicle.rent", label: "Rent" },
      { key: "vehicle.repair", label: "Repair" },
      { key: "vehicle.spare_parts", label: "Spare Parts" },
    ],
  },
  {
    key: "subcontract",
    label: "Sub-Contract",
    items: [
      { key: "subcontract.advance_payment", label: "Advance Payment" },
      { key: "subcontract.progress_invoice", label: "Prog. Invoice" },
      { key: "subcontract.retention", label: "Retention" },
      { key: "subcontract.final", label: "Final" },
    ],
  },
  {
    key: "others",
    label: "Others",
    items: [{ key: "others.others", label: "Others" }],
  },
] as const;

export type PaymentItemKey = (typeof PAYMENT_ITEM_GROUPS)[number]["items"][number]["key"];
export const PAYMENT_ITEM_KEYS = PAYMENT_ITEM_GROUPS.flatMap((group) =>
  group.items.map((item) => item.key),
) as [PaymentItemKey, ...PaymentItemKey[]];
export const OTHERS_ITEM: PaymentItemKey = "others.others";

/** Type of Payment: exactly one. */
export const PAYMENT_TYPES = [
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CHEQUE", label: "Issue Cheque" },
  { value: "PETTY_CASH", label: "Petty Cash" },
] as const;

/** Priority: exactly one. */
export const PAYMENT_PRIORITIES = [
  { value: "NORMAL", label: "Normal" },
  { value: "URGENT", label: "Urgent" },
  { value: "TOP_URGENT", label: "Top Urgent" },
] as const;

export type PaymentTypeValue = (typeof PAYMENT_TYPES)[number]["value"];
export type PaymentPriorityValue = (typeof PAYMENT_PRIORITIES)[number]["value"];

export const PAYMENT_REQUEST_STATUSES = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "PAID"] as const;
export type PaymentRequestStatusValue = (typeof PAYMENT_REQUEST_STATUSES)[number];
export const PAYMENT_REQUEST_STATUS_LABELS: Record<PaymentRequestStatusValue, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PAID: "Paid",
};
/** Approved and paid requests are part of the record and cannot be deleted. */
export const LOCKED_PAYMENT_REQUEST_STATUSES: readonly PaymentRequestStatusValue[] = ["APPROVED", "PAID"];

/** Purchase orders that may be paid against. */
export const PAYABLE_PO_STATUSES = ["APPROVED", "ISSUED", "CLOSED"] as const;

export function paymentTypeLabel(value: string) {
  return PAYMENT_TYPES.find((option) => option.value === value)?.label ?? value;
}
export function priorityLabel(value: string) {
  return PAYMENT_PRIORITIES.find((option) => option.value === value)?.label ?? value;
}
