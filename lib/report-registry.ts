/** Reports listed on /reports (each has a page and a print view). */
export const REPORTS = [
  {
    slug: "supplier-statement",
    title: "Supplier statement of account",
    description: "Purchase orders owed and payments made for one supplier, with a running balance.",
  },
  {
    slug: "project-materials",
    title: "Materials used in projects",
    description: "Quantities accepted on approved GRNs, per project and item.",
  },
  {
    slug: "pending-deliveries",
    title: "Pending deliveries",
    description: "Approved and issued PO items not yet fully received.",
  },
  {
    slug: "payments-summary",
    title: "Payments summary",
    description: "Payment requests by status, priority, project and payee.",
  },
  {
    slug: "spend",
    title: "Spend by project & category",
    description: "Purchase order totals per project and per category.",
  },
  {
    slug: "mrs-awaiting-po",
    title: "MRs awaiting a PO",
    description: "Approved material requests that have no purchase order yet.",
  },
] as const;

export type ReportSlug = (typeof REPORTS)[number]["slug"];

export function getReport(slug: ReportSlug) {
  return REPORTS.find((report) => report.slug === slug)!;
}
