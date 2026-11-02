import "server-only";

import { TZDate } from "@date-fns/tz";
import { differenceInCalendarDays, format } from "date-fns";

import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { type AuthContext, requirePermission } from "@/lib/session";

const ZERO = new Prisma.Decimal(0);
const ISO = /^\d{4}-\d{2}-\d{2}$/;
/** POs that represent an amount owed / a commitment. */
const COMMITTED_PO = ["APPROVED", "ISSUED", "CLOSED"] as const;

export type DateRange = { from: string; to: string };

/** `?from=&to=` as calendar dates; defaults to 1 Jan of this year → today. */
export function parseDateRange(
  searchParams: Record<string, string | string[] | undefined>,
  settings: AuthContext["settings"],
): DateRange {
  const today = format(new TZDate(new Date(), settings.timeZone), "yyyy-MM-dd");
  const pick = (value: string | string[] | undefined) =>
    typeof value === "string" && ISO.test(value) && !Number.isNaN(Date.parse(value)) ? value : undefined;
  let from = pick(searchParams.from) ?? `${today.slice(0, 4)}-01-01`;
  let to = pick(searchParams.to) ?? today;
  if (from > to) [from, to] = [to, from];
  return { from, to };
}

const asDate = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const inRange = (range: DateRange) => ({ gte: asDate(range.from), lte: asDate(range.to) });
export const pickId = (value: string | string[] | undefined) =>
  typeof value === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(value) ? value : undefined;

/** Names only, for report filters. */
export async function reportFilterOptions() {
  await requirePermission("reports:view");
  const [suppliers, projects] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.project.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
  ]);
  return {
    suppliers: suppliers.map((s) => ({ value: s.id, label: s.name })),
    projects: projects.map((p) => ({ value: p.id, label: `${p.code} – ${p.name}` })),
  };
}

// --- Supplier statement of account ----------------------------------------

export type StatementRow = {
  key: string;
  date: Date;
  type: "Purchase order" | "Payment";
  reference: string;
  href: string;
  description: string;
  credit: Prisma.Decimal;
  debit: Prisma.Decimal;
  balance: Prisma.Decimal;
};

/**
 * Amount owed = approved/issued/closed POs (credit); payments = Paid payment
 * requests for the supplier (debit). Balance = credits − debits, per currency,
 * starting from the balance before the range.
 */
export async function supplierStatement(supplierId: string, range: DateRange) {
  await requirePermission("reports:view");
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: { id: true, name: true, address: true, vat: true, paymentTerm: true, creditDays: true },
  });
  if (!supplier) return null;

  const [orders, payments] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where: { supplierId, status: { in: [...COMMITTED_PO] }, orderDate: { lte: asDate(range.to) } },
      select: { id: true, number: true, orderDate: true, currency: true, total: true, category: { select: { name: true } } },
    }),
    prisma.paymentRequest.findMany({
      where: {
        status: "PAID",
        requestDate: { lte: asDate(range.to) },
        OR: [{ supplierId }, { purchaseOrder: { supplierId } }],
      },
      select: { id: true, number: true, requestDate: true, currency: true, amount: true, description: true, purchaseOrder: { select: { number: true } } },
    }),
  ]);

  type Entry = Omit<StatementRow, "balance"> & { currency: string };
  const entries: Entry[] = [
    ...orders.map((o) => ({
      key: `po-${o.id}`,
      date: o.orderDate,
      type: "Purchase order" as const,
      reference: o.number,
      href: `/purchase-orders/${o.id}`,
      description: o.category.name,
      credit: o.total,
      debit: ZERO,
      currency: o.currency,
    })),
    ...payments.map((p) => ({
      key: `pr-${p.id}`,
      date: p.requestDate,
      type: "Payment" as const,
      reference: p.number,
      href: `/payment-requests/${p.id}`,
      description: p.purchaseOrder ? `${p.description} (${p.purchaseOrder.number})` : p.description,
      credit: ZERO,
      debit: p.amount,
      currency: p.currency,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime() || (a.type === b.type ? a.reference.localeCompare(b.reference) : a.type === "Purchase order" ? -1 : 1));

  const start = asDate(range.from).getTime();
  const currencies = [...new Set(entries.map((e) => e.currency))].sort();
  const sections = currencies.map((currency) => {
    const mine = entries.filter((e) => e.currency === currency);
    const opening = mine
      .filter((e) => e.date.getTime() < start)
      .reduce((sum, e) => sum.plus(e.credit).minus(e.debit), ZERO);
    let balance = opening;
    const rows: StatementRow[] = mine
      .filter((e) => e.date.getTime() >= start)
      .map((e) => {
        balance = balance.plus(e.credit).minus(e.debit);
        return { ...e, balance };
      });
    return {
      currency,
      opening,
      rows,
      totalCredit: rows.reduce((sum, r) => sum.plus(r.credit), ZERO),
      totalDebit: rows.reduce((sum, r) => sum.plus(r.debit), ZERO),
      closing: balance,
    };
  });
  return { supplier, sections };
}

// --- Materials used in projects ---------------------------------------------

/** Accepted quantities on approved GRNs, per project and item. */
export async function projectMaterials(range: DateRange, projectId?: string) {
  await requirePermission("reports:view");
  const lines = await prisma.goodsReceiptLine.findMany({
    where: {
      acceptedQty: { gt: 0 },
      goodsReceipt: { status: "APPROVED", receiptDate: inRange(range), ...(projectId && { projectId }) },
    },
    select: {
      description: true,
      unit: true,
      itemCode: true,
      acceptedQty: true,
      goodsReceipt: { select: { id: true, receiptDate: true, project: { select: { id: true, code: true, name: true } } } },
    },
  });
  type Item = { description: string; unit: string; itemCodes: Set<string>; accepted: Prisma.Decimal; grns: Set<string>; last: Date };
  const projects = new Map<string, { code: string; name: string; items: Map<string, Item> }>();
  for (const line of lines) {
    const { project } = line.goodsReceipt;
    const entry = projects.get(project.id) ?? { code: project.code, name: project.name, items: new Map() };
    projects.set(project.id, entry);
    const key = `${line.description.toLowerCase()}|${line.unit.toLowerCase()}`;
    const item = entry.items.get(key) ?? { description: line.description, unit: line.unit, itemCodes: new Set(), accepted: ZERO, grns: new Set(), last: line.goodsReceipt.receiptDate };
    item.accepted = item.accepted.plus(line.acceptedQty);
    item.grns.add(line.goodsReceipt.id);
    if (line.itemCode) item.itemCodes.add(line.itemCode);
    if (line.goodsReceipt.receiptDate > item.last) item.last = line.goodsReceipt.receiptDate;
    entry.items.set(key, item);
  }
  return [...projects.entries()]
    .map(([id, p]) => ({
      id,
      code: p.code,
      name: p.name,
      items: [...p.items.values()]
        .map((i) => ({ ...i, itemCodes: [...i.itemCodes].join(", "), grnCount: i.grns.size }))
        .sort((a, b) => a.description.localeCompare(b.description)),
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

// --- Pending deliveries ------------------------------------------------------

/** Approved/issued PO lines with quantity still outstanding. */
export async function pendingDeliveries(filters: { supplierId?: string; projectId?: string }) {
  await requirePermission("reports:view");
  const orderWhere: Prisma.PurchaseOrderWhereInput = {
    status: { in: ["APPROVED", "ISSUED"] },
    ...(filters.supplierId && { supplierId: filters.supplierId }),
    ...(filters.projectId && { projectId: filters.projectId }),
  };
  const [lines, accepted] = await Promise.all([
    prisma.purchaseOrderLine.findMany({
      where: { purchaseOrder: orderWhere },
      orderBy: [{ purchaseOrder: { orderDate: "asc" } }, { lineNo: "asc" }],
      select: {
        id: true,
        name: true,
        unit: true,
        quantity: true,
        purchaseOrder: { select: { id: true, number: true, orderDate: true, supplierName: true, project: { select: { code: true } } } },
      },
    }),
    prisma.goodsReceiptLine.groupBy({
      by: ["purchaseOrderLineId"],
      where: { goodsReceipt: { status: { not: "REJECTED" }, purchaseOrder: orderWhere } },
      _sum: { acceptedQty: true },
    }),
  ]);
  const received = new Map(accepted.map((row) => [row.purchaseOrderLineId, row._sum.acceptedQty ?? ZERO]));
  return lines
    .map((line) => {
      const got = received.get(line.id) ?? ZERO;
      return { ...line, received: got, outstanding: line.quantity.minus(got) };
    })
    .filter((line) => line.outstanding.greaterThan(0));
}

// --- Payments summary ----------------------------------------------------------

type Totals = Map<string, { count: number; amounts: Map<string, Prisma.Decimal> }>;

function addTo(totals: Totals, key: string, currency: string, amount: Prisma.Decimal) {
  const entry = totals.get(key) ?? { count: 0, amounts: new Map() };
  entry.count += 1;
  entry.amounts.set(currency, (entry.amounts.get(currency) ?? ZERO).plus(amount));
  totals.set(key, entry);
}

const toRows = (totals: Totals) =>
  [...totals.entries()].map(([key, value]) => ({
    key,
    count: value.count,
    amounts: [...value.amounts.entries()].sort(([a], [b]) => a.localeCompare(b)),
  }));

/** Payment requests in the range, totalled by status, priority, project and payee. */
export async function paymentsSummary(range: DateRange) {
  await requirePermission("reports:view");
  const requests = await prisma.paymentRequest.findMany({
    where: { requestDate: inRange(range) },
    select: { status: true, priority: true, currency: true, amount: true, inFavorOf: true, project: { select: { code: true, name: true } } },
  });
  const byStatus: Totals = new Map();
  const byPriority: Totals = new Map();
  const byProject: Totals = new Map();
  const byPayee: Totals = new Map();
  for (const r of requests) {
    addTo(byStatus, r.status, r.currency, r.amount);
    addTo(byPriority, r.priority, r.currency, r.amount);
    addTo(byProject, `${r.project.code} – ${r.project.name}`, r.currency, r.amount);
    addTo(byPayee, r.inFavorOf, r.currency, r.amount);
  }
  return {
    count: requests.length,
    byStatus: toRows(byStatus),
    byPriority: toRows(byPriority),
    byProject: toRows(byProject).sort((a, b) => a.key.localeCompare(b.key)),
    byPayee: toRows(byPayee).sort((a, b) => b.count - a.count || a.key.localeCompare(b.key)),
  };
}

// --- Spend by project & category ----------------------------------------------

/** Approved/issued/closed PO totals in the range, per project and per category. */
export async function spendSummary(range: DateRange) {
  await requirePermission("reports:view");
  const orders = await prisma.purchaseOrder.findMany({
    where: { status: { in: [...COMMITTED_PO] }, orderDate: inRange(range) },
    select: { currency: true, total: true, project: { select: { code: true, name: true } }, category: { select: { name: true } } },
  });
  const byProject: Totals = new Map();
  const byCategory: Totals = new Map();
  const overall: Totals = new Map();
  for (const o of orders) {
    addTo(byProject, `${o.project.code} – ${o.project.name}`, o.currency, o.total);
    addTo(byCategory, o.category.name, o.currency, o.total);
    addTo(overall, "All", o.currency, o.total);
  }
  return {
    count: orders.length,
    overall: toRows(overall)[0]?.amounts ?? [],
    byProject: toRows(byProject).sort((a, b) => a.key.localeCompare(b.key)),
    byCategory: toRows(byCategory).sort((a, b) => a.key.localeCompare(b.key)),
  };
}

// --- MRs awaiting a PO ----------------------------------------------------------

/** Approved material requests with no purchase order, oldest first. */
export async function mrsAwaitingPo(settings: AuthContext["settings"]) {
  await requirePermission("reports:view");
  const requests = await prisma.materialRequest.findMany({
    where: { status: "APPROVED", purchaseOrder: null },
    orderBy: { requestDate: "asc" },
    select: {
      id: true,
      number: true,
      requestDate: true,
      project: { select: { code: true, name: true } },
      department: { select: { name: true } },
      category: { select: { name: true } },
      _count: { select: { lines: true } },
    },
  });
  const today = asDate(format(new TZDate(new Date(), settings.timeZone), "yyyy-MM-dd"));
  return requests.map((r) => ({ ...r, ageDays: differenceInCalendarDays(today, r.requestDate) }));
}
